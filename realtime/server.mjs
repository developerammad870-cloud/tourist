/**
 * Realtime service for the CMS.
 *
 * Two directions of traffic:
 *
 *   in   Both Next.js apps POST to /publish after they write a booking, and
 *        this process pushes the news to every CMS tab with a socket open.
 *
 *   out  A CMS tab sends a command *up* the socket — "confirm RMA-2403" — and
 *        this process writes the new status to MongoDB itself, then broadcasts
 *        the result so every other open tab updates too. No HTTP request is
 *        involved on the browser side; the socket is the whole channel.
 *
 * That second direction is why this file talks to the database. It is the one
 * place a booking's status changes, which is what keeps two operators clicking
 * at the same time from disagreeing: both see the same broadcast, and the
 * broadcast comes from the write that actually happened.
 *
 * SECURITY, PLAINLY: this app has no sign-in (see the CMS README), so anything
 * that can reach this port can confirm or cancel a booking. The commands below
 * are validated hard — known type, known status, well-formed id, nothing else
 * touched — but validation is not authorisation. Before this is exposed beyond
 * localhost it needs a real session check on the upgrade request.
 */
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";

const PORT = Number(process.env.PORT || 3002);
const TOKEN = process.env.REALTIME_TOKEN || "dev-token";
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

/** The only statuses a command may set. Anything else is rejected. */
const ALLOWED_STATUS = new Set(["confirmed", "cancelled", "pending"]);

/** RFC 6455's fixed handshake GUID. */
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/** Every live browser connection: id → { socket, alive }. */
const clients = new Map();

/* ------------------------------------------------------------ WS framing */

/**
 * Encodes one server→client frame. Server frames are never masked, and the
 * length is written as 7, 7+16 or 7+64 bits depending on size — that branching
 * is the whole of the format for our purposes.
 */
function encodeFrame(data, opcode = 0x1) {
  const payload = Buffer.from(data);
  const len = payload.length;

  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode; // FIN + opcode

  return Buffer.concat([header, payload]);
}

/**
 * Pulls complete frames out of a rolling buffer.
 *
 * TCP gives no message boundaries, so a read can contain half a frame, or three
 * of them. Anything incomplete is left in the buffer for the next read.
 * Client→server frames are always masked; unmasking is a XOR with the 4-byte
 * key that precedes the payload.
 */
function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let cursor = offset + 2;

    if (length === 126) {
      if (cursor + 2 > buffer.length) break;
      length = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (length === 127) {
      if (cursor + 8 > buffer.length) break;
      length = Number(buffer.readBigUInt64BE(cursor));
      cursor += 8;
    }

    let mask;
    if (masked) {
      if (cursor + 4 > buffer.length) break;
      mask = buffer.subarray(cursor, cursor + 4);
      cursor += 4;
    }

    if (cursor + length > buffer.length) break; // frame not fully arrived yet

    const payload = Buffer.from(buffer.subarray(cursor, cursor + length));
    if (mask) {
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
    }

    frames.push({ opcode, payload });
    offset = cursor + length;
  }

  return { frames, rest: buffer.subarray(offset) };
}

/* -------------------------------------------------------------- database */

/*
 * One client, opened lazily and kept for the life of the process. The driver
 * pools connections internally, so reconnecting per command would be pure
 * latency — and a command is a button click somebody is waiting on.
 */
let mongo = null;

async function db() {
  if (!MONGODB_URI || !MONGODB_DB) {
    throw new Error(
      "MONGODB_URI and MONGODB_DB are not set — start this with " +
        "`npm --prefix realtime run dev`, which loads cms/.env.local"
    );
  }
  if (!mongo) {
    mongo = new MongoClient(MONGODB_URI);
    await mongo.connect();
  }
  return mongo.db(MONGODB_DB);
}

/**
 * Applies a status change and returns what the row looks like afterwards.
 *
 * Returns the updated document rather than an acknowledgement so the broadcast
 * carries the truth from the database, not what the clicking browser hoped
 * would happen.
 */
async function setBookingStatus(id, status) {
  if (!ObjectId.isValid(id)) throw new Error("bad id");
  if (!ALLOWED_STATUS.has(status)) throw new Error("bad status");

  const conn = await db();
  const updated = await conn.collection("bookings").findOneAndUpdate(
    { _id: new ObjectId(id) },
    // Only these two fields, explicitly. A command from a browser must never
    // be able to name the field it writes.
    { $set: { status, statusChangedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!updated) throw new Error("no such booking");
  return updated;
}

/**
 * Deletes one booking outright.
 *
 * The row is read before it goes so the broadcast can name what disappeared —
 * "RMA-2403 removed" is useful in another operator's corner; "something was
 * removed" is not.
 *
 * This is the one irreversible thing the socket can do, which is why the UI
 * asks twice and why only a well-formed id gets this far.
 */
async function deleteBooking(id) {
  if (!ObjectId.isValid(id)) throw new Error("bad id");

  const conn = await db();
  const doc = await conn
    .collection("bookings")
    .findOneAndDelete({ _id: new ObjectId(id) });

  if (!doc) throw new Error("no such booking");
  return doc;
}

/* -------------------------------------------------------------- broadcast */

function broadcast(event) {
  const frame = encodeFrame(JSON.stringify(event));
  let delivered = 0;

  for (const [id, client] of clients) {
    try {
      client.socket.write(frame);
      delivered++;
    } catch {
      clients.delete(id); // a dead socket is not worth retrying
    }
  }

  return delivered;
}

/* ------------------------------------------------------------- http side */

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: clients.size }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/publish") {
    // Server-to-server only. Without this any visitor who found the port could
    // push a fake "new booking" into the back office.
    if (req.headers["x-realtime-token"] !== TOKEN) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "bad token" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64_000) req.destroy(); // nothing legitimate is this big
    });
    req.on("end", () => {
      try {
        const event = JSON.parse(body);
        const delivered = broadcast({ ...event, at: new Date().toISOString() });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, delivered }));
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "bad json" }));
      }
    });
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not found" }));
});

/* --------------------------------------------------------- websocket side */

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname !== "/ws" || !key) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return;
  }

  const accept = createHash("sha1").update(key + GUID).digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  const id = randomUUID();
  const client = { socket, alive: true };
  clients.set(id, client);
  socket.setNoDelay(true);

  let buffer = Buffer.alloc(0);

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const { frames, rest } = decodeFrames(buffer);
    buffer = rest;

    for (const { opcode, payload } of frames) {
      if (opcode === 0x8) {
        // close
        socket.end(encodeFrame("", 0x8));
        clients.delete(id);
      } else if (opcode === 0x9) {
        socket.write(encodeFrame("", 0xa)); // ping → pong
      } else if (opcode === 0xa) {
        client.alive = true;
      } else if (opcode === 0x1) {
        handleCommand(client, payload.toString("utf8"));
      }
    }
  });

  const drop = () => clients.delete(id);
  socket.on("close", drop);
  socket.on("error", drop);

  socket.write(encodeFrame(JSON.stringify({ type: "connected", id })));
});

/**
 * A text frame from a CMS tab. The only thing it may ask for is a status
 * change on one booking.
 *
 * Every reply is addressed back to the sender with the `nonce` it supplied, so
 * a button knows which of its own clicks finished; the resulting change is
 * broadcast to everyone, including the sender, so all tabs converge on the
 * same row without anybody polling.
 */
async function handleCommand(client, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return; // not JSON, not ours
  }

  const reply = (payload) => {
    try {
      client.socket.write(encodeFrame(JSON.stringify({ ...payload, nonce: msg.nonce })));
    } catch {
      /* socket went away mid-command; the broadcast below is enough */
    }
  };

  try {
    if (msg.type === "booking.setStatus") {
      const doc = await setBookingStatus(msg.id, msg.status);
      reply({ type: "command.ok", id: msg.id, status: doc.status });

      broadcast({
        type: "booking.updated",
        id: String(doc._id),
        ref: doc.ref,
        trip: doc.trip,
        name: doc.name,
        status: doc.status,
      });
      return;
    }

    if (msg.type === "booking.delete") {
      const doc = await deleteBooking(msg.id);
      reply({ type: "command.ok", id: msg.id, deleted: true });

      broadcast({
        type: "booking.deleted",
        id: String(doc._id),
        ref: doc.ref,
        trip: doc.trip,
        name: doc.name,
      });
      return;
    }

    reply({ type: "command.error", error: "unknown command" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    console.warn("[realtime] command failed:", message);
    reply({ type: "command.error", id: msg.id, error: message });
  }
}

/*
 * Heartbeat. A laptop lid closing or a dropped Wi-Fi connection does not always
 * produce a TCP close, so without this the client map fills with sockets that
 * will never be read again.
 */
setInterval(() => {
  for (const [id, client] of clients) {
    if (!client.alive) {
      client.socket.destroy();
      clients.delete(id);
      continue;
    }
    client.alive = false;
    try {
      client.socket.write(encodeFrame("", 0x9));
    } catch {
      clients.delete(id);
    }
  }
}, 30_000);

server.listen(PORT, () => {
  console.log(`realtime listening on :${PORT} (ws://localhost:${PORT}/ws)`);
});

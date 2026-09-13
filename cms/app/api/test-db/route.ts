import clientPromise from "@/lib/mongodb";
import { guardApi } from "@/lib/session";

export async function GET() {
  const guard = await guardApi("admin");
  if (guard.denied) return guard.denied;

  try {
    const client = await clientPromise;

    await client.db("admin").command({ ping: 1 });

    const { version } = await client.db("admin").command({ buildInfo: 1 });

    return Response.json({
      success: true,
      message: "MongoDB connected successfully!",
      version,
      database: process.env.MONGODB_DB ?? "tourist",
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);

    return Response.json(
      {
        success: false,
        message: "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}

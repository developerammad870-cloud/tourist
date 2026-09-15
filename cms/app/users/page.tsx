"use client";

import { useState, useEffect } from "react";
import s from "../components/ui/ui.module.css";

/**
 * Users admin screen, backed by the local MongoDB:
 * /api/users for list + create, /api/users/[id] for update + delete.
 *
 * `password` is intentionally absent from the list and the edit path — the
 * list route projects it out, and the update route refuses to write it, so an
 * admin edit can't leak or clobber a credential.
 */
const API = "/api/users";

type User = {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: "user" | "admin";
  createdAt?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState<User | null>(null);

  // Bumping this re-runs the fetch effect. Keeping the request inside the
  // effect (rather than calling an async helper from it) lets the load be
  // cancelled on unmount, so a slow response can't set state after teardown.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(API);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.success) {
          throw new Error(data.message ?? `Request failed (${res.status})`);
        }

        setUsers(data.users ?? []);
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't load users from the database."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // ---------- POST / PUT ----------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    const body: Record<string, unknown> = {
      name: form.get("name"),
      username: form.get("username"),
      email: form.get("email"),
      phone: form.get("phone"),
      role: form.get("role"),
    };

    // Creating requires a password, which the API hashes with bcrypt; editing
    // must not send one (the update route refuses to write it).
    if (!editing) body.password = form.get("password");

    const res = await fetch(editing ? `${API}/${editing._id}` : API, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      setFormError(data.message ?? "Something went wrong.");
      return;
    }

    setEditing(null);
    formEl.reset();
    reload();
  }

  // ---------- DELETE ----------
  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete ${label}? This can't be undone.`)) return;

    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      setFormError(data.message ?? "Couldn't delete that user.");
      return;
    }

    if (editing?._id === id) setEditing(null);
    reload();
  }

  return (
    <div className={s.page}>
      <div className={s.head}>
        <p className={s.eyebrow}>Admin</p>
        <h1 className={s.title}>Users</h1>
        <p className={s.lede}>
          Add, edit and remove user records. These are the same accounts that
          sign in on the public website.
        </p>
      </div>

      <div className={s.panel} style={{ marginBottom: "2rem" }}>
        <h2 className={s.itemName} style={{ marginBottom: "1.1rem" }}>
          {editing ? `Edit ${editing.name ?? "user"}` : "Add a user"}
        </h2>

        <form className={s.form} onSubmit={handleSubmit} key={editing?._id ?? "new"}>
          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="u-name">Name</label>
              <input id="u-name" className={s.input} name="name"
                defaultValue={editing?.name ?? ""} placeholder="Full name" required />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="u-username">Username</label>
              {/* Optional: accounts created through sign-up don't have one. */}
              <input id="u-username" className={s.input} name="username"
                defaultValue={editing?.username ?? ""} placeholder="username" />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="u-email">Email</label>
              <input id="u-email" className={s.input} name="email" type="email"
                defaultValue={editing?.email ?? ""} placeholder="you@example.com" required />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="u-phone">Phone</label>
              <input id="u-phone" className={s.input} name="phone"
                defaultValue={editing?.phone ?? ""} placeholder="03xx-xxxxxxx" />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="u-role">Role</label>
              <select id="u-role" className={s.input} name="role"
                defaultValue={editing?.role ?? "user"}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {!editing && (
              <div className={s.field}>
                <label className={s.label} htmlFor="u-password">Password</label>
                <input id="u-password" className={s.input} name="password"
                  type="password" placeholder="At least 8 characters"
                  autoComplete="new-password" minLength={8} required />
              </div>
            )}
          </div>

          {formError && (
            <p className={`${s.notice} ${s.noticeBad}`} role="status">{formError}</p>
          )}

          <div className={s.actions}>
            <button className={`${s.btn} ${s.btnPrimary}`} type="submit">
              {editing ? "Save changes" : "Create user"}
            </button>
            {editing && (
              <button className={`${s.btn} ${s.btnGhost}`} type="button"
                onClick={() => setEditing(null)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <p className={s.loading}>Loading users&hellip;</p>
      ) : error ? (
        <p className={`${s.notice} ${s.noticeBad}`}>{error}</p>
      ) : users.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>No users yet</p>
          <p>Add one with the form above.</p>
        </div>
      ) : (
        <div className={s.grid}>
          {/* Named `person`, not `u` — `s` is the stylesheet here, but keeping
              the row variable descriptive avoids the same shadowing trap. */}
          {users.map((person) => (
            <article className={s.itemCard} key={person._id}>
              <div className={s.headRow}>
                <div>
                  <h2 className={s.itemName}>{person.name}</h2>
                  {person.username && (
                    <p className={s.itemMeta}>@{person.username}</p>
                  )}
                </div>
                {person.role === "admin" && (
                  <span className={`${s.badge} ${s.badgeOk}`}>Admin</span>
                )}
              </div>

              <div className={s.itemRows}>
                {person.email && <span className={s.itemRow}>{person.email}</span>}
                {person.phone && <span className={s.itemRow}>{person.phone}</span>}
              </div>

              <div className={s.cardActions}>
                <button className={`${s.btn} ${s.btnGhost} ${s.btnSmall}`}
                  onClick={() => setEditing(person)}>
                  Edit
                </button>
                <button className={`${s.btn} ${s.btnDanger} ${s.btnSmall}`}
                  onClick={() => handleDelete(person._id, person.name ?? "this user")}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

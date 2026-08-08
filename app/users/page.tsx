'use client';

import { useState, useEffect } from 'react';

const API = 'https://crudcrud.com/api/67af3bfde7ca4c84b7552f91ce02ed29/users';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  async function loadUsers() {
    const res = await fetch(API);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // ---------- POST / PUT ----------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    const body = {
      name: form.get('name'),
      username: form.get('username'),
      email: form.get('email'),
      phone: form.get('phone'),
    };

    if (editing) {
      await fetch(`${API}/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditing(null);
    } else {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    formEl.reset();
    loadUsers();
  }

  // ---------- DELETE ----------
  async function handleDelete(id: string) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (editing?._id === id) setEditing(null);
    loadUsers();
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="users-page">
      <h1>Users</h1>

      <form
        onSubmit={handleSubmit}
        className="user-form"
        key={editing?._id ?? 'new'}
      >
        <h2>{editing ? 'Edit User' : 'Add User'}</h2>

        <input
          name="name"
          placeholder="Name"
          defaultValue={editing?.name ?? ''}
          required
        />
        <input
          name="username"
          placeholder="Username"
          defaultValue={editing?.username ?? ''}
          required
        />
        <input
          name="email"
          placeholder="Email"
          defaultValue={editing?.email ?? ''}
          required
        />
        <input
          name="phone"
          placeholder="Phone"
          defaultValue={editing?.phone ?? ''}
        />

        <div className="form-actions">
          <button type="submit">{editing ? 'Update' : 'Create'}</button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="users-grid">
        {users.map((u) => (
          <div className="user-card" key={u._id}>
            <h2>{u.name}</h2>
            <p className="username">@{u.username}</p>

            <div className="contact">
              <p>{u.email}</p>
              <p>{u.phone}</p>
            </div>

            <div className="card-actions">
              <button onClick={() => setEditing(u)}>Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(u._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



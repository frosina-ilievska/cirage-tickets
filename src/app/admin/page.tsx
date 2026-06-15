"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";

type User = { id: string; name: string; email: string; role: string };
type Category = { id: string; name: string; color: string };

const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", MEMBER: "Member", DESIGNER: "Designer" };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // New user form
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [addingUser, setAddingUser] = useState(false);
  const [userError, setUserError] = useState("");

  // New category form
  const [newCat, setNewCat] = useState({ name: "", color: "#6366f1" });
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState("");

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError("");
    setAddingUser(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [...prev, user]);
      setNewUser({ name: "", email: "", password: "", role: "MEMBER" });
    } else {
      const data = await res.json();
      setUserError(data.error);
    }
    setAddingUser(false);
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Remove this user?")) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatError("");
    setAddingCat(true);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });

    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      setNewCat({ name: "", color: "#6366f1" });
    } else {
      const data = await res.json();
      setCatError(data.error);
    }
    setAddingCat(false);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category? Tickets using it will lose their category.")) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-8">Admin Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Team Members</h2>

            <div className="bg-white rounded-xl border border-gray-200 mb-4">
              <div className="divide-y divide-gray-50">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="DESIGNER">Designer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddUser} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Add team member</h3>

              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={newUser.password}
                onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MEMBER">Member</option>
                <option value="DESIGNER">Designer (freelancer)</option>
                <option value="ADMIN">Admin</option>
              </select>

              {userError && <p className="text-sm text-red-600">{userError}</p>}

              <button
                type="submit"
                disabled={addingUser}
                className="w-full bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {addingUser ? "Adding..." : "Add Member"}
              </button>
            </form>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Categories</h2>

            <div className="bg-white rounded-xl border border-gray-200 mb-4">
              <div className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-900">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Add category</h3>

              <input
                type="text"
                placeholder="Category name"
                value={newCat.name}
                onChange={(e) => setNewCat((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Color:</label>
                <input
                  type="color"
                  value={newCat.color}
                  onChange={(e) => set
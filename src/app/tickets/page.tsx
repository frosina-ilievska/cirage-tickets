"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusBadge, STATUS_OPTIONS } from "@/components/StatusBadge";
import { PriorityBadge, PRIORITY_OPTIONS } from "@/components/PriorityBadge";
import { formatDistanceToNow, isPast } from "date-fns";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  _count: { comments: number };
};

type Category = { id: string; name: string; color: string };
type User = { id: string; name: string; role: string };
type View = "all" | "assigned_me" | "created_me" | "assigned_user" | "created_user";

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", categoryId: "" });
  const [view, setView] = useState<View>("all");
  const [viewUserId, setViewUserId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAssigneeId, setBulkAssigneeId] = useState("");

  const isAdmin = session?.user.role === "ADMIN";
  const isDesigner = session?.user.role === "DESIGNER";
  const myId = session?.user.id;

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    if (isAdmin) fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, [isAdmin]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadTickets = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (search) params.set("search", search);
    if (view === "assigned_me" && myId) params.set("assigneeId", myId);
    if (view === "created_me" && myId) params.set("createdById", myId);
    if (view === "assigned_user" && viewUserId) params.set("assigneeId", viewUserId);
    if (view === "created_user" && viewUserId) params.set("createdById", viewUserId);

    setLoading(true);
    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then((data) => { setTickets(data); setLoading(false); setSelected(new Set()); });
  }, [filters, view, viewUserId, myId, search]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  function setViewAndReset(v: View) {
    setView(v);
    setViewUserId("");
  }

  // Selection helpers
  const allIds = tickets.map((t) => t.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkUpdate(patch: Record<string, unknown>) {
    setBulkLoading(true);
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/tickets/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
      )
    );
    setBulkLoading(false);
    loadTickets();
  }

  const viewLabel =
    view === "all" ? (isDesigner ? "Design Queue" : "All Tickets") :
    view === "assigned_me" ? "Assigned to Me" :
    view === "created_me" ? "Created by Me" :
    view === "assigned_user" ? "Assigned to User" :
    "Created by User";

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
      active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900">{viewLabel}</h1>
          <Link
            href="/tickets/new"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + New Ticket
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tickets…"
            className="w-full sm:w-72 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* View tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setViewAndReset("all")} className={pill(view === "all")}>
            {isDesigner ? "Design Queue" : "All Tickets"}
          </button>
          <button onClick={() => setViewAndReset("assigned_me")} className={pill(view === "assigned_me")}>
            Assigned to Me
          </button>
          <button onClick={() => setViewAndReset("created_me")} className={pill(view === "created_me")}>
            Created by Me
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setViewAndReset("assigned_user")} className={pill(view === "assigned_user")}>
                Assigned to…
              </button>
              <button onClick={() => setViewAndReset("created_user")} className={pill(view === "created_user")}>
                Created by…
              </button>
            </>
          )}
        </div>

        {/* Admin user picker */}
        {isAdmin && (view === "assigned_user" || view === "created_user") && (
          <div className="mb-4">
            <select
              value={viewUserId}
              onChange={(e) => setViewUserId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— pick a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role.charAt(0) + u.role.slice(1).toLowerCase()})</option>
              ))}
            </select>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {!isDesigner && (
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {(filters.status || filters.priority || filters.categoryId || search) && (
            <button
              onClick={() => { setFilters({ status: "", priority: "", categoryId: "" }); setSearchInput(""); }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-indigo-700">{selected.size} selected</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => bulkUpdate({ status: "DONE" })}
                disabled={bulkLoading}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                ✓ Mark Done
              </button>
              <button
                onClick={() => bulkUpdate({ status: "ARCHIVED" })}
                disabled={bulkLoading}
                className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                Archive
              </button>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <select
                    value={bulkAssigneeId}
                    onChange={(e) => setBulkAssigneeId(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="">Reassign to…</option>
                    <option value="__unassign__">Unassign</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  {bulkAssigneeI
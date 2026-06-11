"use client";

import { useEffect, useState } from "react";
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

  const isAdmin = session?.user.role === "ADMIN";
  const isDesigner = session?.user.role === "DESIGNER";
  const myId = session?.user.id;

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    if (isAdmin) {
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
  }, [isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);

    if (view === "assigned_me" && myId) params.set("assigneeId", myId);
    if (view === "created_me" && myId) params.set("createdById", myId);
    if (view === "assigned_user" && viewUserId) params.set("assigneeId", viewUserId);
    if (view === "created_user" && viewUserId) params.set("createdById", viewUserId);

    setLoading(true);
    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then((data) => { setTickets(data); setLoading(false); });
  }, [filters, view, viewUserId, myId]);

  function setViewAndReset(v: View) {
    setView(v);
    setViewUserId("");
  }

  const viewLabel =
    view === "all" ? (isDesigner ? "Design Queue" : "All Tickets") :
    view === "assigned_me" ? "Assigned to Me" :
    view === "created_me" ? "Created by Me" :
    view === "assigned_user" ? "Assigned to User" :
    "Created by User";

  const pillBase = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border";
  const pillActive = "bg-gray-900 text-white border-gray-900";
  const pillInactive = "bg-white text-gray-600 border-gray-200 hover:border-gray-400";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{viewLabel}</h1>
          <Link
            href="/tickets/new"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + New Ticket
          </Link>
        </div>

        {/* View tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setViewAndReset("all")}
            className={`${pillBase} ${view === "all" ? pillActive : pillInactive}`}
          >
            {isDesigner ? "Design Queue" : "All Tickets"}
          </button>
          <button
            onClick={() => setViewAndReset("assigned_me")}
            className={`${pillBase} ${view === "assigned_me" ? pillActive : pillInactive}`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setViewAndReset("created_me")}
            className={`${pillBase} ${view === "created_me" ? pillActive : pillInactive}`}
          >
            Created by Me
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setViewAndReset("assigned_user")}
                className={`${pillBase} ${view === "assigned_user" ? pillActive : pillInactive}`}
              >
                Assigned to…
              </button>
              <button
                onClick={() => setViewAndReset("created_user")}
                className={`${pillBase} ${view === "created_user" ? pillActive : pillInactive}`}
              >
                Created by…
              </button>
            </>
          )}
        </div>

        {/* Admin user picker — shown when "Assigned to…" or "Created by…" is active */}
        {isAdmin && (view === "assigned_user" || view === "created_user") && (
          <div className="mb-4">
            <select
              value={viewUserId}
              onChange={(e) => setViewUserId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— pick a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.charAt(0) + u.role.slice(1).toLowerCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
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

          {(filters.status || filters.priority || filters.categoryId) && (
            <button
              onClick={() => setFilters({ status: "", priority: "", categoryId: "" })}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Tickets list */}
        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">No tickets found.</p>
              <Link href="/tickets/new" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                Create one →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((ticket) => {
                const isOverdue = ticket.dueDate && isPast(new Date(ticket.dueDate)) && !["DONE", "ARCHIVED"].includes(ticket.status);
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {ticket.category && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.category.color }} />
                        )}
                        <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                        {ticket._count.comments > 0 && (
                          <span className="text-xs text-gray-400 ml-1">💬 {ticket._count.comments}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <PriorityBadge priority={ticket.priority} />
                        {ticket.category && <span className="text-xs text-gray-400">{ticket.category.name}</span>}
                        <span className="text-xs text-gray-400">by {ticket.createdBy.name}</span>
                        {ticket.assignee
                          ? <span className="text-xs text-gray-400">→ {ticket.assignee.name}</span>
                          : <span className="text-xs text-amber-600 font-medium">Unassigned</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
                      {ticket.dueDate && (
                        <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
                          {isOverdue ? "⚠ Overdue" : formatDistanceToNow(new Date(ticket.dueDate), { addSuffix: true })}
                        </span>
                      )}
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

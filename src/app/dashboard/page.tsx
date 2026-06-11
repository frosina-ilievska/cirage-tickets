"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { formatDistanceToNow, isPast } from "date-fns";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  category: { name: string; color: string } | null;
  assignee: { name: string } | null;
  _count: { comments: number };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => { setTickets(data); setLoading(false); });
  }, []);

  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = tickets.filter((t) => t.status === "IN_REVIEW").length;
  const overdue = tickets.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && !["DONE", "ARCHIVED"].includes(t.status)
  ).length;

  const recent = [...tickets]
    .filter((t) => !["DONE", "ARCHIVED"].includes(t.status))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Good {getGreeting()}, {session?.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what&apos;s happening today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Open", value: open, color: "text-gray-700" },
            { label: "In Progress", value: inProgress, color: "text-blue-700" },
            { label: "In Review", value: inReview, color: "text-amber-700" },
            { label: "Overdue", value: overdue, color: overdue > 0 ? "text-red-600" : "text-gray-700" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-3xl font-semibold mt-1 ${stat.color}`}>{loading ? "—" : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent tickets */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Active Tickets</h2>
            <Link href="/tickets" className="text-xs text-indigo-600 hover:text-indigo-800">View all →</Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">No active tickets.</p>
              <Link href="/tickets/new" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                Create your first ticket →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((ticket) => {
                const isOverdue = ticket.dueDate && isPast(new Date(ticket.dueDate)) && !["DONE", "ARCHIVED"].includes(ticket.status);
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {ticket.category && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ticket.category.color }}
                          />
                        )}
                        <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <PriorityBadge priority={ticket.priority} />
                        {ticket.category && (
                          <span className="text-xs text-gray-400">{ticket.category.name}</span>
                        )}
                        {ticket.assignee && (
                          <span className="text-xs text-gray-400">→ {ticket.assignee.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {ticket.dueDate && (
                        <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
                          {isOverdue ? "Overdue · " : "Due "}
                          {formatDistanceToNow(new Date(ticket.dueDate), { addSuffix: true })}
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, isPast } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { StatusBadge, STATUS_OPTIONS } from "@/components/StatusBadge";
import { PriorityBadge, PRIORITY_OPTIONS } from "@/components/PriorityBadge";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CommentSection } from "@/components/CommentSection";

type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  driveLink: string | null;
  createdAt: string;
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string; email: string; role: string } | null;
  createdBy: { id: string; name: string };
  comments: { id: string; content: string; createdAt: string; author: { id: string; name: string }; attachments: { id: string; name: string; url: string; fileType: string }[] }[];
  activities: { id: string; action: string; createdAt: string; user: { id: string; name: string } }[];
  attachments: { id: string; name: string; url: string; fileType: string; commentId: string | null }[];
};

type User = { id: string; name: string; role: string };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tickets/${id}`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([t, u]) => {
      setTicket(t);
      setUsers(u);
      setLoading(false);
    });
  }, [id]);

  const isAdmin = session?.user.role === "ADMIN";
  const isAssignee = ticket?.assignee?.id === session?.user.id;
  const isDesigner = session?.user.role === "DESIGNER";
  const canEdit = isAdmin || isAssignee;
  const canClaim = isDesigner && ticket?.category?.name === "Design" && !ticket?.assignee;

  async function updateField(field: string, value: string | null) {
    if (!ticket) return;
    setSaving(true);
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      // Reload to get fresh activities
      const full = await fetch(`/api/tickets/${id}`).then((r) => r.json());
      setTicket(full);
    }
    setSaving(false);
  }

  async function handleClaim() {
    setClaiming(true);
    const res = await fetch(`/api/tickets/${id}/claim`, { method: "POST" });
    if (res.ok) {
      const full = await fetch(`/api/tickets/${id}`).then((r) => r.json());
      setTicket(full);
    }
    setClaiming(false);
  }

  async function handleUpload() {
    if (!uploadFile || !ticket) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("ticketId", ticket.id);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const full = await fetch(`/api/tickets/${id}`).then((r) => r.json());
      setTicket(full);
      setUploadFile(null);
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setUploading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/tickets");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!ticket || (ticket as { error?: string }).error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-gray-500">Ticket not found. <Link href="/tickets" className="text-indigo-600">Go back</Link></p>
        </div>
      </div>
    );
  }

  const isOverdue = ticket.dueDate && isPast(new Date(ticket.dueDate)) && !["DONE", "ARCHIVED"].includes(ticket.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href="/tickets" className="text-sm text-gray-400 hover:text-gray-600">← Tickets</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & status bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-lg font-semibold text-gray-900 flex-1">{ticket.title}</h1>
                <div className="flex items-center gap-2">
                  {canClaim && (
                    <button
                      onClick={handleClaim}
                      disabled={claiming}
                      className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {claiming ? "Claiming..." : "Claim Ticket"}
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                  )}
                </div>
              </div>

              {ticket.description && (
                <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
              )}

              {/* Status change */}
              {canEdit && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400 self-center mr-1">Status:</span>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateField("status", s.value)}
                      disabled={saving}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        ticket.status === s.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Attachments</h3>

              {ticket.attachments.filter((a) => !a.commentId).length > 0 && (
                <div className="space-y-2 mb-4">
                  {ticket.attachments.filter((a) => !a.commentId).map((a) => (
                    a.fileType === "image" ? (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block">
                        <img src={a.url} alt={a.name} className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-contain hover:opacity-90" />
                      </a>
                    ) : (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        <span>📎</span> {a.name}
                      </a>
                    )
                  ))}
                </div>
              )}

              {ticket.driveLink && (
                <a
                  href={ticket.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:underline mb-4"
                >
                  <span>🔗</span> External link (Drive/Dropbox)
                </a>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="text-xs text-gray-500 file:mr-3 file:text-xs file:border file:border-gray-200 file:rounded file:px-2 file:py-1 file:bg-white"
                />
                {uploadFile && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Max 5MB. For larger files, use the Drive/Dropbox link on the ticket.</p>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <CommentSection ticketId={ticket.id} initialComments={ticket.comments} />
            </div>
          </div>

          {/* Right: metadata + activity */}
          <div className="space-y-6">
            {/* Metadata card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Details</h3>

              <Field label="Status"><StatusBadge status={ticket.status} /></Field>

              <Field label="Priority">
                {canEdit ? (
                  <select
                    value={ticket.priority}
                    onChange={(e) => updateField("priority", e.target.value)}
                    disabled={saving}
                    className="text-sm border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
              </Field>

              <Field label="Category">
                <span className="text-sm text-gray-700">
                  {ticket.category ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                      {ticket.category.name}
                    </span>
                  ) : "—"}
                </span>
              </Field>

              <Field label="Assignee">
                {canEdit ? (
                  <select
                    value={ticket.assignee?.id || ""}
                    onChange={(e) => updateField("assigneeId", e.target.value || null)}
                    disabled={saving}
                    className="text-sm border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                ) : (
                  <span className="text-sm text-gray-700">{ticket.assignee?.name || "Unassigned"}</span>
                )}
              </Field>

              <Field label="Due date">
                {canEdit ? (
                  <input
                    type="date"
                    value={ticket.dueDate ? format(new Date(ticket.dueDate), "yyyy-MM-dd") : ""}
                    onChange={(e) => updateField("dueDate", e.target.value || null)}
                    disabled={saving}
                    className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <span className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-700"}`}>
                    {ticket.dueDate ? format(new Date(ticket.dueDate), "dd MMM yyyy") : "—"}
                    {isOverdue ? " ⚠ Overdue" : ""}
                  </span>
                )}
              </Field>

              <Field label="Created by">
                <span className="text-sm text-gray-700">{ticket.createdBy.name}</span>
              </Field>

              <Field label="Created">
                <span className="text-sm text-gray-500">{format(new Date(ticket.createdAt), "dd MMM yyyy")}</span>
              </Field>
            </div>

            {/* Activity feed */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
              <ActivityFeed activities={ticket.activities} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

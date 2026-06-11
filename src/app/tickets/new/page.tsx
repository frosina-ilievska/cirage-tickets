"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { PRIORITY_OPTIONS } from "@/components/PriorityBadge";

type User = { id: string; name: string; role: string };
type Category = { id: string; name: string; color: string };

const NL_TEMPLATE = `📧 NEWSLETTER BRIEF
-------------------

SUBJECT LINE:
(Write 1–3 options, max 50 characters each)

PREHEADER TEXT:
(1 line, ~80–100 characters — visible in inbox preview)

SEND DATE & TIME:

TARGET AUDIENCE / SEGMENT:
(e.g. All subscribers / VIP / French-speaking / etc.)

-------------------
SECTIONS
-------------------

[SECTION 1 — HEADER]
Image: (logo or hero visual — describe or link)

[SECTION 2 — HERO / MAIN MESSAGE]
Headline:
Body copy:
CTA button text:
CTA link:

[SECTION 3 — PRODUCT / COLLECTION]
Product name(s):
Short description:
Image(s): (link to Drive/Dropbox folder)
Price / promo if applicable:
CTA button text:
CTA link:

[SECTION 4 — SECONDARY BLOCK]
(Optional — use for a second product, story, or editorial)
Headline:
Body copy:
CTA button text:
CTA link:

[SECTION 5 — FOOTER]
Any special footer note? (default footer is fine — leave blank if so)

-------------------
NOTES FOR DESIGNER
-------------------
Colour palette / mood:
Reference images or past NLs to follow:
Anything to avoid:
`;

export default function NewTicketPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [descriptionTouched, setDescriptionTouched] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    categoryId: "",
    assigneeId: "",
    dueDate: "",
    driveLink: "",
  });

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function handleCategoryChange(categoryId: string) {
    const selected = categories.find((c) => c.id === categoryId);
    const isEmailNL = selected?.name.toLowerCase().includes("email") || selected?.name.toLowerCase().includes("nl");
    // Only inject if description is empty or untouched
    if (isEmailNL && !descriptionTouched) {
      setForm((f) => ({ ...f, categoryId, description: NL_TEMPLATE }));
    } else {
      set("categoryId", categoryId);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: form.categoryId || null,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
        driveLink: form.driveLink || null,
      }),
    });

    if (res.ok) {
      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">New Ticket</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Short, descriptive title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => { setDescriptionTouched(true); set("description", e.target.value); }}
              rows={form.description.includes("NEWSLETTER BRIEF") ? 18 : 4}
              placeholder="Describe the task in detail..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
            />
            {form.description.includes("NEWSLETTER BRIEF") && (
              <p className="text-xs text-indigo-500 mt-1">📧 NL brief template loaded — fill in each section before creating the ticket.</p>
            )}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <select
                value={form.assigneeId}
                onChange={(e) => set("assigneeId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === session?.user.id ? "(me)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Drive/Dropbox link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drive / Dropbox link
              <span className="text-gray-400 font-normal ml-1">(for large files)</span>
            </label>
            <input
              type="url"
              value={form.driveLink}
              onChange={(e) => set("driveLink", e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create Ticket"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

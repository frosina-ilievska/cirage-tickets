"use client";

import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

type Attachment = { id: string; name: string; url: string; fileType: string };

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
  attachments: Attachment[];
};

export function CommentSection({
  ticketId,
  initialComments,
}: {
  ticketId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const pasted = item.getAsFile();
        if (pasted) {
          setFile(pasted);
          setPreview(URL.createObjectURL(pasted));
        }
      }
    }
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setSubmitting(true);
    setError("");

    // Post comment first
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() || "(see attachment)" }),
    });

    if (!res.ok) {
      setError("Failed to post comment");
      setSubmitting(false);
      return;
    }

    const comment: Comment = await res.json();

    // If there's a file, upload it and link to this comment
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File too large (max 5MB)");
        setSubmitting(false);
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("ticketId", ticketId);
      fd.append("commentId", comment.id);

      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (upRes.ok) {
        const attachment = await upRes.json();
        comment.attachments = [attachment];
      } else {
        const data = await upRes.json();
        setError(data.error || "File upload failed");
      }
    }

    setComments((prev) => [...prev, comment]);
    setContent("");
    removeFile();
    setSubmitting(false);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Comments</h3>

      {/* Comment list */}
      <div className="space-y-5 mb-6">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400">No comments yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {comment.author.name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              {comment.content !== "(see attachment)" && (
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
              )}
              {/* Inline attachments */}
              {comment.attachments?.map((a) =>
                a.fileType === "image" ? (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block mt-2">
                    <img
                      src={a.url}
                      alt={a.name}
                      className="max-w-sm max-h-64 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 mt-2 text-sm text-indigo-600 hover:underline"
                  >
                    📎 {a.name}
                  </a>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="Add a comment… or paste a screenshot directly"
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Image preview */}
        {preview && (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 rounded-lg border border-gray-200 object-contain"
            />
            <button
              type="button"
              onClick={removeFile}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* File name (non-image) */}
        {file && !preview && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📎 {file.name}</span>
            <button type="button" onClick={removeFile} className="text-gray-400 hover:text-red-500 text-xs">Remove</button>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          {/* Attach button */}
          <label className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <span>📎</span>
            <span className="text-xs">Attach</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-gray-300">or paste a screenshot</span>
          <div className="flex-1" />
          <button
            type="submit"
            disabled={submitting || (!content.trim() && !file)}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

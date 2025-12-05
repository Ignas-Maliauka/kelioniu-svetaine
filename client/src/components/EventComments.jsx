import React from "react";

export default function EventComments({
  id,
  comments,
  commentsLoading,
  commentsPage,
  commentsTotal,
  COMMENTS_PAGE_SIZE,
  setCommentsPage,
  loadComments,
  isOrganiser,
  isOwner,
  currentUserId,
  token,
  postingComment,
  setPostingComment,
  newComment,
  setNewComment,
}) {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium mb-2">Comments</h2>
      <div className="p-3 border rounded bg-white mb-3">
        {isOrganiser ? (
          <>
            <textarea className="w-full p-2 border" rows={3} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." />
            <div className="flex justify-end mt-2 gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={async () => {
                  if (!newComment || !newComment.trim()) return alert("Enter a comment");
                  setPostingComment(true);
                  try {
                    const res = await fetch(`${API_BASE}/api/comments`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({ event: id, content: newComment.trim() }),
                    });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}));
                      throw new Error(d.message || "Failed to post comment");
                    }
                    setNewComment("");
                    await loadComments(1);
                    setCommentsPage(1);
                  } catch (err) {
                    alert(err.message || "Failed to post comment");
                  } finally {
                    setPostingComment(false);
                  }
                }}
                disabled={postingComment}
              >
                {postingComment ? "Posting..." : "Post comment"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-600">Only organisers can post comments.</div>
        )}
      </div>

      <div className="p-3 border rounded bg-white">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-600">No comments yet.</div>
        ) : (
          <>
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c._id} className="p-2 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{c.author?.name || '—'}</div>
                      <div className="text-sm text-gray-700 mt-1">{c.content}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      {(isOwner || (c.author && (c.author._id === currentUserId || c.author === currentUserId))) && (
                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                          onClick={async () => {
                            if (!confirm("Delete this comment?")) return;
                            try {
                              const res = await fetch(`${API_BASE}/api/comments/${c._id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) {
                                const d = await res.json().catch(() => ({}));
                                throw new Error(d.message || "Delete failed");
                              }
                              loadComments(commentsPage);
                            } catch (err) {
                              alert(err.message || "Delete failed");
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <div>
                Showing {comments.length === 0 ? 0 : (commentsPage - 1) * COMMENTS_PAGE_SIZE + 1} - {(commentsPage - 1) * COMMENTS_PAGE_SIZE + comments.length} of {commentsTotal}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-gray-100 rounded border"
                  onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                  disabled={commentsPage <= 1 || commentsLoading}
                >
                  Previous
                </button>
                <div className="px-3 py-1 flex items-center border rounded bg-white">Page {commentsPage} of {Math.max(1, Math.ceil(commentsTotal / COMMENTS_PAGE_SIZE))}</div>
                <button
                  className="px-3 py-1 bg-gray-100 rounded border"
                  onClick={() => setCommentsPage((p) => Math.min(Math.max(1, Math.ceil(commentsTotal / COMMENTS_PAGE_SIZE)), p + 1))}
                  disabled={commentsPage >= Math.max(1, Math.ceil(commentsTotal / COMMENTS_PAGE_SIZE)) || commentsLoading}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

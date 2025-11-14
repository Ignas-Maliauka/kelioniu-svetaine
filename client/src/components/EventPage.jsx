import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function EventPage() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [activities, setActivities] = useState([]);
  const [steps, setSteps] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const COMMENTS_PAGE_SIZE = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newParticipantId, setNewParticipantId] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [searchLoading, setSearchLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [evRes, actRes, stepRes] = await Promise.all([
          fetch(`${API_BASE}/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/activities?event=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/planning-steps?event=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!evRes.ok) {
          const d = await evRes.json().catch(() => ({}));
          throw new Error(d.message || `Failed to load event (${evRes.status})`);
        }

        const ev = await evRes.json();
        const acts = actRes.ok ? await actRes.json() : [];
        const stp = stepRes.ok ? await stepRes.json() : [];

        if (!mounted) return;
        setEvent(ev);
        setActivities(Array.isArray(acts) ? acts : []);
        setSteps(Array.isArray(stp) ? stp : []);
        // comments are loaded separately with pagination
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, token]);

  // load comments with pagination
  async function loadComments(page = commentsPage) {
    if (!token) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/comments?event=${encodeURIComponent(id)}&limit=${COMMENTS_PAGE_SIZE}&page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Failed to load comments (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setComments(data);
        setCommentsTotal(data.length);
      } else {
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setCommentsTotal(typeof data.total === "number" ? data.total : 0);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("loadComments error:", err.message || err);
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    if (!token || !id) return;
    loadComments(commentsPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, commentsPage]);

  async function deleteActivity(aid) {
    if (!confirm("Delete this activity?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/activities/${aid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Delete failed");
      }
      setActivities((prev) => prev.filter((a) => a._id !== aid));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  async function deleteStep(sid) {
    if (!confirm("Delete this planning step?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/planning-steps/${sid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Delete failed");
      }
      setSteps((prev) => prev.filter((s) => s._id !== sid));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  if (!token) return <p className="p-4">Please log in.</p>;
  if (loading) return <p className="p-4">Loading event...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!event) return <p className="p-4">Event not found.</p>;

  const currentUserId = user?.id || user?._id;
  const isOrganiser =
    event.organiser &&
    ((event.organiser._id && event.organiser._id === currentUserId) ||
      event.organiser === currentUserId);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{event.title || "Untitled event"}</h1>
          <div className="text-sm text-gray-600">{event.description}</div>
          <div className="text-sm text-gray-500 mt-1">
            {event.startDate ? `Start: ${new Date(event.startDate).toLocaleString()}` : ""}
            {event.endDate ? ` • End: ${new Date(event.endDate).toLocaleString()}` : ""}
          </div>
        </div>
        <div className="text-right">
          <Link to="/" className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>
      </div>

      {/* Comments moved to bottom of page */}

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Details</h2>
        <div className="p-3 border rounded bg-white">
          <div className="text-sm">Organiser: {event.organiser?.name || "—"}</div>
          <div className="text-sm">Participants: {(event.participants || []).length}</div>
          {(event.participants || []).length > 0 && (
            <div className="mt-2">
              <ul className="space-y-1">
                {(event.participants || []).map((p) => {
                  const pid = p._id || p;
                  const display = typeof p === 'string' ? pid : `${p.name} ${p.email ? `• ${p.email}` : ''}`;
                  return (
                    <li key={pid} className="flex items-center justify-between text-sm text-gray-700">
                      <span>{display}</span>
                      {isOrganiser && (
                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          onClick={async () => {
                            if (!confirm(`Remove ${typeof p === 'string' ? pid : p.name} from event?`)) return;
                            try {
                              const res = await fetch(`${API_BASE}/api/events/${id}/participants/${encodeURIComponent(pid)}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) {
                                const d = await res.json().catch(() => ({}));
                                throw new Error(d.message || "Failed to remove participant");
                              }
                              const updated = await res.json();
                              setEvent(updated);
                            } catch (err) {
                              alert(err.message || "Failed to remove participant");
                            }
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {isOrganiser && (
            <div className="mt-2">
              <Link
                to={`/events/${id}/edit`}
                className="px-3 py-1 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Edit event
              </Link>

              <button
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  if (!confirm("Delete this event? This will remove related data.")) return;
                  (async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/events/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({}));
                        throw new Error(d.message || "Delete failed");
                      }
                      nav("/");
                    } catch (err) {
                      alert(err.message || "Delete failed");
                    }
                  })();
                }}
              >
                Delete event
              </button>
              {/* Add participant by user name or email (organiser only) */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Name or email to add"
                    value={newParticipantId}
                    onChange={(e) => setNewParticipantId(e.target.value)}
                    className="px-2 py-1 border rounded"
                  />
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={async () => {
                      if (!newParticipantId) return alert("Enter a name or email to search");
                      setSearchLoading(true);
                      setSearchResults(null);
                      try {
                        const lookupRes = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(newParticipantId)}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!lookupRes.ok) {
                          const d = await lookupRes.json().catch(() => ({}));
                          throw new Error(d.message || "User lookup failed");
                        }
                        const users = await lookupRes.json();
                        setSearchResults(Array.isArray(users) ? users : []);
                      } catch (err) {
                        alert(err.message || "User lookup failed");
                        setSearchResults([]);
                      } finally {
                        setSearchLoading(false);
                      }
                    }}
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Searching..." : "Search"}
                  </button>
                </div>

                {/* show returned users (even if only one or zero) */}
                {searchResults !== null && (
                  <div className="mt-2 border rounded bg-white p-2 max-h-48 overflow-auto">
                    {searchLoading ? (
                      <div className="text-sm text-gray-600">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-sm text-gray-600">No users found.</div>
                    ) : (
                      <ul className="space-y-2">
                        {searchResults.map((u) => (
                          <li key={u._id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-sm text-gray-600">{u.email}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                onClick={async () => {
                                  const userIdToAdd = u._id;
                                  // Prevent adding organiser or duplicate
                                  const existingIds = (event.participants || []).map((p) => p._id || p);
                                  if (existingIds.includes(userIdToAdd)) return alert("User is already a participant");
                                  if (event.organiser && ((event.organiser._id && event.organiser._id === userIdToAdd) || event.organiser === userIdToAdd)) return alert("Organiser is already part of the event");
                                  setAddingParticipant(true);
                                  try {
                                    const res = await fetch(`${API_BASE}/api/events/${id}/participants`, {
                                      method: "POST",
                                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                      body: JSON.stringify({ participantId: userIdToAdd }),
                                    });
                                    if (!res.ok) {
                                      const d = await res.json().catch(() => ({}));
                                      throw new Error(d.message || "Failed to add participant");
                                    }
                                    const updated = await res.json();
                                    setEvent(updated);
                                    setNewParticipantId("");
                                    setSearchResults(null);
                                  } catch (err) {
                                    alert(err.message || "Failed to add participant");
                                  } finally {
                                    setAddingParticipant(false);
                                  }
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Activities</h2>
          <div className="flex gap-2">
            <Link
              to={`/events/${id}/activities/new`}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Activity
            </Link>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="p-3 border rounded bg-white">No activities.</div>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a._id} className="p-3 border rounded bg-white flex justify-between items-start">
                <div>
                  <div className="font-medium">{a.name}</div>
                  {a.description && <div className="text-sm text-gray-600">{a.description}</div>}
                  <div className="text-sm text-gray-500 mt-1">
                    {a.startTime ? new Date(a.startTime).toLocaleString() : ""}{" "}
                    {a.endTime ? ` • ${new Date(a.endTime).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    to={`/events/${id}/activities/${a._id}/edit`}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteActivity(a._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                  <p>Last updated by: {a.updatedBy?.name || '—'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Planning steps</h2>
          <div>
            <Link
              to={`/events/${id}/planning-steps/new`}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Step
            </Link>
          </div>
        </div>

        {steps.length === 0 ? (
          <div className="p-3 border rounded bg-white">No planning steps.</div>
        ) : (
          <ul className="space-y-2">
            {steps.map((s) => (
              <li
                key={s._id}
                className={
                  "p-3 border rounded flex justify-between items-start " +
                  (s.isCompleted
                    ? "bg-green-50 border-green-300"
                    : "bg-white")
                }
              >
                <div>
                  <div className={"font-medium " + (s.isCompleted ? "text-green-700 line-through" : "")}>
                    {s.title}
                  </div>
                  {s.description && <div className="text-sm text-gray-600">{s.description}</div>}
                  {s.dueDate && (
                    <div className="text-sm text-gray-500 mt-1">
                      Due: {new Date(s.dueDate).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    to={`/events/${id}/planning-steps/${s._id}/edit`}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteStep(s._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                  {s.isCompleted ? (
                    <p>Completed by: {s.completedBy?.name || '—'}</p>
                  ) : (<p>Last updated by: {s.updatedBy?.name || '—'}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comments - moved to bottom, newest-first */}
      <section className="mt-6">
        <h2 className="text-lg font-medium mb-2">Comments</h2>
        <div className="p-3 border rounded bg-white mb-3">
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
                    // after posting, refresh to page 1 so newest comment is visible
                    setNewComment("");
                    // always reload page 1 (in case we're already on page 1)
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
                        {(isOrganiser || (c.author && (c.author._id === currentUserId || c.author === currentUserId))) && (
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
                                // refresh current comments page
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

              {/* pagination controls for comments */}
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
    </div>
  );
}
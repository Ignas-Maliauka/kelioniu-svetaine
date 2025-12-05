import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function EventDetails({
  event,
  id,
  token,
  isOwner,
  isOrganiser,
  currentUserId,
  newParticipantId,
  setNewParticipantId,
  addingParticipant,
  setAddingParticipant,
  searchResults,
  setSearchResults,
  searchLoading,
  setSearchLoading,
  setEvent,
}) {
  const [friendsLoading, setFriendsLoading] = useState(false);
  return (
    <section className="mb-6">
      <h2 className="text-lg font-medium mb-2">Details</h2>
      <div className="p-3 border rounded bg-white">
        <div className="text-sm">Owner: {event.organiser?.name || "—"}</div>
        <div className="text-sm">Participants: {(event.participants || []).length}</div>
        <div className="text-sm mt-1">Organisers: {(event.organisers || []).length}</div>
        {(event.organisers || []).length > 0 && (
          <div className="mt-2">
            <ul className="space-y-1">
              {(event.organisers || []).map((o) => {
                const oid = o._id || o;
                const display = typeof o === 'string' ? oid : `${o.name} ${o.email ? `• ${o.email}` : ''}`;
                const roleLabel = (event.organiser && ((event.organiser._id || event.organiser) == oid)) ? 'owner' : 'organiser';
                return (
                  <li key={oid} className="flex items-center justify-between text-sm text-gray-700">
                    <span>{display} <span className="text-xs text-gray-500">({roleLabel})</span></span>
                    {isOwner && roleLabel !== 'owner' && (
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        onClick={async () => {
                          if (!confirm(`Demote ${typeof o === 'string' ? oid : o.name} from organiser?`)) return;
                          try {
                            const res = await fetch(`${API_BASE}/api/events/${id}/organisers/${encodeURIComponent(oid)}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!res.ok) {
                              const d = await res.json().catch(() => ({}));
                              throw new Error(d.message || 'Failed to demote organiser');
                            }
                            const updated = await res.json();
                            setEvent(updated);
                          } catch (err) {
                            alert(err.message || 'Failed to demote organiser');
                          }
                        }}
                      >
                        Demote
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {(event.participants || []).length > 0 && (
          <div className="mt-2">
            <ul className="space-y-1">
              {((event.participants || []).filter((p) => {
                const pid = p._id || p;
                const orgIds = (event.organisers || []).map((o) => (o._id ? o._id : o));
                return !orgIds.includes(pid);
              })).map((p) => {
                const pid = p._id || p;
                const display = typeof p === 'string' ? pid : `${p.name} ${p.email ? `• ${p.email}` : ''}`;
                return (
                  <li key={pid} className="flex items-center justify-between text-sm text-gray-700">
                    <span>{display} <span className="text-xs text-gray-500">(participant)</span></span>
                    <div className="flex gap-2">
                      {isOwner && (
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
                      {isOwner && (
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          onClick={async () => {
                            if (!confirm(`Promote ${typeof p === 'string' ? pid : p.name} to organiser?`)) return;
                            try {
                              const res = await fetch(`${API_BASE}/api/events/${id}/organisers`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: pid }),
                              });
                              if (!res.ok) {
                                const d = await res.json().catch(() => ({}));
                                throw new Error(d.message || 'Failed to promote');
                              }
                              const updated = await res.json();
                              setEvent(updated);
                            } catch (err) {
                              alert(err.message || 'Failed to promote');
                            }
                          }}
                        >
                          Promote
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="mt-2">
          {isOrganiser && (
            <Link
              to={`/events/${id}/edit`}
              className="px-3 py-1 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Edit event
            </Link>
          )}

          {isOwner && (
            <>
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
                      // navigate back client-side by reloading location
                      window.location.href = '/';
                    } catch (err) {
                      alert(err.message || "Delete failed");
                    }
                  })();
                }}
              >
                Delete event
              </button>

              {/* Add participant by user name or email (owner only) */}
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
                      if (newParticipantId.length < 2) return alert("Enter a name or email with at least 2 characters");

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
                  <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 ml-2"
                    onClick={async () => {
                      // load friends and show them in the same results area
                      if (!currentUserId) return alert('Current user not available');
                      setFriendsLoading(true);
                      setSearchResults(null);
                      try {
                        const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(currentUserId)}/friends`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) {
                          const d = await res.json().catch(() => ({}));
                          throw new Error(d.message || 'Failed to load friends');
                        }
                        const friends = await res.json();
                        setSearchResults(Array.isArray(friends) ? friends : []);
                      } catch (err) {
                        alert(err.message || 'Failed to load friends');
                        setSearchResults([]);
                      } finally {
                        setFriendsLoading(false);
                      }
                    }}
                    disabled={friendsLoading}
                  >
                    {friendsLoading ? 'Loading...' : 'From friends'}
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
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                onClick={async () => {
                                  const userIdToAdd = u._id;
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}

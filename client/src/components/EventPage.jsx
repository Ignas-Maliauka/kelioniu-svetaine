import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import EventDetails from "./EventDetails";
import EventActivities from "./EventActivities";
import EventPlanningSteps from "./EventPlanningSteps";
import EventComments from "./EventComments";

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
  const isOwner = event.organiser && ((event.organiser._id && event.organiser._id === currentUserId) || event.organiser === currentUserId);
  const isOrganiser = isOwner || (Array.isArray(event.organisers) && event.organisers.some((o) => (o._id ? o._id === currentUserId : o === currentUserId)));

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
          <div className="text-sm text-gray-700 mt-1">
            <span className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded ${
              event.state === 'ongoing' ? 'bg-green-100 text-green-800' : event.state === 'completed' ? 'bg-blue-100 text-blue-800' : event.state === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>{event.state ? (event.state.charAt(0).toUpperCase() + event.state.slice(1)) : '—'}</span>
          </div>
        </div>
        <div className="text-right">
          <Link to="/" className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>
      </div>

      {/* Comments moved to bottom of page */}
      <EventDetails
        event={event}
        id={id}
        token={token}
        isOwner={isOwner}
        isOrganiser={isOrganiser}
        currentUserId={currentUserId}
        newParticipantId={newParticipantId}
        setNewParticipantId={setNewParticipantId}
        addingParticipant={addingParticipant}
        setAddingParticipant={setAddingParticipant}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchLoading={searchLoading}
        setSearchLoading={setSearchLoading}
        setEvent={setEvent}
      />

      <EventActivities activities={activities} isOrganiser={isOrganiser} deleteActivity={deleteActivity} id={id} />

      <EventPlanningSteps steps={steps} isOrganiser={isOrganiser} deleteStep={deleteStep} id={id} />

      {/* Comments - moved to bottom, newest-first */}
      <EventComments
        id={id}
        comments={comments}
        commentsLoading={commentsLoading}
        commentsPage={commentsPage}
        commentsTotal={commentsTotal}
        COMMENTS_PAGE_SIZE={COMMENTS_PAGE_SIZE}
        setCommentsPage={setCommentsPage}
        loadComments={loadComments}
        isOrganiser={isOrganiser}
        isOwner={isOwner}
        currentUserId={currentUserId}
        token={token}
        postingComment={postingComment}
        setPostingComment={setPostingComment}
        newComment={newComment}
        setNewComment={setNewComment}
      />
    </div>
  );
}
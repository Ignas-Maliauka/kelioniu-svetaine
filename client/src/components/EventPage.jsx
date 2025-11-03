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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Details</h2>
        <div className="p-3 border rounded bg-white">
          <div className="text-sm">Organiser: {event.organiser?.name || "—"}</div>
          <div className="text-sm">Participants: {(event.participants || []).length}</div>
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
            </div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Activities</h2>
        {activities.length === 0 ? (
          <div className="p-3 border rounded bg-white">No activities.</div>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a._id} className="p-3 border rounded bg-white">
                <div className="font-medium">{a.name}</div>
                {a.description && <div className="text-sm text-gray-600">{a.description}</div>}
                <div className="text-sm text-gray-500 mt-1">
                  {a.startTime ? new Date(a.startTime).toLocaleString() : ""}{" "}
                  {a.endTime ? ` • ${new Date(a.endTime).toLocaleString()}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Planning steps</h2>
        {steps.length === 0 ? (
          <div className="p-3 border rounded bg-white">No planning steps.</div>
        ) : (
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s._id} className="p-3 border rounded bg-white">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{s.title}</div>
                    {s.description && <div className="text-sm text-gray-600">{s.description}</div>}
                    {s.dueDate && <div className="text-sm text-gray-500 mt-1">Due: {new Date(s.dueDate).toLocaleString()}</div>}
                  </div>
                  <div className="text-sm">{s.isCompleted ? "Done" : "Pending"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
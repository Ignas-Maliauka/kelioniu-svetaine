import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function MainPage() {
  const { user, token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!token) return;
    const ac = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Failed to load (${res.status})`);
        }
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ac.abort();
  }, [token]);

  const organiserEvents = events.filter(
    (ev) =>
      ev?.organiser && ((ev.organiser._id && ev.organiser._id === userId) || ev.organiser === userId)
  );
  const participantEvents = events.filter(
    (ev) =>
      ev?.participants &&
      ev.participants.some((p) => (p._id && p._id === userId) || p === userId)
  ).filter(ev => !organiserEvents.find(o => o._id === ev._id)); // avoid dupes if organiser is also listed as participant

  if (!token) return <p className="p-4">Please log in to see your events.</p>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Events</h1>
        <div className="flex gap-2">
          <Link
            to="/events/new"
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Event
          </Link>
          <button
            className="px-3 py-1 bg-gray-100 rounded border"
            onClick={() => {
              setError("");
              setLoading(true);
              (async () => {
                try {
                  const res = await fetch(`${API_BASE}/api/events`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await res.json();
                  setEvents(Array.isArray(data) ? data : []);
                } catch (err) {
                  setError(err.message || "Reload failed");
                } finally {
                  setLoading(false);
                }
              })();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className="p-2">Loading events...</p>}
      {error && <p className="text-red-600 p-2">{error}</p>}

      {!loading && events.length === 0 && <p className="p-2">No events found.</p>}

      {organiserEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl mb-2">Organising</h2>
          <ul className="space-y-3">
            {organiserEvents.map((ev) => (
              <li key={ev._id} className="p-3 border rounded bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/events/${ev._id}`} className="text-lg font-medium">
                      {ev.title || "Untitled event"}
                    </Link>
                    <div className="text-sm text-gray-600">{ev.description}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {ev.startDate ? `Start: ${new Date(ev.startDate).toLocaleString()}` : ""}
                      {ev.endDate ? ` • End: ${new Date(ev.endDate).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Organiser: {ev.organiser?.name || "You"}</div>
                    <div>{(ev.participants || []).length} participants</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {participantEvents.length > 0 && (
        <section>
          <h2 className="text-xl mb-2">Participating</h2>
          <ul className="space-y-3">
            {participantEvents.map((ev) => (
              <li key={ev._id} className="p-3 border rounded bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/events/${ev._id}`} className="text-lg font-medium">
                      {ev.title || "Untitled event"}
                    </Link>
                    <div className="text-sm text-gray-600">{ev.description}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {ev.startDate ? `Start: ${new Date(ev.startDate).toLocaleString()}` : ""}
                      {ev.endDate ? ` • End: ${new Date(ev.endDate).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Organiser: {ev.organiser?.name || "—"}</div>
                    <div>{(ev.participants || []).length} participants</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
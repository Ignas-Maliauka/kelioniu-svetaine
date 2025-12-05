import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function MainPage() {
  const { user, token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

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
      ev?.organiser && ((ev.organiser._id && ev.organiser._id === userId) || ev.organiser === userId) ||
      (ev?.organisers && ev.organisers.some((o) => (o._id ? o._id === userId : o === userId)))
  );
  const participantEvents = events.filter(
    (ev) =>
      ev?.participants && ev.participants.some((p) => (p._id && p._id === userId) || p === userId)
  ).filter(ev => !organiserEvents.find(o => o._id === ev._id)); // avoid dupes if organiser is also listed as participant
  // build a single ordered list of "my" events with role metadata so we can paginate
  const myEvents = events.reduce((acc, ev) => {
    const isOrganiser = ev?.organiser && ((ev.organiser._id && ev.organiser._id === userId) || ev.organiser === userId) || (ev?.organisers && ev.organisers.some((o) => (o._id ? o._id === userId : o === userId)));
    const isParticipant = ev?.participants && ev.participants.some((p) => (p._id && p._id === userId) || p === userId);
    if (isOrganiser) acc.push({ ...ev, role: "organiser" });
    else if (isParticipant) acc.push({ ...ev, role: "participant" });
    return acc;
  }, []);

  const totalPages = Math.max(1, Math.ceil(myEvents.length / PAGE_SIZE));
  // ensure currentPage is within bounds
  const clampedPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIdx = (clampedPage - 1) * PAGE_SIZE;
  const currentPageEvents = myEvents.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => {
    // reset to first page when the set of events changes
    setCurrentPage(1);
  }, [events, token]);

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

      {!loading && myEvents.length === 0 && <p className="p-2">No events found.</p>}

      {!loading && myEvents.length > 0 && (
        <section>
          <h2 className="text-xl mb-2">Your events</h2>
          <ul className="space-y-3">
            {currentPageEvents.map((ev) => (
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
                    <div className="mb-1">Role: <span className="font-medium">{ev.role === 'organiser' ? 'Organiser' : 'Participant'}</span></div>
                    <div>Organiser: {ev.organiser?.name || (ev.role === 'organiser' ? 'You' : '—')}</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                        ev.state === 'ongoing' ? 'bg-green-100 text-green-800' : ev.state === 'completed' ? 'bg-blue-100 text-blue-800' : ev.state === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>{ev.state ? (ev.state.charAt(0).toUpperCase() + ev.state.slice(1)) : '—'}</span>
                    </div>
                    <div className="mt-1">Steps: <span className="font-medium">{(ev.completedPlanningSteps || 0)}/{(ev.planningStepsCount || 0)}</span></div>
                    <div className="mt-1">{(ev.participants || []).length} participants</div>
                    <div className="mt-1 text-sm text-gray-600">{(ev.commentCount || 0)} comments</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* pagination controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing {startIdx + 1} - {Math.min(startIdx + PAGE_SIZE, myEvents.length)} of {myEvents.length}</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-gray-100 rounded border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
              >
                Previous
              </button>
              <div className="px-3 py-1 flex items-center border rounded bg-white">
                Page {clampedPage} of {totalPages}
              </div>
              <button
                className="px-3 py-1 bg-gray-100 rounded border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={clampedPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
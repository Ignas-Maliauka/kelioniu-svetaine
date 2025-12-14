import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export default function Friends() {
  const { token, user } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState('');
  const [friendsPage, setFriendsPage] = useState(1);
  const FRIENDS_PAGE_SIZE = 5;
  const [resultsPage, setResultsPage] = useState(1);
  const RESULTS_PAGE_SIZE = 2;

  useEffect(() => {
    if (!token || !user) return;
    // load current user's friends
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${user.id || user._id}/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load friends');
        const data = await res.json();
        setFriends(Array.isArray(data) ? data : []);
        setFriendsPage(1); // reset to first page on reload
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token, user]);

  async function search() {
    if (!query || query.length < 2) return setError('Enter at least 2 characters');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Search failed');
      }
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setResultsPage(1); // reset to first page on new search
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(targetId) {
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(targetId)}/friends`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to add friend');
      }
      const updated = await res.json();
      setFriends(Array.isArray(updated) ? updated : []);
      setFriendsPage(1); // reset to first page after add
    } catch (err) {
      alert(err.message || 'Failed to add friend');
    }
  }

  async function removeFriend(targetId) {
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(targetId)}/friends`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to remove friend');
      }
      const updated = await res.json();
      setFriends(Array.isArray(updated) ? updated : []);
      setFriendsPage(1); // reset to first page after remove
    } catch (err) {
      alert(err.message || 'Failed to remove friend');
    }
  }

  function isFriend(uid) {
    return friends.some((f) => (f._id ? f._id === uid : f === uid));
  }

  // Paging logic for friends
  const totalFriendsPages = Math.max(1, Math.ceil(friends.length / FRIENDS_PAGE_SIZE));
  const clampedFriendsPage = Math.min(Math.max(1, friendsPage), totalFriendsPages);
  const startIdx = (clampedFriendsPage - 1) * FRIENDS_PAGE_SIZE;
  const currentFriends = friends.slice(startIdx, startIdx + FRIENDS_PAGE_SIZE);

  // Paging logic for search results
  const totalResultsPages = Math.max(1, Math.ceil(results.length / RESULTS_PAGE_SIZE));
  const clampedResultsPage = Math.min(Math.max(1, resultsPage), totalResultsPages);
  const resultsStartIdx = (clampedResultsPage - 1) * RESULTS_PAGE_SIZE;
  const currentResults = results.slice(resultsStartIdx, resultsStartIdx + RESULTS_PAGE_SIZE);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Friends</h1>

      <div className="mb-6">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="px-2 py-1 border rounded" placeholder="Search by name or email" />
          <button onClick={search} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Searching...' : 'Search'}</button>
        </div>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

        <div className="mt-3">
          {results.length === 0 ? (
            <div className="text-sm text-gray-600">No results</div>
          ) : (
            <>
              <ul className="space-y-2">
                {currentResults.map((r) => (
                  <li key={r._id} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-sm text-gray-600">{r.email}</div>
                    </div>
                    <div>
                      {r._id === (user.id || user._id) ? (
                        <span className="text-sm text-gray-500">You</span>
                      ) : isFriend(r._id) ? (
                        <button onClick={() => removeFriend(r._id)} className="px-3 py-1 bg-red-600 text-white rounded">Remove friend</button>
                      ) : (
                        <button onClick={() => addFriend(r._id)} className="px-3 py-1 bg-green-600 text-white rounded">Add friend</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                <div>
                  Showing {results.length === 0 ? 0 : resultsStartIdx + 1} - {Math.min(resultsStartIdx + currentResults.length, results.length)} of {results.length}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-gray-100 rounded border"
                    onClick={() => setResultsPage((p) => Math.max(1, p - 1))}
                    disabled={clampedResultsPage <= 1}
                  >
                    Previous
                  </button>
                  <div className="px-3 py-1 flex items-center border rounded bg-white">
                    Page {clampedResultsPage} of {totalResultsPages}
                  </div>
                  <button
                    className="px-3 py-1 bg-gray-100 rounded border"
                    onClick={() => setResultsPage((p) => Math.min(totalResultsPages, p + 1))}
                    disabled={clampedResultsPage >= totalResultsPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Your friends</h2>
        {friends.length === 0 ? (
          <div className="text-sm text-gray-600">No friends yet</div>
        ) : (
          <>
            <ul className="space-y-2">
              {currentFriends.map((f) => (
                <li key={f._id} className="p-2 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-sm text-gray-600">{f.email}</div>
                  </div>
                  <div>
                    <button onClick={() => removeFriend(f._id)} className="px-3 py-1 bg-red-600 text-white rounded">Remove friend</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <div>
                Showing {friends.length === 0 ? 0 : startIdx + 1} - {Math.min(startIdx + currentFriends.length, friends.length)} of {friends.length}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-gray-100 rounded border"
                  onClick={() => setFriendsPage((p) => Math.max(1, p - 1))}
                  disabled={clampedFriendsPage <= 1}
                >
                  Previous
                </button>
                <div className="px-3 py-1 flex items-center border rounded bg-white">
                  Page {clampedFriendsPage} of {totalFriendsPages}
                </div>
                <button
                  className="px-3 py-1 bg-gray-100 rounded border"
                  onClick={() => setFriendsPage((p) => Math.min(totalFriendsPages, p + 1))}
                  disabled={clampedFriendsPage >= totalFriendsPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

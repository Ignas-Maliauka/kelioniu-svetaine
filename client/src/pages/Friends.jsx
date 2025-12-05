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
    } catch (err) {
      alert(err.message || 'Failed to remove friend');
    }
  }

  function isFriend(uid) {
    return friends.some((f) => (f._id ? f._id === uid : f === uid));
  }

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
            <ul className="space-y-2">
              {results.map((r) => (
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
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Your friends</h2>
        {friends.length === 0 ? (
          <div className="text-sm text-gray-600">No friends yet</div>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
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
        )}
      </div>
    </div>
  );
}

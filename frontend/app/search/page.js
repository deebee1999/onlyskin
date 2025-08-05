'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in');

    setSearching(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch(`http://localhost:5000/api/search/users?q=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.users || []);
    } catch (err) {
      console.error('Search failed:', err.message);
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 sm:p-8">
      <h1 className="text-2xl font-bold mb-4">Search Users</h1>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter username"
          className="w-full p-3 bg-gray-800 text-white rounded"
          required
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded w-full sm:w-auto"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {results.length === 0 && !searching ? (
        <p className="text-gray-400">No users found.</p>
      ) : (
        <ul className="space-y-4">
          {results.map((user) => (
            <li
              key={user.id}
              className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-white">@{user.username}</p>
                {user.bio && <p className="text-sm text-gray-400">{user.bio}</p>}
              </div>
              <Link
                href={`/creator/${user.username}`}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded text-sm"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

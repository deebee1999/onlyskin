'use client';

/* =============================================================================
   OnlySkins — Search Page
   - Clicking any result navigates to /dashboard (shared for creators/subscribers)
   - Follow/Unfollow updates row state and writes counts to localStorage
   ========================================================================== */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 400);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // [{ id, username, role, avatar_url, is_following }]
  const [error, setError] = useState('');

  const canSearch = useMemo(() => debouncedQ.trim().length > 0, [debouncedQ]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError('');
      if (!canSearch) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Search failed with ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          const normalized = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];
          setResults(
            normalized.map((u) => ({
              id: u.id,
              username: u.username,
              role: u.role,
              avatar_url: u.avatar_url || u.avatar || null,
              is_following:
                typeof u.is_following === 'boolean'
                  ? u.is_following
                  : !!u.following,
            })),
          );
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, canSearch, token]);

  // Follow / Unfollow using backend truth; cache counts in localStorage
  async function handleFollowToggle(e, username, index) {
    e.stopPropagation();
    if (!token) return;

    try {
      const res = await fetch('/api/follow/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Follow toggle failed:', data?.error || res.statusText);
        return;
      }

      setResults((prev) => {
        const copy = [...prev];
        if (copy[index]) copy[index] = { ...copy[index], is_following: !!data.following };
        return copy;
      });

      // ✅ Persist counts for Dashboard to read on mount
      try {
        localStorage.setItem(
          'onlyskins:follow-changed',
          JSON.stringify({
            followers: data.followers,   // target's followers
            following: data.following,   // viewer's following
            ts: Date.now(),
          })
        );
      } catch {}
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  }

  function handleRowClick() {
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="text-xl font-bold text-pink-500">
          OnlySkins
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/purchases" className="hover:underline">
            Purchases
          </Link>
          <Link href="/notifications" className="hover:underline">
            Notifications
          </Link>
          {user?.username && (
  <Link
    href={user.role === 'creator'
      ? `/creator/${user.username}`
      : `/subscriber/${user.username}`
    }
    className="hover:underline"
  >
    Profile
  </Link>
)}

        </div>
      </nav>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Search</h1>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users by username…"
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring focus:ring-pink-200"
        />

      {/* Status */}
        <div className="mt-4 text-sm">
          {loading && <span>Searching…</span>}
          {!loading && error && <span className="text-red-600">Error: {error}</span>}
          {!loading && !error && canSearch && results.length === 0 && (
            <span>No results.</span>
          )}
        </div>

        {/* Results */}
        <div className="mt-6 space-y-2">
          {results.map((u, idx) => (
            <div
              key={u.id ?? `${u.username}-${idx}`}
              onClick={handleRowClick}
              className={classNames(
                'flex items-center justify-between rounded-xl border bg-white px-4 py-3 cursor-pointer',
                'hover:shadow transition-shadow',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                  {u.avatar_url ? (
                    <Image
                      src={u.avatar_url}
                      alt={`${u.username} avatar`}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">
                      N/A
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">@{u.username}</div>
                  <div className="text-xs text-gray-500">
                    {u.role === 'creator' ? 'Creator' : 'Subscriber'}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => handleFollowToggle(e, u.username, idx)}
                className={classNames(
                  'rounded-full px-4 py-2 text-sm border',
                  u.is_following
                    ? 'bg-gray-100 hover:bg-gray-200'
                    : 'bg-pink-500 text-white hover:bg-pink-600 border-pink-500',
                )}
              >
                {u.is_following ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

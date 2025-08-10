'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawParam = params?.username;
  const routeUsername = useMemo(() => {
    if (!rawParam) return '';
    return Array.isArray(rawParam) ? rawParam[0] : String(rawParam);
  }, [rawParam]);

  const pageFromUrl = Number(searchParams.get('page') || 1);
  const limit = 25;

  const [list, setList] = useState([]); // [{id, username, role, avatar_url, is_following}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: pageFromUrl,
    limit,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const goToPage = (p) => {
    const next = Math.max(1, p);
    router.push(`/followers/${routeUsername}?page=${next}`);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      setLoading(true);

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      if (!routeUsername) {
        setError('No username provided');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:5000/api/social/followers/${encodeURIComponent(
            routeUsername.toLowerCase()
          )}?page=${pageFromUrl}&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          const t = await res.json().catch(() => ({}));
          throw new Error(t?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        setList(Array.isArray(data?.users) ? data.users : []);
        setPagination(
          data?.pagination || {
            page: pageFromUrl,
            limit,
            total: 0,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          }
        );
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || 'Failed to load followers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [routeUsername, token, pageFromUrl]);

  async function handleToggle(username, index) {
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
      if (!res.ok) throw new Error(data?.error || 'Toggle failed');

      // Update row locally
      setList((prev) => {
        const copy = [...prev];
        if (copy[index]) copy[index] = { ...copy[index], is_following: !!data.following };
        return copy;
      });

      // Persist counts so dashboard picks up changes
      try {
        localStorage.setItem(
          'onlyskins:follow-changed',
          JSON.stringify({
            followers: data.followers,
            following: data.following,
            ts: Date.now(),
          })
        );
      } catch {}
    } catch {
      // ignore
    }
  }

  if (loading) return <main className="p-6 text-white">Loading followers…</main>;
  if (error) return <main className="p-6 text-red-500">{error}</main>;

  const startIdx = (pagination.page - 1) * pagination.limit + 1;
  const endIdx = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <main className="p-6 sm:p-8 max-w-3xl mx-auto text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">@{routeUsername} — Followers</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="text-sm text-gray-400 mb-3">
        {pagination.total > 0 ? `${startIdx}–${endIdx} of ${pagination.total}` : '0 results'}
      </div>

      {list.length === 0 ? (
        <p className="text-gray-400">No followers yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((u, idx) => (
            <li key={u.id} className="flex items-center justify-between bg-zinc-800 rounded p-3">
              {/* LEFT: clickable link to the user’s profile */}
              <Link
                href={u.role === 'creator' ? `/creator/${u.username}` : `/profile/${u.username}`}
                className="flex items-center gap-3 hover:opacity-90"
                prefetch={false}
              >
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-600">
                  {u.avatar_url ? (
                    <img
                      src={
                        /^https?:\/\//i.test(u.avatar_url)
                          ? u.avatar_url
                          : `http://localhost:5000${u.avatar_url}`
                      }
                      alt={`${u.username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-gray-300">
                      @
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">@{u.username}</div>
                  <div className="text-xs text-gray-400">
                    {u.role === 'creator' ? 'Creator' : 'Subscriber'}
                  </div>
                </div>
              </Link>

              {/* RIGHT: follow/unfollow button */}
              <button
                onClick={() => handleToggle(u.username, idx)}
                className={
                  u.is_following
                    ? 'rounded-full px-4 py-1.5 bg-gray-200 text-black text-sm'
                    : 'rounded-full px-4 py-1.5 bg-pink-600 text-white text-sm hover:bg-pink-700'
                }
              >
                {u.is_following ? 'Following' : 'Follow'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-6">
        <button
          disabled={!pagination.hasPrev}
          onClick={() => goToPage(pagination.page - 1)}
          className={`px-3 py-1.5 rounded ${
            pagination.hasPrev ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-800 opacity-60'
          } text-sm`}
        >
          ← Previous
        </button>
        <div className="text-xs text-gray-400">
          Page {pagination.page} / {pagination.totalPages}
        </div>
        <button
          disabled={!pagination.hasNext}
          onClick={() => goToPage(pagination.page + 1)}
          className={`px-3 py-1.5 rounded ${
            pagination.hasNext ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-800 opacity-60'
          } text-sm`}
        >
          Next →
        </button>
      </div>
    </main>
  );
}

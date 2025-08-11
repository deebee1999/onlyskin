'use client';

import { useEffect, useState } from 'react';

export default function SubscriberProfilePage({ params }) {
  const username = params.username?.toLowerCase?.() || '';
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setErrorMsg('Please log in to view profiles');
      setLoading(false);
      return;
    }

    // Optional: fetch basic profile info for the subscriber (username/email/bio/avatar)
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${encodeURIComponent(username)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        setProfile(data || null);
      } catch {
        // Fail silently; we can still render a minimal page
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (errorMsg) return <p className="text-red-400 text-center py-8">{errorMsg}</p>;

  return (
    <main className="px-4 py-8 sm:px-6 md:px-8 max-w-screen-md mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">@{username}</h1>
        <p className="text-sm text-gray-400 mt-1">Subscriber profile</p>
      </div>

      {profile && (
        <section className="bg-gray-800 rounded-xl p-5 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `http://localhost:5000${profile.avatar_url}`}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                {username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{profile.username || username}</p>
              {profile.email && <p className="text-gray-400 text-sm">{profile.email}</p>}
            </div>
          </div>
          {profile.bio && <p className="text-gray-200 mt-4 whitespace-pre-wrap">{profile.bio}</p>}
        </section>
      )}

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <p className="text-center text-gray-300">
          This user is not a creator. Nothing to unlock here.
        </p>
      </div>
    </main>
  );
}

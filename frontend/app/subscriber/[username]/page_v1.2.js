'use client';

/* =========================================================
   Subscriber Profile Page — matches creator page styling
   - Avatar, username, email
   - Follow/Unfollow (hidden on self)
   - Inline bio edit (self only)
   - Avatar upload (self only, uses /api/uploads/avatar)
   ========================================================= */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SubscriberProfilePage() {
  // -----------------------------
  // Routing params (client-safe)
  // -----------------------------
  const params = useParams();
  const routeUsername = (params?.username ?? '').toString().toLowerCase();

  // -----------------------------
  // State
  // -----------------------------
  const [viewer, setViewer] = useState(null);   // { id, username, role, email }
  const [profile, setProfile] = useState(null); // profile for routeUsername
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const isSelf = useMemo(() => {
    if (!viewer || !profile) return false;
    return viewer.username?.toLowerCase() === profile.username?.toLowerCase();
  }, [viewer, profile]);

  // -----------------------------
  // Load viewer + target profile
  // -----------------------------
  useEffect(() => {
    if (!token) {
      setErrorMsg('Please log in to view profiles');
      setLoading(false);
      return;
    }
    if (!routeUsername) {
      setErrorMsg('Username not found in route');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // 1) Viewer (self)
        const meRes = await fetch('http://localhost:5000/api/profile', { headers: authHeaders });
        const meData = await meRes.json().catch(() => ({}));
        if (meRes.ok) setViewer(meData || null);

        // 2) Target profile
        const pRes = await fetch(
          `http://localhost:5000/api/profile/${encodeURIComponent(routeUsername)}`,
          { headers: authHeaders }
        );
        const pData = await pRes.json().catch(() => ({}));
        if (!pRes.ok) throw new Error(pData?.error || `HTTP ${pRes.status}`);
        setProfile(pData || null);
        setBioDraft(pData?.bio || '');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Load profile error:', err?.message || err);
        setErrorMsg('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [routeUsername, token, authHeaders]);

  // -----------------------------
  // Load follow status (viewer -> target)
  // -----------------------------
  useEffect(() => {
    if (!token || !routeUsername) return;
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/follow/status/${encodeURIComponent(routeUsername)}`,
          { headers: authHeaders }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.following === 'boolean') {
          setIsFollowing(data.following);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Follow status error:', err?.message || err);
      }
    })();
  }, [routeUsername, token, authHeaders]);

  // -----------------------------
  // Actions: Follow/Unfollow
  // -----------------------------
  const handleToggleFollow = async () => {
    if (!token || !routeUsername) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/follow/${encodeURIComponent(routeUsername)}`,
        { method: 'POST', headers: authHeaders }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Toggle failed');
      setIsFollowing(!!data.following);

      // optional broadcast
      try {
        localStorage.setItem(
          'onlyskins:follow-changed',
          JSON.stringify({ followers: data.followers, following: data.following, ts: Date.now() })
        );
        document.dispatchEvent(new CustomEvent('onlyskins:follow-changed', {
          detail: { followers: data.followers, following: data.following },
        }));
      } catch {}
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Follow toggle failed:', err?.message || err);
    } finally {
      setFollowLoading(false);
    }
  };

  // -----------------------------
  // Actions: Save bio (self only)
  // -----------------------------
  const handleSaveBio = async () => {
    if (!token || !isSelf) return;
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ bio: bioDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setProfile((p) => ({ ...(p || {}), bio: bioDraft }));
      setEditingBio(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Save bio failed:', err?.message || err);
      alert('Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Actions: Upload avatar (self)
  // -----------------------------
  const handleAvatarChange = async (e) => {
    if (!token || !isSelf) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('avatar', file);

    setUploading(true);
    try {
      const res = await fetch('http://localhost:5000/api/uploads/avatar', {
        method: 'POST',
        headers: authHeaders,
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const newUrl = data?.avatar_url;
      if (newUrl) setProfile((p) => ({ ...(p || {}), avatar_url: newUrl }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Avatar upload failed:', err?.message || err);
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
      if (e?.target) e.target.value = '';
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (errorMsg) return <p className="text-red-400 text-center py-8">{errorMsg}</p>;

  const imgSrc =
    profile?.avatar_url
      ? (profile.avatar_url.startsWith('http')
          ? profile.avatar_url
          : `http://localhost:5000${profile.avatar_url}`)
      : '';

  return (
    <main className="px-4 py-8 sm:px-6 md:px-8 max-w-screen-md mx-auto">
      {/* Header (matches creator header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">@{routeUsername}</h1>

        {/* Follow/Unfollow button (hidden on self) */}
        {!isSelf && (
          <button
            onClick={handleToggleFollow}
            disabled={followLoading}
            className={`w-full sm:w-auto px-5 py-3 text-sm rounded-lg text-white ${
              isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {followLoading ? 'Please wait...' : isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      {/* Profile Card (matches creator card styling) */}
      <section className="w-full bg-gray-800 rounded-xl p-5 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          {imgSrc ? (
            <img src={imgSrc} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl text-white">
              {routeUsername.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <p className="text-white font-semibold">{profile?.username || routeUsername}</p>
            {profile?.email && <p className="text-gray-400 text-sm">{profile.email}</p>}
          </div>

          {/* Avatar upload (self only) */}
          {isSelf && (
            <label className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm cursor-pointer">
              {uploading ? 'Uploading...' : 'Change Avatar'}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Bio (self can edit) */}
        <div className="mt-5">
          {!editingBio ? (
            <>
              <p className="text-gray-200 whitespace-pre-wrap min-h-[1.5rem]">
                {profile?.bio || 'No bio yet.'}
              </p>
              {isSelf && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="mt-3 px-4 py-2 text-sm rounded-lg bg-pink-600 hover:bg-pink-700 text-white"
                >
                  Edit Bio
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                className="w-full rounded-lg bg-gray-900 border border-gray-700 p-3 text-white"
                rows={4}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Write something about yourself..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveBio}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingBio(false);
                    setBioDraft(profile?.bio || '');
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info box */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <p className="text-center text-gray-300">
          This user is not a creator. Nothing to unlock here.
        </p>
      </div>
    </main>
  );
}

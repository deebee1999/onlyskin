'use client';

/* =========================================================
   ProfileHeader (Shared for Creator & Subscriber pages)
   - Avatar, username, email
   - Inline bio edit (self only)
   - Avatar upload (self only)
   - Handles its own save/upload calls
   ========================================================= */

import { useMemo, useState } from 'react';

export default function ProfileHeader({
  initialProfile,      // { username, email, bio, avatar_url }
  routeUsername,       // string (lowercased username from route)
  isSelf,              // boolean
  onUpdated,           // optional: (updatedProfile) => void
}) {
  const [profile, setProfile] = useState(initialProfile || {});
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(initialProfile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const imgSrc = profile?.avatar_url
    ? (profile.avatar_url.startsWith('http')
        ? profile.avatar_url
        : `http://localhost:5000${profile.avatar_url}`)
    : '';

  // -------- Actions: Save bio --------
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

      const updated = { ...(profile || {}), bio: bioDraft };
      setProfile(updated);
      setEditingBio(false);
      onUpdated && onUpdated(updated);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Save bio failed:', err?.message || err);
      alert('Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  // -------- Actions: Upload avatar --------
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
      if (newUrl) {
        const updated = { ...(profile || {}), avatar_url: newUrl };
        setProfile(updated);
        onUpdated && onUpdated(updated);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Avatar upload failed:', err?.message || err);
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
      if (e?.target) e.target.value = '';
    }
  };

  return (
    <section className="w-full bg-gray-800 rounded-xl p-5 mb-8 shadow-lg">
      <div className="flex items-center gap-4">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover border"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl text-white">
            {(routeUsername || profile?.username || '?').slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <p className="text-white font-semibold">{profile?.username || routeUsername}</p>
          {profile?.email && <p className="text-gray-400 text-sm">{profile.email}</p>}
        </div>

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

      {/* Bio */}
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
  );
}

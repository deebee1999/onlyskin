'use client';

/* =========================================================
   File: app/profile/[username]/page.js
   Purpose: Subscriber Profile Page (matches creator styling)
   - High-contrast boxes and headings
   - Central THEME block for easy color/text tweaks
   ========================================================= */

/* =========================================================
   🎨 THEME COLORS & TEXT STYLES — EDIT THESE
   ---------------------------------------------------------
   Change these Tailwind class strings to restyle the page.
   ========================================================= */
const THEME = {
  usernameText: 'text-gray-800 font-bold',      // "@username"
  roleText:     'text-gray-800 font-semibold',  // "Subscriber • subscriber"
  boxBackground:'bg-gray-300',                  // info card background
  boxBorder:    'border-gray-400',              // info card border
  boxTitle:     'text-black font-semibold',     // card section titles
  boxContent:   'text-black',                   // card body text
  editButton:   'border-gray-500 text-black hover:bg-gray-200',
  textarea:     'border-gray-500 text-black',
  saveButton:   'bg-black text-white hover:opacity-90',
  cancelButton: 'border-gray-500 text-black hover:bg-gray-200',
};
/* ========================================================= */

import { useEffect, useMemo, useState, useCallback } from 'react';

const API_BASE = 'http://localhost:5000';

/* Lightweight JWT decode for viewer */
function decodeViewer() {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return { username: null, role: null, sub: null, email: null };
    const [, payload] = token.split('.');
    if (!payload) return { username: null, role: null, sub: null, email: null };
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const username =
      json?.username ?? json?.user?.username ?? json?.name ?? json?.preferred_username ?? null;
    const role = json?.role ?? json?.user?.role ?? null;
    const email = json?.email ?? json?.user?.email ?? null;
    const sub = json?.sub ?? json?.user?.id ?? null;
    return { username, role, email, sub };
  } catch {
    return { username: null, role: null, email: null, sub: null };
  }
}

/* API helpers */
async function getProfile(username) {
  const res = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET profile ${res.status}: ${text || res.statusText}`);
  }
  return res.json(); // { id, username, email, bio, role, avatar_url, banner_url, created_at }
}

async function updateBio(username, bio) {
  const res = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(username)}/bio`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ bio }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PUT bio ${res.status}: ${text || res.statusText}`);
  }
  return res.json(); // updated profile
}

/* Component */
export default function SubscriberProfilePage({ params }) {
  const routeUsername = params?.username || '';

  // Debug to confirm this file is rendering
  if (typeof window !== 'undefined') {
    console.warn('SUBSCRIBER THEME ACTIVE >>> app/profile/[username]/page.js');
  }

  const viewer = useMemo(() => decodeViewer(), []);
  const isSelf = useMemo(() => {
    if (!viewer?.username || !routeUsername) return false;
    return String(viewer.username).toLowerCase() === String(routeUsername).toLowerCase();
  }, [viewer?.username, routeUsername]);

  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile]   = useState(null);

  const [editing, setEditing]   = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [saving, setSaving]     = useState(false);

  /* Load profile */
  useEffect(() => {
    let alive = true;
    if (!routeUsername) return;

    (async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const p = await getProfile(routeUsername);
        if (!alive) return;
        setProfile(p);
        setBioDraft(typeof p.bio === 'string' ? p.bio : '');
      } catch (e) {
        if (!alive) return;
        setErrorMsg(e.message || 'Failed to load profile.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [routeUsername]);

  /* Handlers */
  const handleStartEdit = useCallback(() => {
    setBioDraft(profile?.bio || '');
    setEditing(true);
  }, [profile?.bio]);

  const handleCancelEdit = useCallback(() => {
    setBioDraft(profile?.bio || '');
    setEditing(false);
  }, [profile?.bio]);

  const handleSaveBio = useCallback(async () => {
    try {
      setSaving(true);
      setErrorMsg('');
      const updated = await updateBio(routeUsername, bioDraft);
      setProfile(updated);
      setEditing(false);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to update bio.');
    } finally {
      setSaving(false);
    }
  }, [routeUsername, bioDraft]);

  /* States */
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-36 w-full rounded-2xl bg-gray-200" />
          <div className="h-20 w-20 rounded-full bg-gray-200 -mt-10 border-4 border-white" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
          <div className="h-24 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
          <div className="font-semibold mb-1">Profile Error</div>
          <div className="text-sm">{errorMsg}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="rounded-2xl border border-gray-300 bg-gray-50 p-4 text-black">
          <div className="font-semibold mb-1">No Profile</div>
          <div className="text-sm">Profile data was not found.</div>
        </div>
      </div>
    );
  }

  /* Render — mirrors creator */
  return (
    <div className="w-full max-w-4xl mx-auto p-6 text-black">
      {/* Header / Banner */}
      <div className="relative">
        <div
          className="h-40 w-full rounded-2xl bg-gradient-to-r from-purple-200 via-pink-200 to-rose-200"
          style={{
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
            backgroundSize: profile.banner_url ? 'cover' : undefined,
            backgroundPosition: profile.banner_url ? 'center' : undefined,
          }}
        />
        <div className="absolute -bottom-8 left-6">
          <div
            className="h-20 w-20 rounded-full border-4 border-white bg-gray-100"
            style={{
              backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
              backgroundSize: profile.avatar_url ? 'cover' : undefined,
              backgroundPosition: profile.avatar_url ? 'center' : undefined,
            }}
          />
        </div>
      </div>

      <div className="h-10" />

      {/* Identity */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className={`text-2xl ${THEME.usernameText}`}>
            @{profile.username || routeUsername}
          </div>
          <div className={`text-sm ${THEME.roleText}`}>
            {profile.role ? `Subscriber • ${profile.role}` : 'Subscriber'}
          </div>
        </div>
      </div>

      {/* Contact / Meta */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-4 ${THEME.boxBackground} ${THEME.boxBorder}`}>
          <div className={`text-sm ${THEME.boxTitle}`}>Email</div>
          <div className={`text-sm break-words ${THEME.boxContent}`}>
            {profile.email ? String(profile.email) : '—'}
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${THEME.boxBackground} ${THEME.boxBorder}`}>
          <div className={`text-sm ${THEME.boxTitle}`}>Joined</div>
          <div className={`text-sm ${THEME.boxContent}`}>
            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className={`mt-6 rounded-2xl border p-4 ${THEME.boxBackground} ${THEME.boxBorder}`}>
        <div className="flex items-center justify-between">
          <div className={`text-sm ${THEME.boxTitle}`}>Bio</div>
          {isSelf && !editing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className={`text-sm px-3 py-1 rounded-xl border ${THEME.editButton}`}
            >
              Edit
            </button>
          )}
        </div>

        {!editing && (
          <div className={`mt-2 text-sm whitespace-pre-wrap ${THEME.boxContent}`}>
            {typeof profile.bio === 'string' && profile.bio.trim().length
              ? profile.bio
              : 'No bio yet.'}
          </div>
        )}

        {editing && (
          <div className="mt-3">
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              className={`w-full min-h-[120px] rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 ${THEME.textarea}`}
              placeholder="Write a short bio..."
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={saving}
                className={`text-sm px-4 py-2 rounded-xl ${THEME.saveButton} disabled:opacity-60`}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className={`text-sm px-4 py-2 rounded-xl border ${THEME.cancelButton} disabled:opacity-60`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {errorMsg && <div className="mt-3 text-xs text-red-600">{errorMsg}</div>}
      </div>
    </div>
  );
}

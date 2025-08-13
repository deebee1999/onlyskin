'use client';

/* =========================================================
   File: app/subscriber/[username]/page.js
   Purpose: Subscriber Profile Page
   - High contrast info boxes
   - Resilient email/joined extraction
   - Inline Bio edit (self only)
   - Endpoint fallback (avoids 404 on /api/subscriber/:username)
   - Reliable self-detection (username/id/email match)
   ========================================================= */

/* =========================================================
   🎨 THEME COLORS & TEXT STYLES — EDIT THESE
   ========================================================= */
const THEME = {
  usernameText: 'text-blue-600 font-bold',
  roleText: 'text-blue-600 font-semibold',
  boxBackground: 'bg-gray-300',
  boxBorder: 'border-gray-400',
  boxTitle: 'text-black font-semibold',
  boxContent: 'text-black',
  editButton: 'border-gray-500 text-black hover:bg-gray-200',
  textareaBorder: 'border-gray-500 text-black',
  saveButton: 'bg-black text-white hover:opacity-90',
  cancelButton: 'border-gray-500 text-black hover:bg-gray-200',
};
/* ========================================================= */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';


const API_BASE = 'http://localhost:5000';

/* ---------------------------------------------------------
   Utils
   --------------------------------------------------------- */
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

function eqCI(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const u = raw.user && typeof raw.user === 'object' ? raw.user : {};

  const email = firstDefined(
    raw.email,
    raw.signup_email,
    u.email,
    raw.contact?.email
  );

  const created = firstDefined(
    raw.created_at,
    raw.joined_at,
    raw.createdAt,
    raw.signup_date,
    raw.date_joined,
    raw.joined,
    raw.created,
    raw.registered_at,
    raw.registeredAt,
    u.created_at,
    u.createdAt
  );

  const username = firstDefined(raw.username, u.username);
  const role = firstDefined(raw.role, u.role);
  const id = firstDefined(raw.id, u.id);

  const banner_url = firstDefined(raw.banner_url, u.banner_url);
  const avatar_url = firstDefined(raw.avatar_url, u.avatar_url);
  const bio = firstDefined(raw.bio, u.bio, '');

  return {
    ...raw,
    id,
    username,
    role,
    email,
    created_at: created,
    banner_url,
    avatar_url,
    bio,
  };
}

function formatJoinedDate(value) {
  if (value == null || value === '') return '—';
  let ms;
  if (typeof value === 'number') {
    ms = value < 1e12 ? value * 1000 : value;
  } else if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{13}$/.test(s)) ms = parseInt(s, 10);
    else if (/^\d{10}$/.test(s)) ms = parseInt(s, 10) * 1000;
    else {
      const d = new Date(s);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
    }
  } else {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}


/* ---------------------------------------------------------
   API helpers with endpoint fallback
   --------------------------------------------------------- */
async function tryGet(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    cache: 'no-store',
  });
  return res;
}

async function getProfile(username) {
  const endpoints = [
    `${API_BASE}/api/subscriber/${encodeURIComponent(username)}`,
    `${API_BASE}/api/users/${encodeURIComponent(username)}`,
    `${API_BASE}/api/profile/${encodeURIComponent(username)}`,
    `${API_BASE}/api/creator/${encodeURIComponent(username)}`, // fallback if role is mislabeled
  ];

  let lastText = '';
  for (const url of endpoints) {
    try {
      const res = await tryGet(url);
      if (res.ok) {
        const json = await res.json();
        return normalizeProfile(json);
      }
      lastText = (await res.text().catch(() => '')) || res.statusText || '';
      if (res.status === 401) throw new Error('Unauthorized');
    } catch (e) {
      lastText = e?.message || 'Request failed';
    }
  }
  throw new Error(`GET profile 404: ${lastText || 'Not found'}`);
}

async function updateBio(username, bio) {
  const candidates = [
    `${API_BASE}/api/subscriber/${encodeURIComponent(username)}/bio`,
    `${API_BASE}/api/users/${encodeURIComponent(username)}/bio`,
    `${API_BASE}/api/profile/${encodeURIComponent(username)}/bio`,
  ];

  let lastErr = '';
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ bio }),
      });
      if (res.ok) {
        const json = await res.json();
        return normalizeProfile(json);
      }
      lastErr = (await res.text().catch(() => '')) || res.statusText || '';
      if (res.status === 401) throw new Error('Unauthorized');
    } catch (e) {
      lastErr = e?.message || 'Request failed';
    }
  }
  throw new Error(`PUT bio failed: ${lastErr || 'No matching endpoint'}`);
}

/* ---------------------------------------------------------
   Component
   --------------------------------------------------------- */
export default function SubscriberProfilePage({ params }) {
  const router = useRouter();
  const routeUsername = params?.username || '';
  const { user: authUser } = useAuth();


  const viewer = useMemo(() => decodeViewer(), []);
  const [profile, setProfile] = useState(null);

// Robust self-detection: username OR id OR email match (AuthContext + JWT)
const isSelf = useMemo(() => {
  const vUser = viewer?.username || authUser?.username;
  const vId = viewer?.sub || authUser?.id;
  const vEmail = viewer?.email || authUser?.email;
  const pUser = profile?.username;
  const pId = profile?.id;
  const pEmail = profile?.email;

  return (
    (vUser && routeUsername && eqCI(vUser, routeUsername)) ||
    (vUser && pUser && eqCI(vUser, pUser)) ||
    (vId && pId && String(vId) === String(pId)) ||
    (vEmail && pEmail && eqCI(vEmail, pEmail))
  );
}, [
  viewer?.username, viewer?.sub, viewer?.email,
  authUser?.username, authUser?.id, authUser?.email,
  routeUsername, profile?.username, profile?.id, profile?.email
]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!routeUsername) return;

    (async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const p = await getProfile(routeUsername);

        // If backend says this username is a creator, route to creator profile
        if (p?.role && String(p.role).toLowerCase() === 'creator') {
          if (!alive) return;
          router.replace(`/creator/${encodeURIComponent(routeUsername)}`);
          return;
        }

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

    return () => {
      alive = false;
    };
  }, [routeUsername, router]);

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

  return (
    <div className="w-full max-w-4xl mx-auto p-6 text-black">
      {/* Header / Banner */}
      <div className="relative">
        <div
          className="h-40 w-full rounded-2xl bg-gradient-to-r from-blue-200 via-cyan-200 to-sky-200"
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
          <div className={`text-2xl ${THEME.usernameText}`}>@{profile.username || routeUsername}</div>
          <div className={`text-sm ${THEME.roleText}`}>
            {profile.role ? `Subscriber • ${profile.role}` : 'Subscriber'}
          </div>
        </div>
      </div>

      {/* Contact / Meta */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl border ${THEME.boxBorder} p-4 ${THEME.boxBackground}`}>
          <div className={`text-sm ${THEME.boxTitle}`}>Email</div>
          <div className={`text-sm break-words ${THEME.boxContent}`}>
            {profile.email ? String(profile.email) : '—'}
          </div>
        </div>

        <div className={`rounded-2xl border ${THEME.boxBorder} p-4 ${THEME.boxBackground}`}>
          <div className={`text-sm ${THEME.boxTitle}`}>Joined</div>
          <div className={`text-sm ${THEME.boxContent}`}>
            {formatJoinedDate(profile.created_at)}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className={`mt-6 rounded-2xl border ${THEME.boxBorder} p-4 ${THEME.boxBackground}`}>
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
              className={`w-full min-h-[120px] rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${THEME.textareaBorder}`}
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

'use client';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, useCallback } from 'react';

/* =========================================================
   🎨 THEME COLORS & TEXT STYLES — EDIT THESE
   ========================================================= */
const THEME = {
  usernameText: 'text-pink-500 font-bold',
  roleText: 'text-gray-800 font-semibold',
  boxBackground: 'bg-gray-300',
  boxBorder: 'border-gray-400',
  boxTitle: 'text-black font-semibold',
  boxContent: 'text-black',
  editButton: 'border-gray-500 text-black hover:bg-gray-200',
  textarea: 'border-gray-500 text-black',
  saveButton: 'bg-black text-white hover:opacity-90',
  cancelButton: 'border-gray-500 text-black hover:bg-gray-200',
};

const API_BASE = 'http://localhost:5000';

function decodeViewer() {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!t) return { username: null };
    const [, p] = t.split('.');
    if (!p) return { username: null };
    const j = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
    const username = j?.username ?? j?.user?.username ?? j?.name ?? j?.preferred_username ?? null;
    return { username };
  } catch {
    return { username: null };
  }
}

async function getProfile(u) {
  const r = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(u)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`GET ${r.status}`);
  return r.json();
}

async function updateBio(u, bio) {
  const r = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(u)}/bio`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ bio }),
  });
  if (!r.ok) throw new Error(`PUT ${r.status}`);
  return r.json();
}

export default function SubscriberProfilePage() {
  const router = useRouter();
  const routeUsername = (router.query.username || '').toString();

  if (typeof window !== 'undefined') console.warn('SUBSCRIBER THEME ACTIVE >>> pages/subscriber/[username].jsx');

  const viewer = useMemo(() => decodeViewer(), []);
  const isSelf = useMemo(() => {
    if (!viewer?.username || !routeUsername) return false;
    return viewer.username.toLowerCase() === routeUsername.toLowerCase();
  }, [viewer?.username, routeUsername]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!routeUsername) return;
    let alive = true;
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

  const startEdit = useCallback(() => { setBioDraft(profile?.bio || ''); setEditing(true); }, [profile?.bio]);
  const cancelEdit = useCallback(() => { setBioDraft(profile?.bio || ''); setEditing(false); }, [profile?.bio]);
  const saveBio = useCallback(async () => {
    try {
      setSaving(true);
      const updated = await updateBio(routeUsername, bioDraft);
      setProfile(updated);
      setEditing(false);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to update bio.');
    } finally {
      setSaving(false);
    }
  }, [routeUsername, bioDraft]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (errorMsg) return <div className="p-6 text-red-600">Error: {errorMsg}</div>;
  if (!profile) return <div className="p-6">No profile.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white !text-black border-4 border-red-600">
      {/* Banner */}
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
          <div className={`text-2xl ${THEME.usernameText} !text-gray-800`}>
            @{profile.username || routeUsername}
          </div>
          <div className={`text-sm ${THEME.roleText} !text-gray-800`}>
            {profile.role ? `Subscriber • ${profile.role}` : 'Subscriber'}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-4 ${THEME.boxBackground} ${THEME.boxBorder} !bg-gray-300 !border-gray-400`}>
          <div className={`text-sm ${THEME.boxTitle} !text-black`}>Email</div>
          <div className={`text-sm break-words ${THEME.boxContent} !text-black`}>
            {profile.email ? String(profile.email) : '—'}
          </div>
        </div>
        <div className={`rounded-2xl border p-4 ${THEME.boxBackground} ${THEME.boxBorder} !bg-gray-300 !border-gray-400`}>
          <div className={`text-sm ${THEME.boxTitle} !text-black`}>Joined</div>
          <div className={`text-sm ${THEME.boxContent} !text-black`}>
            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className={`mt-6 rounded-2xl border p-4 ${THEME.boxBackground} ${THEME.boxBorder} !bg-gray-300 !border-gray-400`}>
        <div className="flex items-center justify-between">
          <div className={`text-sm ${THEME.boxTitle} !text-black`}>Bio</div>
          {isSelf && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className={`text-sm px-3 py-1 rounded-xl border ${THEME.editButton}`}
            >
              Edit
            </button>
          )}
        </div>

        {!editing && (
          <div className={`mt-2 text-sm whitespace-pre-wrap ${THEME.boxContent} !text-black`}>
            {profile.bio?.trim() ? profile.bio : 'No bio yet.'}
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
                onClick={saveBio}
                disabled={saving}
                className={`text-sm px-4 py-2 rounded-xl ${THEME.saveButton} disabled:opacity-60`}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
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

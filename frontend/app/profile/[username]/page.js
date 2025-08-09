'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SubscriberProfilePage() {
  const params = useParams();
  const rawParam = params?.username; // can be string or array in Next
  const routeUsername = useMemo(() => {
    if (!rawParam) return '';
    return Array.isArray(rawParam) ? rawParam[0] : String(rawParam);
  }, [rawParam]);

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setError('');
      setLoading(true);

      // ✅ Hard guards to avoid early/undefined fetches
      if (!token) {
        setError('You must be logged in to view profiles.');
        setLoading(false);
        return;
      }
      if (!routeUsername) {
        setError('No username in route.');
        setLoading(false);
        return;
      }

      // Normalized username for backend lookup (handles case differences)
      const uname = String(routeUsername).trim();
      const unameLower = uname.toLowerCase();

      // Try username first; if not found, fall back to self
const endpoints = [
  `http://localhost:5000/api/profile/${encodeURIComponent(unameLower)}`,
  `http://localhost:5000/api/user/${encodeURIComponent(unameLower)}`, // optional if you still have this
  `http://localhost:5000/api/profile/self`
];

      try {
        let data = null;
        let lastStatus = 0;

        for (let i = 0; i < endpoints.length; i++) {
          const url = endpoints[i];
          // eslint-disable-next-line no-console
          console.log('Profile fetch:', url);

          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          lastStatus = res.status;

          if (res.ok) {
            data = await res.json();
            break;
          }

          // If 404, try next endpoint; otherwise surface error
          if (res.status !== 404) {
            let msg = 'Request failed';
            try {
              const t = await res.json();
              msg = t?.error || msg;
            } catch {}
            throw new Error(`${msg} (HTTP ${res.status})`);
          }
        }

        if (!data) {
          // Both endpoints 404’d
          throw new Error('User not found (404)');
        }

        const userData = data.user || data; // support either {user: {...}} or {...}
        if (!userData?.username) {
          throw new Error('Malformed user payload');
        }

        if (cancelled) return;

        setUser(userData);
        setBio(userData.bio || '');
        if (userData.avatar_url) {
          // If backend returns a path like /uploads/..., prefix with API origin
          const isAbsolute = /^https?:\/\//i.test(userData.avatar_url);
          setAvatarPreview(
            isAbsolute
              ? userData.avatar_url
              : `http://localhost:5000${userData.avatar_url}`
          );
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('Failed to load user profile:', err?.message || err);
        setError(err?.message || 'Failed to load profile');
        setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [routeUsername, token]);

  const handleBioSave = async () => {
    try {
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('http://localhost:5000/api/user/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) throw new Error('Failed to update bio');

      const updated = await res.json();
      setUser((prev) => ({ ...prev, bio: updated.bio }));
      setEditingBio(false);
    } catch (err) {
      alert('Failed to update bio');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('http://localhost:5000/api/uploads/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setUser((prev) => ({ ...prev, avatar_url: data.avatar }));

      const isAbsolute = /^https?:\/\//i.test(data.avatar);
      setAvatarPreview(
        isAbsolute ? data.avatar : `http://localhost:5000${data.avatar}`
      );
      setAvatarFile(null);
      alert('Avatar uploaded successfully');
    } catch (err) {
      alert('Failed to upload avatar');
    }
  };

  if (loading) return <p className="p-4">Loading profile...</p>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <main className="p-6 sm:p-8 max-w-2xl mx-auto text-white space-y-4">
      <h1 className="text-3xl font-bold">@{user.username}</h1>
      <p className="text-sm text-gray-400">Email: {user.email}</p>
      <p className="text-sm text-gray-400">Role: {user.role}</p>

      {/* Avatar Preview */}
      {avatarPreview && (
        <img
          src={avatarPreview}
          alt="Avatar"
          className="w-32 h-32 rounded-full border mt-4"
        />
      )}

      {/* Avatar Upload */}
      <div className="mt-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="text-sm"
        />
        {avatarFile && (
          <button
            onClick={handleAvatarUpload}
            className="ml-2 px-4 py-1 bg-pink-600 hover:bg-pink-700 rounded text-white text-sm"
          >
            Upload
          </button>
        )}
      </div>

      {/* Bio Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-1">Bio</h2>
        {editingBio ? (
          <div className="space-y-2">
            <textarea
              className="w-full bg-gray-800 p-2 rounded text-white"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleBioSave}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-1 rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingBio(false);
                  setBio(user.bio || '');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-300 mb-2">
              {user.bio || 'No bio yet.'}
            </p>
            <button
              onClick={() => setEditingBio(true)}
              className="text-sm text-pink-400 hover:underline"
            >
              Edit Bio
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

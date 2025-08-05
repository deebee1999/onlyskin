'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ bio: '', avatar_url: '', banner_url: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          banner_url: data.banner_url || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load profile');
        setLoading(false);
      });
  }, [router]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }

      router.push('/profile');
    } catch (err) {
      console.error('Update error:', err.message);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white p-6">Loading...</p>;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Edit Profile</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg max-w-xl mx-auto space-y-4"
      >
        {error && <p className="text-red-400">{error}</p>}

        <div>
          <label className="block text-sm mb-1">Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Avatar URL</label>
          <input
            type="text"
            name="avatar_url"
            value={profile.avatar_url}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Banner Image URL</label>
          <input
            type="text"
            name="banner_url"
            value={profile.banner_url}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </main>
  );
}

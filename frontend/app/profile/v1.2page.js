
//--------------only showing editable form on profile page -----------

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ bio: '', avatar_url: '', banner_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    fetch('/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
        console.error('Error fetching profile:', err);
        router.push('/login');
      });
  }, [router]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

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

      if (!res.ok) throw new Error('Failed to update profile');

      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white p-6">Loading profile editor...</p>;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="bg-zinc-800 p-6 rounded-lg max-w-xl mx-auto space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Bio</label>
          <textarea
            name="bio"
            rows={4}
            value={profile.bio}
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Avatar URL</label>
          <input
            type="text"
            name="avatar_url"
            value={profile.avatar_url}
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Banner URL</label>
          <input
            type="text"
            name="banner_url"
            value={profile.banner_url}
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
          />
        </div>

        {message && <div className="text-sm text-green-400">{message}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded text-white"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

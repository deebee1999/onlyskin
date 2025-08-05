//--------7=28=25----------------------

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setBio(data.bio || '');
        setBanner(data.banner_url || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load profile');
        setLoading(false);
      });
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5000/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio, banner_url: banner }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }

      alert('Profile updated!');
      router.push('/profile');
    } catch (err) {
      console.error('Update error:', err.message);
      setError(err.message);
    }
  };

  if (loading) return <p className="text-white p-6">Loading...</p>;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Edit Profile</h1>
      <form
        onSubmit={handleSave}
        className="bg-gray-800 p-6 rounded-lg max-w-xl mx-auto space-y-4"
      >
        {error && <p className="text-red-400">{error}</p>}

        <div>
          <label className="block text-sm mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Banner Image URL</label>
          <input
            type="text"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white"
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}

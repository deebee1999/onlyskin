//---------------before creating edit profile Ui and hook up logic----------

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // =========================
  // SECTION: Load current profile
  // =========================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    fetch('http://localhost:5000/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.email || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load profile');
      });
  }, [router]);

  // =========================
  // SECTION: Submit updates
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    const body = { email, bio, avatar_url: avatarUrl };
    if (password) body.password = password;

    try {
    
	const res = await fetch('http://localhost:5000/api/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(body),
});



/*  const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });  */

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || 'Update failed');
      }

      alert('Profile updated!');
      router.push('/profile');
    } catch (err) {
      console.error(err);
      alert('Save error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-pink-500">Edit Profile</h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 bg-gray-800 p-6 rounded-lg"
      >
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email || ''}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Bio</label>
          <textarea
            value={bio || ''}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Avatar URL</label>
          <input
            type="text"
            value={avatarUrl || ''}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            value={password || ''}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 py-2 rounded text-white"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </main>
  );
}

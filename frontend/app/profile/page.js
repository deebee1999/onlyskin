'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
        setErrorMsg('Failed to load profile');
        setLoading(false);
      });
  }, [router]);

  if (loading) return <p className="text-white p-6">Loading profile...</p>;
  if (errorMsg) return <p className="text-red-500 p-6">{errorMsg}</p>;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {user.banner_url && (
        <div className="mb-4">
          <img
            src={user.banner_url}
            alt="Banner"
            className="w-full max-h-64 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Avatar"
            className="w-20 h-20 rounded-full border-2 border-pink-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-lg">
            ?
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">@{user.username}</h1>
          {user.bio && <p className="text-gray-300 mt-1">{user.bio}</p>}
        </div>
      </div>

      <button
        onClick={() => router.push('/profile/edit')}
        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
      >
        Edit Profile
      </button>
    </main>
  );
}

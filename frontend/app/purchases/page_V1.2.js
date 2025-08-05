'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function MyPurchasesPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    fetch('http://localhost:5000/api/purchases', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load'))
      .then(data => setPosts(data))
      .catch(err => setError('Could not load purchases.'));
  }, [token]);

  return (
    <main className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-pink-500">My Purchases</h1>

      {error && <p className="text-red-400">{error}</p>}

      <ul className="space-y-4">
        {posts.map(post => (
          <li key={post.id} className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-400">From @{post.username}</p>
            <p className="mt-2">{post.unlocked ? post.content : '🔒 Locked'}</p>
          </li>
        ))}
      </ul>

      {!posts.length && !error && (
        <p className="text-gray-400">You haven’t purchased any posts yet.</p>
      )}
    </main>
  );
}

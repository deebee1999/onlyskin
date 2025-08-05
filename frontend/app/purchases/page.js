'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function MyPurchasesPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [unlockMap, setUnlockMap] = useState({});
  const [error, setError] = useState('');

  // Fetch full post details
  useEffect(() => {
    if (!token) return;

    fetch('http://localhost:5000/api/purchases', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load purchases'))
      .then(data => setPosts(data))
      .catch(() => setError('Could not load purchases.'));
  }, [token]);

  // Fetch unlocked post IDs + expiration timestamps
  useEffect(() => {
    if (!token) return;

    fetch('http://localhost:5000/api/purchases/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load unlocks'))
      .then(data => {
        const map = {};
        for (const item of data.purchased) {
          const purchasedAt = new Date(item.purchased_at);
          const expiresAt = new Date(purchasedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
          const remaining = Math.max(0, expiresAt - Date.now());
          const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
          map[item.postId] = {
            unlocked: daysLeft > 0,
            expires_in: daysLeft,
          };
        }
        setUnlockMap(map);
      })
      .catch(() => setUnlockMap({}));
  }, [token]);

  return (
    <main className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-pink-500">My Purchases</h1>

      {error && <p className="text-red-400">{error}</p>}

      <ul className="space-y-4">
        {posts.map(post => {
          const unlock = unlockMap[post.id] || {};
          const isUnlocked = unlock.unlocked;
          const expiresIn = unlock.expires_in;

          return (
            <li key={post.id} className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-400">
                 From @{post.creator}</p>

              {isUnlocked ? (
                <>
                  <p className="mt-2">{post.content}</p>
                  {expiresIn !== undefined && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Unlocked • {expiresIn} day{expiresIn !== 1 ? 's' : ''} left
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-gray-500">🔒 Locked — Access expired</p>
              )}
            </li>
          );
        })}
      </ul>

      {!posts.length && !error && (
        <p className="text-gray-400">You haven’t purchased any posts yet.</p>
      )}
    </main>
  );
}

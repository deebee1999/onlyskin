



//-------------------end of new code---------------------------------------

//---------------working old code before adding followers---------------------

'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('JWT Token:', token); // ✅ Debug log here
    if (!token) {
      setError('You must be logged in to view your dashboard.');
      setLoading(false);
      return;
    }

    fetch('http://localhost:5000/api/posts/dashboard/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err.message);
        setError('Failed to load your posts');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <main className="p-8">
<div className="flex items-center justify-between mb-4">
  <h1 className="text-3xl font-bold">Your Dashboard</h1>
  <button
    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded"
    onClick={() => window.location.href = '/create-post'}
  >
    + New Post
  </button>
</div>

      {/* ✅ "View My Purchases" button */}
      <div className="mb-6">
        <a
          href="/purchases"
          className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded"
        >
          View My Purchases
        </a>
      </div>

      {posts.length === 0 ? (
        <p>You haven’t posted anything yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-gray-800 text-white p-4 rounded mb-4">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-300 mb-2">${post.price}</p>
            <p className="text-gray-400">{post.content}</p>
          </div>
        ))
      )}
    </main>
  );
}


//

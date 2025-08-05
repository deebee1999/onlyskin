'use client';

import { useEffect, useState } from 'react';

export default function CreatorPage({ params }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!params?.username) {
      console.error('No username in params');
      setErrorMsg('Invalid URL or username missing');
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/creator/${params.username}/posts`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setErrorMsg('Failed to load posts');
        setLoading(false);
      });
  }, [params?.username]);  // ✅ safer dependency

  if (loading) return <p>Loading...</p>;
  if (errorMsg) return <p className="text-red-400">{errorMsg}</p>;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">{params.username}'s Posts</h1>
      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="p-4 bg-gray-800 rounded mb-4">
            <h2 className="text-lg font-bold mb-2">{post.title}</h2>
            <p className="text-sm text-gray-400 mb-2">Price: ${post.price}</p>
            <button className="bg-pink-600 text-white rounded px-4 py-2 mt-2">
              Unlock for ${post.price}
            </button>
          </div>
        ))
      )}
    </main>
  );
}

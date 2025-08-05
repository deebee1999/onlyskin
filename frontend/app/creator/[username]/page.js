'use client';

import { useEffect, useState } from 'react';

export default function CreatorPage({ params }) {
  const username = params.username.toLowerCase();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in to view content');
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/creator/${username}/posts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err.message);
        setErrorMsg('Failed to load posts');
        setLoading(false);
      });

    fetch(`http://localhost:5000/api/user/${username}/follow-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setIsFollowing(data.following))
      .catch(err => console.error('Follow status error:', err.message));
  }, [username]);

  const handleUnlock = async (post) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          price: post.price * 100,
          productName: `Unlock post #${post.id}`,
          postId: post.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout error');
      window.location.href = data.url;
    } catch (err) {
      console.error('Unlock error:', err.message);
      alert('Checkout failed: ' + err.message);
    }
  };

  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (errorMsg) return <p className="text-center text-red-500 py-8">{errorMsg}</p>;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{username}'s Posts</h1>

      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        posts.map((post, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-400">Price: ${post.price}</p>

            {post.unlocked ? (
              <>
                <p className="text-white my-2">{post.content}</p>

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {post.media_urls.map((item, i) => {
                      const fullUrl = item.url.startsWith('http')
                        ? item.url
                        : `http://localhost:5000${item.url}`;

                      return item.type === 'video' ? (
                        <video key={i} src={fullUrl} controls className="w-full sm:w-48 rounded" />
                      ) : (
                        <img key={i} src={fullUrl} alt={`media-${i}`} className="w-full sm:w-48 rounded" />
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => handleUnlock(post)}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded mt-3"
              >
                {post.expired ? `Repurchase for $${post.price}` : `Unlock for $${post.price}`}
              </button>
            )}
          </div>
        ))
      )}
    </main>
  );
}

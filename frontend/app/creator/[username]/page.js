'use client';

import { useEffect, useState } from 'react';

export default function CreatorPage({ params }) {
  const [unlockedIds, setUnlockedIds] = useState([]);
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

    // Fetch posts
    fetch(`http://localhost:5000/api/creator/${username}/posts`, {
      headers: { Authorization: `Bearer ${token}` }
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

        // Fetch unlocked post IDs
        fetch('http://localhost:5000/api/purchases/mine', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            const unlockedPostIds = data.purchased.map(p => p.postId);
            const purchaseMap = Object.fromEntries(
              data.purchased.map(p => [p.postId, p.purchased_at])
            );

            setUnlockedIds(unlockedPostIds);

            setPosts(prev =>
              prev.map(post =>
                unlockedPostIds.includes(post.id)
                  ? {
                      ...post,
                      unlocked: true,
                      expired: false,
                      purchased_at: purchaseMap[post.id]
                    }
                  : post
              )
            );
          })
          .catch(err => {
            console.error('Failed to fetch unlocks:', err.message);
          });
      })
      .catch((err) => {
        console.error('Fetch posts error:', err.message);
        setErrorMsg('Failed to load posts');
        setLoading(false);
      });

    // Fetch follow status
    fetch(`http://localhost:5000/api/user/${username}/follow-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setIsFollowing(data.following))
      .catch(err => {
        console.error('Failed to check follow status:', err.message);
      });
  }, [username]);

  const handleUnlock = async (post) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in first');

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

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      window.location.href = data.url;
    } catch (err) {
      console.error('Unlock error:', err.message);
      alert('Redirect to checkout failed: ' + err.message);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/follow/${username}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setIsFollowing(true);
    } catch (err) {
      console.error('Follow failed:', err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/follow/${username}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setIsFollowing(false);
    } catch (err) {
      console.error('Unfollow failed:', err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    const token = localStorage.getItem('token');
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        alert('Delete failed: ' + data.error);
        return;
      }

      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete error:', err.message);
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (errorMsg) return <p className="text-red-400 text-center py-8">{errorMsg}</p>;

  return (
    <main className="px-4 py-8 sm:px-6 md:px-8 max-w-screen-md mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">{username}'s Posts</h1>
        <button
          onClick={isFollowing ? handleUnfollow : handleFollow}
          disabled={followLoading}
          className={`w-full sm:w-auto px-5 py-3 text-sm rounded-lg text-white ${
            isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-pink-600 hover:bg-pink-700'
          }`}
        >
          {followLoading ? 'Please wait...' : isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-center">No posts found.</p>
      ) : (
        posts.map((post, index) => (
          <div key={index} className="w-full bg-gray-800 rounded-xl p-5 mb-8 shadow-lg">
            <h2 className="text-lg font-bold">{post.title}</h2>
            <p className="text-sm text-gray-400">Price: ${post.price}</p>
            <p className="text-xs text-gray-500">Post ID: {post.id}</p>

            {post.unlocked ? (
              <>
                <p className="text-white mt-2">{post.content}</p>

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {post.media_urls.map((item, i) => {
                      const url = typeof item === 'string' ? item : item?.url || '';
                      const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
                      return url.endsWith('.mp4') ? (
                        <video key={i} src={fullUrl} controls className="w-full sm:w-40 rounded border" />
                      ) : (
                        <img key={i} src={fullUrl} alt={`media-${i}`} className="w-full sm:w-40 rounded border" />
                      );
                    })}
                  </div>
                )}

                {!post.expired && post.purchased_at && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Access expires in{' '}
                    {Math.max(
                      0,
                      Math.ceil(
                        (7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(post.purchased_at).getTime())) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{' '}
                    day(s)
                  </p>
                )}

                {post.userIsCreator && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded mt-2"
                  >
                    Delete
                  </button>
                )}
              </>
            ) : post.expired ? (
              <div>
                <button
                  onClick={() => handleUnlock(post)}
                  className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded mt-3 w-full sm:w-auto"
                >
                  Repurchase for ${post.price}
                </button>
                <p className="text-xs text-yellow-400 mt-1">
                  Access expired. Please repurchase to view again.
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => handleUnlock(post)}
                  className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded mt-3 w-full sm:w-auto"
                >
                  Unlock for ${post.price}
                </button>
                <p className="text-xs text-gray-400 mt-1">Locked content</p>
              </div>
            )}
          </div>
        ))
      )}
    </main>
  );
}

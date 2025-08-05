'use client';

import { useEffect, useState } from 'react';

import NewPostForm from './NewPostForm';


export default function DashboardPage() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view your dashboard.');
      setLoading(false);
      return;
    }

    // Fetch posts
    fetch('http://localhost:5000/api/posts/dashboard/', {
      headers: { Authorization: `Bearer ${token}` },
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

    // Fetch follower stats
    fetch('http://localhost:5000/api/user/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFollowers(data.followers || 0);
        setFollowing(data.following || 0);
      })
      .catch((err) => {
        console.error('Failed to load follower stats:', err.message);
      });

    // Notifications polling
    const fetchNotifications = () => {
      fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.is_read).length);
        })
        .catch((err) => {
          console.error('Notification fetch error:', err);
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0);

    fetch('http://localhost:5000/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <main className="p-4 sm:p-6 md:p-8 relative min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Your Dashboard</h1>

        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={handleNotificationsClick}
            className="relative bg-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-600 text-sm sm:text-base"
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-600 text-xs rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded text-sm sm:text-base"
            onClick={() => window.location.href = '/create-post'}
          >
            + New Post
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-4 sm:right-8 top-28 sm:top-24 bg-zinc-800 w-full sm:w-80 p-4 rounded shadow-lg z-50">
          <h3 className="text-lg font-bold mb-2">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400">No notifications yet</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-zinc-700 pb-2">
                  {n.type === 'follow' && <p className="text-sm">🎉 Someone followed you!</p>}
                  {n.type === 'unlock' && <p className="text-sm">💰 Someone unlocked post #{n.metadata?.post_id}</p>}
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stats and Purchases */}
      <div className="mb-6 space-y-2 text-sm sm:text-base">
        <div className="text-gray-300">
          👥 Followers: <strong>{followers}</strong> <br />
          ➡️ Following: <strong>{following}</strong>
        </div>

        <a
          href="/purchases"
          className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded"
        >
          View My Purchases
        </a>
      </div>

      {/* Posts */}
      <NewPostForm onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])} />

      {posts.length === 0 ? (
        <p>You haven’t posted anything yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-gray-800 text-white p-4 rounded mb-4 shadow-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-1">{post.title}</h2>
            <p className="text-sm text-gray-300 mb-2">${post.price}</p>
            <p className="text-gray-400 mb-2">{post.content}</p>

            {post.media_urls && post.media_urls.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-2">
                {post.media_urls.map((url, index) =>
                  url.endsWith('.mp4') ? (
                    <video key={index} src={url} controls className="w-36 sm:w-40 rounded border" />

                  ) : (
                    <img key={index} src={url} alt={`media-${index}`} className="w-36 sm:w-40 rounded border" />
                  )
                )}
              </div>
            )}
          </div>
        ))
      )}
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function PPVPost({ post }) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/ppv/status/${post.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUnlocked(data.unlocked);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setFeedback('Failed to check unlock status');
      });
  }, [post.id]);

  const handlePurchase = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ppv/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (!res.ok) return setFeedback(data.error || 'Purchase failed');
      setUnlocked(true);
      setFeedback('Purchase successful!');
    } catch (err) {
      console.error(err);
      setFeedback('Purchase failed');
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded mb-4 shadow-lg">
      <h3 className="text-lg font-bold text-pink-400 mb-2">{post.title}</h3>
      {unlocked ? (
        <div className="text-white">{post.content}</div>
      ) : (
        <>
          <p className="text-gray-400 mb-2">This post is pay-per-view content.</p>
          <button
            onClick={handlePurchase}
            className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white font-semibold"
          >
            Unlock for ${post.price || 5}
          </button>
          {feedback && (
            <p className="text-sm mt-2 text-pink-300">{feedback}</p>
          )}
        </>
      )}
    </div>
  );
}

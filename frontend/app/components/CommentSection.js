'use client';

import { useEffect, useState } from 'react';

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // =========================
  // SECTION: Load comments
  // =========================
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/comments/${postId}`);
        const data = await res.json();
        if (res.ok) setComments(data);
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    };

    fetchComments();
  }, [postId]);

  // =========================
  // SECTION: Submit new comment
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/comments/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data]);
        setNewComment('');
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold mb-2">Comments</h4>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2 mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 rounded bg-gray-700 text-white"
          rows={2}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      <ul className="space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300">@{comment.username}</p>
            <p className="text-white">{comment.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}


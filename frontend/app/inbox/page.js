'use client';

import { useEffect, useState } from 'react';

export default function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [feedback, setFeedback] = useState('');

  const loadMessages = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/messages/inbox', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
      setFeedback('Error loading messages');
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch('http://localhost:5000/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ messageId: id }),
      });
      if (res.ok) {
        loadMessages();
      } else {
        setFeedback('Failed to mark as read');
      }
    } catch (err) {
      console.error(err);
      setFeedback('Error marking as read');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Inbox</h1>
      {feedback && <p className="text-red-400">{feedback}</p>}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400">From: {msg.sender_username}</p>
            <p className="my-2">{msg.content}</p>
            <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
            {!msg.is_read && (
              <button
                onClick={() => markAsRead(msg.id)}
                className="mt-2 text-pink-400 text-sm hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

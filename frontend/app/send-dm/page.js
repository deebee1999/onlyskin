'use client';

import { useState } from 'react';

export default function SendDMPage() {
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setFeedback('');

    try {
      const res = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ recipientId, message }),
      });
      const data = await res.json();
      if (!res.ok) return setFeedback(data.error || 'Failed to send');
      setFeedback('Message sent!');
      setRecipientId('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setFeedback('Error sending message');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Send Direct Message</h1>
      <form onSubmit={handleSend} className="space-y-4 max-w-md">
        <input
          type="number"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="Recipient User ID"
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your message..."
          className="w-full p-2 rounded bg-gray-700 text-white"
          rows="4"
          required
        />
        <button className="bg-pink-600 py-2 px-4 rounded">Send Message</button>
      </form>
      {feedback && <p className="mt-2 text-sm">{feedback}</p>}
    </main>
  );
}

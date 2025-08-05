'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || 'Error occurred');
      setMessage(`Reset link token: ${data.token} (for demo, copy this for reset)`);
    } catch (err) {
      console.error(err);
      setMessage('Error sending reset request');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-pink-500">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />
        <button className="w-full bg-pink-600 py-2 rounded">Send Reset Link</button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </main>
  );
}

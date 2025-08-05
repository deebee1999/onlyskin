//-------working before update 7-29-25-----------

'use client';

import { useState } from 'react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || 'Error occurred');
      setMessage('Password reset successful. You can now log in.');
    } catch (err) {
      console.error(err);
      setMessage('Error resetting password');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-pink-500">Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your reset token"
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />
        <button className="w-full bg-pink-600 py-2 rounded">Reset Password</button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </main>
  );
}

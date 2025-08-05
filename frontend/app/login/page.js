'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFailCount((prev) => prev + 1);
        return setErrorMsg(data.error || 'Login failed');
      }

      // Save token + user in context
      login(data.token, data.user);

      // Redirect to profile page after login
      router.push('/profile');
    } catch (err) {
      console.error(err);
      setErrorMsg('Login error');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-pink-500">Login to OnlySkins</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />
        <button className="w-full bg-pink-600 py-2 rounded">Login</button>
      </form>

      {errorMsg && <p className="mt-4 text-red-400">{errorMsg}</p>}

      {failCount >= 2 && (
        <a
          href="/forgot-password"
          className="mt-4 text-sm text-pink-400 hover:underline"
        >
          Forgot Password?
        </a>
      )}
    </main>
  );
}

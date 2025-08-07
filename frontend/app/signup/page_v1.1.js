'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('creator');

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await res.json();
      console.log(data);

      if (res.ok) {
        alert('Signup successful!');
        window.location.href = '/login';
      } else {
        alert(data.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      alert('Signup error');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col justify-center items-center p-8 text-white">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-pink-500 drop-shadow-lg">Join OnlySkins</h1>
      
      <form
        onSubmit={handleSignup}
        className="bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-xl max-w-sm w-full space-y-6"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="creator">Creator</option>
          <option value="subscriber">Subscriber</option>
        </select>
        <button
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded transition duration-300"
        >
          Sign Up
        </button>
      </form>

      <p className="text-gray-400 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-pink-400 hover:text-pink-500 font-semibold">
          Login
        </Link>
      </p>

      <p className="text-gray-400 text-sm text-center mt-4 max-w-sm">
        By signing up you confirm that you are{' '}
        <span className="font-semibold text-pink-400">18 years of age or older</span> and agree to our{' '}
        <Link href="/legal/terms" className="text-pink-400 hover:text-pink-500 underline">Terms of Service</Link>,{' '}
        <Link href="/legal/privacy" className="text-pink-400 hover:text-pink-500 underline">Privacy Policy</Link>, and{' '}
        <Link href="/legal/dmca" className="text-pink-400 hover:text-pink-500 underline">DMCA</Link>.
      </p>
    </main>
  );
}

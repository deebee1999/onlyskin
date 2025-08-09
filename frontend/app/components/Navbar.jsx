'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, token, logout, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // 🔍 Handle Search Submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      router.push(`/creator/${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-black text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow">
      {/* ✅ LEFT: Logo */}
      <div>
        <Link href="/" className="text-xl font-bold text-pink-500">
          OnlySkins
        </Link>
      </div>

      {/* ✅ CENTER: Search bar */}
      <form onSubmit={handleSearch} className="flex-grow sm:max-w-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search username..."
          className="w-full px-3 py-1.5 rounded bg-gray-700 text-white placeholder-gray-400"
        />
      </form>

      {/* ✅ RIGHT: Auth Links */}
      <div className="flex items-center gap-4">
        {!loading && !user && (
          <>
            <Link href="/signup" className="hover:text-pink-400">
              Sign Up
            </Link>
            <Link href="/login" className="hover:text-pink-400">
              Login
            </Link>
          </>
        )}

        {!loading && user?.role === 'creator' && (
          <>
            <Link href="/dashboard" className="hover:text-pink-400">
              Dashboard
            </Link>
            <Link href={`/creator/${user.username}`} className="hover:text-pink-400">
              Profile
            </Link>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="text-white hover:text-pink-400 ml-2"
            >
              Logout
            </button>
          </>
        )}

        {!loading && user?.role === 'subscriber' && (
          <>
            <Link href="/dashboard" className="hover:text-pink-400">
              Dashboard
            </Link>
            <Link href="/purchases" className="hover:text-pink-400">
              Purchases
            </Link>
            <Link href={`/profile/${user.username}`} className="hover:text-pink-400">
              Profile
            </Link>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="text-white hover:text-pink-400 ml-2"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

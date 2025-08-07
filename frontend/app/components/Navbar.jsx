'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, logout, loading } = useAuth();

  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow">
      {/* ✅ LEFT: Always show logo */}
      <div>
        <Link href="/" className="text-xl font-bold text-pink-500">
          OnlySkins
        </Link>
      </div>

      {/* ✅ RIGHT: Auth links */}
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
            <button onClick={logout} className="text-white hover:text-pink-400 ml-2">
              Logout
            </button>
          </>
        )}

        {!loading && user?.role === 'subscriber' && (
          <>
            <Link href="/purchases" className="hover:text-pink-400">
              Purchases
            </Link>
            <Link href={`/creator/${user.username}`} className="hover:text-pink-400">
              Profile
            </Link>
            <button onClick={logout} className="text-white hover:text-pink-400 ml-2">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

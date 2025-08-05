// before 7-30-25 update---------------

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState(null);

  // Check token on every path change (so navbar updates across pages)
  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/'); // Redirect to home after logout
  };

  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    const username = searchValue.trim().toLowerCase();
    router.push(`/creator/${username}`);
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link href="/" className="font-bold text-pink-500 text-xl">OnlySkins</Link>
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        {token && (
          <Link href="/profile" className="hover:underline">Profile</Link>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search username"
            className="p-1 rounded bg-gray-700 text-white"
          />
          <button
            type="submit"
            className="bg-pink-600 hover:bg-pink-700 text-white py-1 px-2 rounded"
          >
            Search
          </button>
        </form>

        {token ? (
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
          >
            Logout
          </button>
        ) : (
          <>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/signup" className="hover:underline">Join Now</Link>
          </>
        )}
      </div>
    </nav>
  );
}




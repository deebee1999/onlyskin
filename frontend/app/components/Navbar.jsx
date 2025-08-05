'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react'; // Lucide icons (already available)

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    const username = searchValue.trim().toLowerCase();
    router.push(`/creator/${username}`);
    setSearchValue('');
    setMenuOpen(false); // Close mobile menu after search
  };

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center">
        {/* Brand & Toggle */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-pink-500 text-xl">OnlySkins</Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="sm:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center space-x-4">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {token && <Link href="/profile" className="hover:underline">Profile</Link>}

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
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="flex flex-col mt-4 space-y-2 sm:hidden">
          <Link href="/dashboard" className="hover:underline" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          {token && <Link href="/profile" className="hover:underline" onClick={() => setMenuOpen(false)}>Profile</Link>}

          <form onSubmit={handleSearch} className="flex flex-col space-y-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search username"
              className="p-2 rounded bg-gray-700 text-white"
            />
            <button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded"
            >
              Search
            </button>
          </form>

          {token ? (
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="hover:underline" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/signup" className="hover:underline" onClick={() => setMenuOpen(false)}>Join Now</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

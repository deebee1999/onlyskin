'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [searchUsername, setSearchUsername] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const name = searchUsername.trim();
    if (name) {
      router.push(`/creator/${name}`);
      setSearchUsername('');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col justify-center items-center px-4 py-12 sm:p-8">
      {/* Hero */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-pink-500 mb-4 text-center drop-shadow-lg">
        Welcome to OnlySkins
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 text-center max-w-xl">
        Exclusive content from your favorite creators. Sexy. Private. Premium.
      </p>

      {/* Creator Search */}
      <form onSubmit={handleSearch} className="w-full max-w-md flex mb-10">
        <input
          type="text"
          placeholder="Search a creator by username"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className="flex-grow px-4 py-3 rounded-l-md bg-gray-800 text-white placeholder-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-r-md text-white font-semibold"
        >
          Go
        </button>
      </form>

      {/* Feature Highlights */}
      <ul className="space-y-4 text-center mb-16 max-w-xs sm:max-w-xl">
        <li className="flex items-start justify-start sm:items-center sm:justify-center space-x-2 text-sm sm:text-base">
          <span>🔒</span>
          <span>Secure, private connections between creators & fans</span>
        </li>
        <li className="flex items-start justify-start sm:items-center sm:justify-center space-x-2 text-sm sm:text-base">
          <span>🎥</span>
          <span>Photo, video, and live‐streamed content</span>
        </li>
        <li className="flex items-start justify-start sm:items-center sm:justify-center space-x-2 text-sm sm:text-base">
          <span>💰</span>
          <span>Direct tipping & pay‐per‐view posts for extra earnings</span>
        </li>
      </ul>

      {/* Call-to-Action */}
      <button
        onClick={() => router.push('/dashboard')}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded shadow-lg transition mb-12 sm:mb-0"
      >
        Explore Your Dashboard
      </button>

      {/* Footer Legal Links */}
      <footer className="text-center text-gray-400 mt-12 text-sm">
        <p className="flex flex-wrap justify-center gap-4">
          <a href="/legal/terms" className="underline hover:text-white">Terms of Service</a>
          <a href="/legal/privacy" className="underline hover:text-white">Privacy Policy</a>
          <a href="/legal/dmca" className="underline hover:text-white">DMCA</a>
        </p>
      </footer>
    </main>
  );
}

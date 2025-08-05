'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsernameSearch() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // Force lowercase for URL
    const username = inputValue.trim().toLowerCase();
    router.push(`/creator/${username}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center space-x-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search username"
        className="p-2 rounded bg-gray-700 text-white"
      />
      <button
        type="submit"
        className="bg-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded"
      >
        Search
      </button>
    </form>
  );
}

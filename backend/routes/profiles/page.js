'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('This is my bio. You can update this soon!');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // =========================
  // SECTION: Check login + load username
  // =========================
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      alert('You must be logged in to view this page.');
      router.push('/login');
    } else {
      setToken(storedToken);
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        setUsername('myusername');
      }
    }
  }, [router]);

  // =========================
  // SECTION: Fetch follow stats from backend
  // =========================
  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/profile/follow-stats')
        .then((res) => res.json())
        .then((data) => {
          setFollowersCount(data.followersCount);
          setFollowingCount(data.followingCount);
        })
        .catch((err) => {
          console.error('Error fetching follow stats:', err);
        });
    }
  }, [token]);

  // =========================
  // SECTION: Logout function
  // =========================
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  // =========================
  // SECTION: Edit Profile (placeholder)
  // =========================
  const handleEditProfile = () => {
    alert('Edit Profile feature coming soon!');
  };

  // =========================
  // SECTION: Username Search (top-right for now)
  // =========================
  const [searchUsername, setSearchUsername] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchUsername.trim() !== '') {
      router.push(`/creator/${searchUsername.trim()}`);
    }
  };

  if (!token) return null;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8 flex flex-col items-center">

      {/* ========================= */}
      {/* SECTION: Top-Right Username Search */}
      {/* ========================= */}
      <form
        onSubmit={handleSearch}
        className="absolute top-6 right-6 flex space-x-2"
      >
        <input
          type="text"
          placeholder="Username"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className="w-40 px-3 py-2 rounded bg-gray-700 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-4 py-2 rounded transition duration-300"
        >
          Search
        </button>
      </form>

      {/* ========================= */}
      {/* SECTION: Profile Header */}
      {/* ========================= */}
      <div className="flex flex-col items-center mb-8 mt-16">
        <div className="w-32 h-32 rounded-full bg-gray-700 mb-4"></div>
        <h1 className="text-4xl font-bold text-pink-500 mb-2 drop-shadow-lg">
          {username}
        </h1>
        <button
          onClick={handleEditProfile}
          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded mb-4 transition duration-300"
        >
          Edit Profile
        </button>
      </div>

      {/* ========================= */}
      {/* SECTION: Followers / Following */}
      {/* ========================= */}
      <div className="flex space-x-12 mb-8 text-center">
        <div>
          <p className="text-3xl font-bold text-pink-400">{followersCount}</p>
          <p className="text-gray-400">Followers</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-pink-400">{followingCount}</p>
          <p className="text-gray-400">Following</p>
        </div>
      </div>

      {/* ========================= */}
      {/* SECTION: About / Bio */}
      {/* ========================= */}
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-xl max-w-xl w-full mb-8">
        <h2 className="text-2xl font-semibold text-pink-400 mb-4">About</h2>
        <p className="text-gray-300 text-lg">{bio}</p>
      </div>

      {/* ========================= */}
      {/* SECTION: Logout button */}
      {/* ========================= */}
      <button
        onClick={handleLogout}
        className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded transition duration-300"
      >
        Logout
      </button>
    </main>
  );
}

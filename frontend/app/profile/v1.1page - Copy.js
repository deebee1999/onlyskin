//--------------working code before 7-27-25 update----------------

// FILE: /frontend/app/profile/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => {
        console.error(err);
        router.push('/login');
      });
  }, [router]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return alert('Please select a file first.');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      setUploading(true);
      const res = await fetch('http://localhost:5000/api/uploads/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      alert('Avatar uploaded!');
      location.reload();
    } catch (err) {
      console.error('Upload error:', err.message);
      alert('Avatar upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <p className="text-white p-6">Loading profile...</p>;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Your Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg max-w-xl mx-auto space-y-4">
        <div>
          <strong>Email:</strong> {user.email}
        </div>
        <div>
          <strong>Username:</strong> {user.username}
        </div>
        <div>
          <strong>Bio:</strong> {user.bio || 'No bio yet'}
        </div>
        <div>
          <strong>Avatar:</strong>{' '}
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-full mt-2" />
          ) : (
            'No avatar'
          )}
        </div>

        {/* Avatar Upload Section */}
        <div className="pt-4">
          <label className="block mb-2 font-semibold">Upload Avatar:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="text-white"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-20 h-20 rounded-full mt-4 border-2 border-pink-500"
            />
          )}
          <button
            onClick={handleAvatarUpload}
            disabled={uploading}
            className="mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded text-white"
          >
            {uploading ? 'Uploading...' : 'Save Avatar'}
          </button>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => router.push('/profile/edit')}
          className="mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
        >
          Edit Profile
        </button>
      </div>
    </main>
  );
}

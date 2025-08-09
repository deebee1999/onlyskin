'use client';

import NewPostForm from '../NewPostForm';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostPage() {
  const { user } = useAuth();

  console.log('USER:', user); 

  if (!user) return <p className="p-4">Loading...</p>;

  if (user.role !== 'creator') {
    return <p className="text-red-500 p-4">Access denied: Only creators can post.</p>;
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 min-h-screen bg-black text-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Create New Post</h1>
      <NewPostForm />
    </main>
  );
}

'use client';

import { useState } from 'react';

export default function NewPostForm({ onPostCreated }) {

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    try {
      // Step 1: Upload media files (if any)
      let media_urls = [];

      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append('media', file));

        const uploadRes = await fetch('http://localhost:5000/api/uploads/media', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) throw new Error(uploadData.error || 'Media upload failed');

        // Assume response contains array of { url, type }
        media_urls = uploadData.success ? uploadData.urls : [];
      }

      // Step 2: Create the post with media URLs
      const postRes = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          price: parseFloat(price) || 0,
          is_pinned: false,
          media_urls,
        }),
      });

      const postData = await postRes.json();
      if (!postRes.ok) throw new Error(postData.error || 'Failed to create post');

         setMessage('✅ Post created successfully!');
       if (onPostCreated) onPostCreated(postData);
      setTitle('');
         setContent('');
         setPrice('');
         setMediaFiles([]);
         setPreviewUrls([]);

    } catch (err) {
      console.error('Post creation error:', err);
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 border border-zinc-700 rounded bg-zinc-900">
      <h2 className="text-lg font-bold mb-4">Create New Post</h2>

      {message && <p className="text-green-500 mb-2">{message}</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-2 p-2 rounded bg-zinc-800 border border-zinc-600 text-white"
        required
      />

      <textarea
        placeholder="Write something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full mb-2 p-2 rounded bg-zinc-800 border border-zinc-600 text-white"
      />

      <input
        type="number"
        placeholder="Price (optional)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full mb-2 p-2 rounded bg-zinc-800 border border-zinc-600 text-white"
        min="0"
      />

      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="mb-4 text-white"
      />

      {/* Preview media */}
      <div className="flex flex-wrap gap-4 mb-4">
      {mediaFiles.map((file, i) => {
  const previewUrl = previewUrls[i];
  const isVideo = file.type.startsWith('video');

  return isVideo ? (
    <video key={i} src={previewUrl} controls className="w-32 rounded border" />
  ) : (
    <img key={i} src={previewUrl} alt={file.name} className="w-32 rounded border" />
  );
})}

      </div>

      <button
        type="submit"
        className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded"
      >
        Submit Post
      </button>
    </form>
  );
}

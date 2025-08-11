'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LiveStreamPage() {
  const router = useRouter();
  const { username } = useParams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // Fetch live stream info
  // =========================
  useEffect(() => {
    fetch(`/api/streams/${username}`)
      .then(r => r.json())
      .then(data => {
        if (!data.is_live) {
          alert('This creator is not live right now.');
          router.push(`/creator/${username}`);
        } else {
          setStream(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username, router]);

  if (loading) return <p className="text-white p-8">Loading stream…</p>;
  if (!stream) return null;

  // your streaming provider’s HLS URL pattern:
  const hlsUrl = `https://streaming.example.com/hls/${stream.stream_key}.m3u8`;

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-4">{stream.title}</h1>

      {/* Video Player */}
      <video
        src={hlsUrl}
        controls
        autoPlay
        className="w-full max-w-3xl rounded-lg shadow-lg mb-6"
      />

      {/* Tip During Stream */}
      <form className="flex space-x-2">
        <input
          type="text"
          placeholder="Tip amount ($)"
          className="bg-gray-800 px-3 py-2 rounded text-white"
        />
        <button className="bg-green-600 hover:opacity-90 text-white px-4 py-2 rounded">
          Tip Now
        </button>
      </form>
    </main>
  );
}

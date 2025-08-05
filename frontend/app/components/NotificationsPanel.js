// frontend/app/components/NotificationsPanel.jsx
'use client';

import { useEffect, useState } from 'react';

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // SECTION: Fetch notifications
  // =========================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/notifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Notification fetch error:', err);
        setLoading(false);
      });
  }, []);

  // =========================
  // SECTION: UI
  // =========================
  if (loading) return <div>Loading notifications...</div>;
  if (notifications.length === 0)
    return <div className="text-gray-400">No notifications</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg max-w-md mx-auto mt-6 text-white">
      <h2 className="text-xl font-bold mb-4 text-pink-400">Notifications</h2>
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`p-3 rounded ${
              n.is_read ? 'bg-gray-700' : 'bg-pink-700'
            }`}
          >
            {n.message}
            <div className="text-xs text-gray-300 mt-1">
              {new Date(n.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

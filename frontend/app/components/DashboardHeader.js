'use client';

/* =========================================================
   DashboardHeader (Shared for Creator & Subscriber)
   - Pixel-aligned header, actions, counters
   - Notification dropdown
   - Uses props only (no fetching here)
   ========================================================= */

import Link from 'next/link';

/* ---------- Helpers ---------- */
function formatNotificationText(n, role) {
  const postId = n?.metadata?.post_id;
  if (role === 'creator') {
    if (n.type === 'follow') return '🎉 Someone followed you!';
    if (n.type === 'unlock') return `💰 Someone unlocked post #${postId}`;
  } else {
    if (n.type === 'follow') return '🎉 You followed someone!';
    if (n.type === 'unlock') return `💰 You unlocked post #${postId}`;
  }
  return 'ℹ️ Activity update';
}

function NotificationList({ items, role }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400">No notifications yet</p>;
  }

  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {items.map((n) => (
        <li key={n.id} className="border-b border-zinc-700 pb-2">
          <p className="text-sm">{formatNotificationText(n, role)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(n.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Component ---------- */
export default function DashboardHeader({
  role,                         // 'creator' | 'subscriber'
  userUsername,                 // string
  followers,                    // number
  following,                    // number
  unreadCount,                  // number
  notifications,                // array
  showNotifications,            // boolean
  onToggleNotifications,        // () => void
}) {
  return (
    <div className="relative">
      {/* Title + Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Your Dashboard</h1>

        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={onToggleNotifications}
            className="relative bg-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-600 text-sm sm:text-base"
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-600 text-xs rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          {role === 'creator' ? (
            <Link
              href="/dashboard/create"
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded text-sm sm:text-base"
            >
              + New Post
            </Link>
          ) : (
            <>
              <Link
                href="/purchases"
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded text-sm sm:text-base"
              >
                🛒 View Purchases
              </Link>
              <button
                type="button"
                className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded text-sm sm:text-base cursor-not-allowed opacity-80"
                title="Coming soon"
                disabled
              >
                ✉️ Messages
              </button>
              <button
                type="button"
                className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded text-sm sm:text-base cursor-not-allowed opacity-80"
                title="Coming soon"
                disabled
              >
                💳 Add Payment Method
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-20 bg-zinc-800 w-full sm:w-80 p-4 rounded shadow-lg z-50">
          <h3 className="text-lg font-bold mb-2">Notifications</h3>
          <NotificationList items={notifications} role={role} />
        </div>
      )}

      {/* Counters */}
      <div className="text-gray-300">
        👥{' '}
        <Link href={`/followers/${userUsername}`} className="text-pink-400 hover:underline">
          Followers: <strong>{followers}</strong>
        </Link>
        <br />
        ➡️{' '}
        <Link href={`/following/${userUsername}`} className="text-pink-400 hover:underline">
          Following: <strong>{following}</strong>
        </Link>
      </div>
    </div>
  );
}

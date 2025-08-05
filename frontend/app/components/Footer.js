'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm p-4 text-center mt-10">
      <p>
        <a href="/legal/terms" className="hover:underline">Terms of Service</a> •{' '}
        <a href="/legal/privacy" className="hover:underline">Privacy Policy</a> •{' '}
        <a href="/legal/dmca" className="hover:underline">DMCA</a>
      </p>
    </footer>
  );
}

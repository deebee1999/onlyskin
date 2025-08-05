// /app/legal/dmca.js
'use client';

export default function DMCA() {
  return (
    <main className="p-6 sm:p-8 max-w-3xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">DMCA Policy</h1>

      <p className="mb-6 text-gray-300">
        OnlySkins respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act (DMCA).
        If you believe your copyrighted work has been used on our site without permission, please follow the process below.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Takedown Requests</h2>
        <p className="text-gray-400">
          To file a DMCA takedown notice, please send a written request to our designated agent that includes:
        </p>
        <ul className="list-disc list-inside text-gray-400 ml-4 mt-2 space-y-1">
          <li>Your name and contact information</li>
          <li>A description of the copyrighted work</li>
          <li>The exact URL of the allegedly infringing material</li>
          <li>A statement that you have a good faith belief the use is unauthorized</li>
          <li>A statement made under penalty of perjury that the information is accurate</li>
          <li>Your electronic or physical signature</li>
        </ul>
        <p className="text-gray-400 mt-4">
          Email your request to: <a href="mailto:dmca@onlyskins.com" className="text-pink-400 hover:underline">dmca@onlyskins.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Counter-Notifications</h2>
        <p className="text-gray-400">
          If you believe your content was removed by mistake, you may submit a counter-notification.
          It must include sufficient information to establish your rights to the content.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Repeat Infringers</h2>
        <p className="text-gray-400">
          Users who repeatedly upload infringing content may have their accounts terminated.
          We reserve the right to remove content at our discretion to comply with the law.
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-10">
        Last updated: July 25, 2025
      </p>
    </main>
  );
}

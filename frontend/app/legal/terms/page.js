// /app/legal/terms.js
'use client';

export default function TermsOfService() {
  return (
    <main className="p-6 sm:p-8 max-w-3xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="mb-6 text-gray-300">
        Welcome to OnlySkins. By accessing or using our platform, you agree to be bound by the following Terms of Service. 
        Please read them carefully before using the site.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Eligibility & Account Responsibility</h2>
        <p className="text-gray-400">
          You must be at least 18 years old to use OnlySkins. You are solely responsible for maintaining the confidentiality of your account and password 
          and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. User Content & Ownership</h2>
        <p className="text-gray-400">
          Creators retain full ownership of any content they upload. By submitting content to OnlySkins, you grant us a non-exclusive, worldwide, royalty-free 
          license to host, distribute, and display your content to users who are authorized to access it through purchase or subscription.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Prohibited Conduct</h2>
        <p className="text-gray-400">
          You agree not to use the platform to upload, distribute, or promote any unlawful, abusive, harassing, pornographic, defamatory, or infringing content.
          OnlySkins reserves the right to remove content or terminate accounts that violate this policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Payments & Refunds</h2>
        <p className="text-gray-400">
          All payments are final. OnlySkins does not offer refunds for content once it has been purchased, unless required by law. If you experience issues 
          with content delivery, please contact support for assistance.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Account Termination</h2>
        <p className="text-gray-400">
          We may suspend or terminate your account at our sole discretion, without prior notice, if you violate these Terms, abuse the platform, or pose a risk to other users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Modifications</h2>
        <p className="text-gray-400">
          OnlySkins reserves the right to modify these Terms at any time. Continued use of the platform after such changes constitutes acceptance of the revised terms.
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-10">
        Last updated: July 25, 2025
      </p>
    </main>
  );
}

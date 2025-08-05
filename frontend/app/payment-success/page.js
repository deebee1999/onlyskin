'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main className="text-center py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">✅ Payment Successful</h1>
      <p className="text-lg">Redirecting to your dashboard...</p>
    </main>
  );
}

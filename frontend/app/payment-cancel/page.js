'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentCancel() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main className="text-center py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">❌ Payment Canceled</h1>
      <p className="text-lg">Returning to dashboard...</p>
    </main>
  );
}

'use client';
import { useEffect } from 'react';

export default function StripeTestPage() {
  const handleCheckout = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    price: 1000, // match backend key
    productName: 'Test $10 Purchase'
  })
});
 

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      window.location.href = data.url; // Redirect to Stripe checkout
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    }
  };

  return (
    <main className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Test Stripe Payment</h1>
      <button
        onClick={handleCheckout}
        className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white"
      >
        Pay $10.00
      </button>
    </main>
  );
}

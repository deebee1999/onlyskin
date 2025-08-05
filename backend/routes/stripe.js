const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');
const bodyParser = require('body-parser');

// Stripe webhook secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ✅ Route: POST /api/stripe/onboard
router.post('/onboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: req.user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    await pool.query(
      'UPDATE users SET stripe_account_id = $1 WHERE id = $2',
      [account.id, userId]
    );

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/dashboard',
      return_url: 'http://localhost:3000/dashboard',
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('Stripe onboard error:', err);
    res.status(500).json({ error: 'Stripe onboarding failed' });
  }
});

// ✅ Route: POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { price, productName, postId } = req.body;
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName || 'OnlySkins Content',
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/payment-success',
      cancel_url: 'http://localhost:3000/payment-cancel',
      metadata: {
        userId: userId.toString(),
        postId: postId ? postId.toString() : '',
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// ✅ Route: POST /api/stripe/webhook (raw body)
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, postId } = session.metadata;
    console.log('📦 Webhook received metadata:', session.metadata);

    if (!userId || !postId) {
      console.error('Missing metadata: cannot insert purchase');
      return res.status(400).send('Missing metadata');
    }

    try {
     await pool.query(
  `INSERT INTO purchases (buyer_id, post_id, amount_cents, purchase_date, expires_at)
   VALUES ($1, $2, $3, NOW(), NOW() + interval '7 days')`,
  [userId, postId, session.amount_total]  // session.amount_total comes from Stripe
);

      console.log(`✅ Purchase recorded: user ${userId}, post ${postId}`);
    } catch (err) {
      console.error('Error saving purchase:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;

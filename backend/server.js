
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
app.set('db', pool);

// ✅ Middleware
app.use(cors());
// Stripe requires raw body for webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next(); // skip body parsing
  } else {
    express.json()(req, res, next);
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('🛠 Serving static files from:', path.join(__dirname, 'uploads'));


// ✅ Route Imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const creatorRoutes = require('./routes/creator');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');
const tipsRoutes = require('./routes/tips');
const ppvRoutes = require('./routes/ppv');
const profileRoutes = require('./routes/profile');
const messagesRoutes = require('./routes/messages');
const uploadsRoutes = require('./routes/uploads');
const homeRoutes = require('./routes/home');
const purchasesRoutes = require('./routes/purchases');
const stripeRoutes = require('./routes/stripe');




// ✅ Route Usage

app.use('/api/stripe', stripeRoutes);
app.use('/api/follow', require('./routes/follow'));
app.use('/api/user', userRoutes);  
app.use('/api/purchases', purchasesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/ppv', ppvRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/home', homeRoutes);

// ✅ Root Route
app.get('/', (req, res) => {
  res.send('OnlySkins backend is running.');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});







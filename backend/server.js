const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());

// ─── Stripe webhook needs raw body — register BEFORE express.json() ───────────
app.use(
  '/api/payment/stripe/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/paymentRoutes').webhookRouter
);

// ─── JSON body parser for all other routes ────────────────────────────────────
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/movies',          require('./routes/movieRoutes'));
app.use('/api/theatres',        require('./routes/theatreRoutes'));
app.use('/api/shows',           require('./routes/showRoutes'));
app.use('/api/bookings',        require('./routes/bookingRoutes'));
app.use('/api/dashboard',       require('./routes/dashboardRoutes'));
app.use('/api/payment',         require('./routes/paymentRoutes'));
app.use('/api/forgot-password', require('./routes/forgotPasswordRoutes'));
app.use('/api/cancellation',    require('./routes/cancellationRoutes'));
// ✅ NEW: Coupon routes
app.use('/api/coupons',         require('./routes/couponRoutes'));

app.get('/', (req, res) => res.send('BookMyShow API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
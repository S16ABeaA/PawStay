import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { submitProperty } from './routes/submit-property';
import { authMiddleware } from './middleware/authMiddleware';
import searchRoutes from "./routes/searchRoute";
import adminPropertyRoute from "./routes/adminPropertyRoute";
import amenitiesRoutes from "./routes/amenitiesRoute";
import locationRoutes from "./routes/locationRoute";
import authRoute from './routes/authRoute';
import petRoutes from './routes/petRoute';
import bookingRoutes from './routes/bookingRoute';
import favoritesRoutes from './routes/favoritesRoute';
import reviewsRoutes from './routes/reviewsRoute';
import settingsRoutes from './routes/settingsRoute';
import notificationRoutes from './routes/notificationRoute';
import supportRoutes from './routes/supportRoute';
import analyticsRoutes from './routes/analyticsRoute';
import dashboardRoute from './routes/dashboardRoute';
import settlementRoutes from './routes/settlementRoute';
import aiRoutes from './routes/aiRoute';
import { dispatchSettlementRemindersJob } from './controllers/settlementController';
import {
  dispatchBookingLifecycleNotificationsJob,
  dispatchWeeklyReportNotificationsJob,
} from './services/notificationJobs';
import { dispatchPetCareNotificationsJob } from './services/petCareNotificationJobs';
import { ensureStorageBucket } from './utils/storageMedia';
 
dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const defaultDevOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const isLocalDevOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS
  : (process.env.NODE_ENV !== 'production' ? defaultDevOrigins.join(',') : ''))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin))
    ) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Prevent browsers from caching API responses so property-switching always gets fresh data
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/admin/properties', adminPropertyRoute);
app.use('/api/admin/dashboard', dashboardRoute);
app.post('/api/submit-property', apiLimiter, authMiddleware, submitProperty);
app.use("/api/properties", searchRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/bookings", bookingRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use("/api/settings", settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/ai', aiRoutes);

// Simple health/root route
app.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'PawStay backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  Promise.all([
    ensureStorageBucket('property-images', false),
    ensureStorageBucket('legal-documents', false),
    ensureStorageBucket('pet-photos', false),
    ensureStorageBucket('booking-documents', false),
    ensureStorageBucket('booking-payments', false),
  ]).catch((err) => {
    console.warn('[storage] bucket bootstrap failed:', err?.message || err);
  });

  // Settlement reminders are time-based; run once at startup and then every 6 hours.
  dispatchSettlementRemindersJob()
    .then((result) => console.log('[settlement-reminders] startup run:', result))
    .catch((err) => console.warn('[settlement-reminders] startup run failed:', err?.message || err));

  setInterval(() => {
    dispatchSettlementRemindersJob()
      .then((result) => console.log('[settlement-reminders] interval run:', result))
      .catch((err) => console.warn('[settlement-reminders] interval run failed:', err?.message || err));
  }, 6 * 60 * 60 * 1000);

  dispatchBookingLifecycleNotificationsJob()
    .then((result) => console.log('[booking-notifications] startup run:', result))
    .catch((err) => console.warn('[booking-notifications] startup run failed:', err?.message || err));

  setInterval(() => {
    dispatchBookingLifecycleNotificationsJob()
      .then((result) => console.log('[booking-notifications] interval run:', result))
      .catch((err) => console.warn('[booking-notifications] interval run failed:', err?.message || err));
  }, 6 * 60 * 60 * 1000);

  dispatchWeeklyReportNotificationsJob()
    .then((result) => console.log('[weekly-report-notifications] startup run:', result))
    .catch((err) => console.warn('[weekly-report-notifications] startup run failed:', err?.message || err));

  setInterval(() => {
    dispatchWeeklyReportNotificationsJob()
      .then((result) => console.log('[weekly-report-notifications] interval run:', result))
      .catch((err) => console.warn('[weekly-report-notifications] interval run failed:', err?.message || err));
  }, 24 * 60 * 60 * 1000);

    // dispatchPetCareNotificationsJob()
  //   .then((result) => console.log('[pet-care-notifications] startup run:', result))
  //   .catch((err) => console.warn('[pet-care-notifications] startup run failed:', err?.message || err));

  // setInterval(() => {
  //   dispatchPetCareNotificationsJob()
  //     .then((result) => console.log('[pet-care-notifications] interval run:', result))
  //     .catch((err) => console.warn('[pet-care-notifications] interval run failed:', err?.message || err));
  // }, 24 * 60 * 60 * 1000);
});

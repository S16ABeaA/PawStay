import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
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
import paymentRoutes from './routes/paymentRoute';
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
import { withJobLock } from './utils/jobLock';
import { authGuardLimiter, bulkOpsLimiter } from './middleware/rateLimiters';
import { inputFirewall } from './middleware/inputValidation';
 
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

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(inputFirewall);

// Prevent browsers from caching API responses so property-switching always gets fresh data
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/admin/properties', authGuardLimiter, adminPropertyRoute);
app.use('/api/admin/dashboard', authGuardLimiter, dashboardRoute);
app.post('/api/submit-property', authMiddleware, bulkOpsLimiter, submitProperty);
app.use("/api/properties", searchRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/pets", authGuardLimiter, petRoutes);
app.use("/api/bookings", bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use("/api/settings", authGuardLimiter, settingsRoutes);
app.use('/api/platform-settings', require('./routes/platformSettingsRoute').default);
app.use('/api/notifications', authGuardLimiter, notificationRoutes);
app.use('/api/support', authGuardLimiter, supportRoutes);
app.use('/api/analytics', authGuardLimiter, analyticsRoutes);
app.use('/api/settlements', authGuardLimiter, settlementRoutes);
app.use('/api/ai', authGuardLimiter, aiRoutes);

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

  // Interval durations (ms) and their stale-lock thresholds (seconds).
  // Stale thresholds are set to 92 % of the interval so a lock held by a
  // crashed instance is always cleaned up before the next scheduled run.
  const SIX_HOURS_MS   = 6  * 60 * 60 * 1000;
  const ONE_DAY_MS     = 24 * 60 * 60 * 1000;
  const toStaleSecs    = (intervalMs: number) => Math.floor(intervalMs * 0.92 / 1000);

  const SETTLEMENT_STALE_SECS    = toStaleSecs(SIX_HOURS_MS);
  const BOOKING_NOTIF_STALE_SECS = toStaleSecs(SIX_HOURS_MS);
  const WEEKLY_REPORT_STALE_SECS = toStaleSecs(ONE_DAY_MS);

  // Settlement reminders: run once at startup, then every 6 hours.
  // withJobLock ensures only one instance executes the job at a time.
  withJobLock('settlement-reminders', SETTLEMENT_STALE_SECS, dispatchSettlementRemindersJob)
    .then((result) => result !== null && console.log('[settlement-reminders] startup run:', result))
    .catch((err) => console.warn('[settlement-reminders] startup run failed:', err?.message || err));

  setInterval(() => {
    withJobLock('settlement-reminders', SETTLEMENT_STALE_SECS, dispatchSettlementRemindersJob)
      .then((result) => result !== null && console.log('[settlement-reminders] interval run:', result))
      .catch((err) => console.warn('[settlement-reminders] interval run failed:', err?.message || err));
  }, SIX_HOURS_MS);

  // Booking lifecycle notifications: run once at startup, then every 6 hours.
  withJobLock('booking-lifecycle-notifications', BOOKING_NOTIF_STALE_SECS, dispatchBookingLifecycleNotificationsJob)
    .then((result) => result !== null && console.log('[booking-notifications] startup run:', result))
    .catch((err) => console.warn('[booking-notifications] startup run failed:', err?.message || err));

  setInterval(() => {
    withJobLock('booking-lifecycle-notifications', BOOKING_NOTIF_STALE_SECS, dispatchBookingLifecycleNotificationsJob)
      .then((result) => result !== null && console.log('[booking-notifications] interval run:', result))
      .catch((err) => console.warn('[booking-notifications] interval run failed:', err?.message || err));
  }, SIX_HOURS_MS);

  // Weekly report notifications: run once at startup, then every 24 hours.
  withJobLock('weekly-report-notifications', WEEKLY_REPORT_STALE_SECS, dispatchWeeklyReportNotificationsJob)
    .then((result) => result !== null && console.log('[weekly-report-notifications] startup run:', result))
    .catch((err) => console.warn('[weekly-report-notifications] startup run failed:', err?.message || err));

  setInterval(() => {
    withJobLock('weekly-report-notifications', WEEKLY_REPORT_STALE_SECS, dispatchWeeklyReportNotificationsJob)
      .then((result) => result !== null && console.log('[weekly-report-notifications] interval run:', result))
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

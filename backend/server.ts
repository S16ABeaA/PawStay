import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { submitProperty } from './routes/submit-property';
import { authMiddleware } from './middleware/authMiddleware';
import searchRoutes from "./routes/searchRoute";
import amenitiesRoutes from "./routes/amenitiesRoute";
import locationRoutes from "./routes/locationRoute";
import authRoute from './routes/authRoute';
import petRoutes from './routes/petRoute';
import bookingRoutes from './routes/bookingRoute';
import favoritesRoutes from './routes/favoritesRoute';
import notificationRoutes from './routes/notificationRoute';
 
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

// Routes
app.use('/api/auth', authRoute);
app.post('/api/submit-property', apiLimiter, authMiddleware, submitProperty);
app.use("/api/properties", searchRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/bookings", bookingRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationRoutes);

// Simple health/root route
app.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'PawStay backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

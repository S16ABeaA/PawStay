import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { submitProperty } from './routes/submit-property';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use(express.json({ limit: '1mb' }));

// Routes
app.post('/api/submit-property', apiLimiter, submitProperty);

// Simple health/root route
app.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'PawStay backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
import express from "express";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import authRoute from "./routes/authRoute";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// app.use(cors({
//   origin: "http://localhost:8080", // your frontend
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
// }));

// app.use(cors({
//   origin: "http://localhost:8080",
//   credentials: true
// }));

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoute);

app.get("/", (req, res) => res.send("API is running"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
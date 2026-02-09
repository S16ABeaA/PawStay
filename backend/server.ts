import express from "express";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import authRoute from "./routes/authRoute";
import cors from "cors";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 5000;

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

app.use(cors({
  origin: "http://localhost:8080",
  // methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoute);

app.get("/", (req, res) => res.send("API is running"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
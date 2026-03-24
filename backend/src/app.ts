import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";

const app: Express = express();

// Trust Render's proxy (fixes X-Forwarded-For rate limit warning)
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// Gzip compression
app.use(compression());

// Allow requests from the frontend (set FRONTEND_URL in production)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow exact match, or any Vercel preview deployment for this project
    const isAllowed =
      allowedOrigins.some(o => origin === o) ||
      /^https:\/\/layer-frontend-[a-z0-9-]+-vpatanvadiya2022[a-z0-9-]*\.vercel\.app$/.test(origin) ||
      /^https:\/\/medialayer[a-z0-9-]*\.vercel\.app$/.test(origin);
    if (isAllowed) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// General rate limit — 200 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
}));

// Stricter limit on auth routes — 50 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});
app.use("/api/auth", authLimiter);

app.use("/api", router);

export default app;

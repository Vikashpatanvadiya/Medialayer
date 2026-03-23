import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";

const app: Express = express();

// Allow requests from the frontend (set FRONTEND_URL in production)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadDir = path.join(process.cwd(), "uploads");
app.use("/api/stream", express.static(uploadDir));

app.use("/api", router);

export default app;

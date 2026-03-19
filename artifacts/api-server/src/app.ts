import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadDir = path.join(process.cwd(), "uploads");
app.use("/api/stream", express.static(uploadDir));

app.use("/api", router);

export default app;

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import authGoogleRouter from "./auth-google.js";
import usersRouter from "./users.js";
import videosRouter from "./videos.js";
import notificationsRouter from "./notifications.js";
import youtubeRouter from "./youtube.js";
import uploadRouter from "./upload.js";
import logsRouter from "./logs.js";
import streamRouter from "./stream.js";
import feedbackRouter from "./feedback.js";
import paymentsRouter from "./payments.js";
import nftRouter from "./nft.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/auth", authGoogleRouter);
router.use("/users", usersRouter);
router.use("/videos", videosRouter);
router.use("/notifications", notificationsRouter);
router.use("/youtube", youtubeRouter);
router.use("/upload", uploadRouter);
router.use("/logs", logsRouter);
router.use("/stream", streamRouter);
router.use(feedbackRouter);
router.use("/payments", paymentsRouter);
router.use("/nft", nftRouter);

export default router;

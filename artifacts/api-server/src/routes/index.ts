import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import videosRouter from "./videos.js";
import notificationsRouter from "./notifications.js";
import youtubeRouter from "./youtube.js";
import uploadRouter from "./upload.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/videos", videosRouter);
router.use("/notifications", notificationsRouter);
router.use("/youtube", youtubeRouter);
router.use("/upload", uploadRouter);

export default router;

import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.post("/google", controller.googleLogin);
router.post("/logout", requireAuth, controller.logout);
router.get("/me", requireAuth, controller.me);

export default router;

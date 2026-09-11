import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

// Admin-only: this module decides who may read, edit and delete.
router.use(requireAuth, requireRole("admin"));

router.get("/", controller.list);
router.patch("/:id", controller.update);

export default router;

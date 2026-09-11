import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

// Admin-only: the audit trail itself is sensitive (it reveals who
// looked at what), so only admins can browse it.
router.use(requireAuth, requireRole("admin"));

// Declared before "/" so the static segment is not swallowed by it.
router.get("/summary", controller.summary);
router.get("/", controller.list);

export default router;

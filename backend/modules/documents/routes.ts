import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/upload-url", requireRole("admin", "editor"), controller.requestUpload);
router.post("/", requireRole("admin", "editor"), controller.confirmUpload);
router.get("/:id/download", controller.download);
router.delete("/:id", requireRole("admin", "editor"), controller.remove);

export default router;

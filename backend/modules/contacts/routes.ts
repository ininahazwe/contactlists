import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.get("/import/template", controller.downloadImportTemplate);
router.post(
  "/import",
  requireRole("admin", "editor"),
  controller.importUpload,
  controller.importContacts
);
router.get("/:id", controller.getOne);
router.get("/:id/timeline", controller.timeline);
router.post("/", requireRole("admin", "editor"), controller.create);
router.patch("/:id", requireRole("admin", "editor"), controller.update);
router.delete("/:id", requireRole("admin"), controller.remove);

export default router;

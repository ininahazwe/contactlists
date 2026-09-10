import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.get("/:id/events", controller.events);
router.get("/:id/contacts", controller.contacts);
router.post("/", requireRole("admin", "editor"), controller.create);
router.patch("/:id", requireRole("admin", "editor"), controller.update);
router.delete("/:id", requireRole("admin"), controller.remove);

export default router;

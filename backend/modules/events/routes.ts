import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.get("/years", controller.years);
router.get("/:id", controller.getOne);
router.post("/", requireRole("admin", "editor"), controller.create);
router.patch("/:id", requireRole("admin", "editor"), controller.update);
router.delete("/:id", requireRole("admin"), controller.remove);

router.get("/:id/contacts", controller.contacts);
router.post("/:id/contacts", requireRole("admin", "editor"), controller.addContact);
router.delete("/:id/contacts/:contactId", requireRole("admin", "editor"), controller.removeContact);

router.post("/:id/organizations", requireRole("admin", "editor"), controller.addOrganization);
router.delete(
  "/:id/organizations/:organizationId",
  requireRole("admin", "editor"),
  controller.removeOrganization
);

export default router;

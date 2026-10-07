import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

// Même périmètre que /api/staff : documents institutionnels et adhésions
// sont des données internes -- lecture admin + editor, écriture admin.
router.use(requireRole("admin", "editor"));

router.get("/dashboard", controller.dashboard);

router.get("/categories", controller.listCategories);
router.post("/categories", requireRole("admin"), controller.createCategory);

router.get("/documents", controller.listDocuments);
router.post("/documents", requireRole("admin"), controller.createDocument);
router.get("/documents/:id", controller.getDocument);
router.patch("/documents/:id", requireRole("admin"), controller.updateDocument);
router.delete("/documents/:id", requireRole("admin"), controller.removeDocument);

router.post("/documents/:id/actions", requireRole("admin"), controller.createAction);
router.patch("/documents/:id/actions/:actionId", requireRole("admin"), controller.updateAction);
router.delete("/documents/:id/actions/:actionId", requireRole("admin"), controller.removeAction);

router.get("/memberships", controller.listMemberships);
router.post("/memberships", requireRole("admin"), controller.createMembership);
router.patch("/memberships/:id", requireRole("admin"), controller.updateMembership);
router.delete("/memberships/:id", requireRole("admin"), controller.removeMembership);

export default router;

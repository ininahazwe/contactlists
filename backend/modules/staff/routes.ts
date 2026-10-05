import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

// Contrairement à /api/contacts (ouvert à read_only), tout ce module est
// réservé à admin/editor : c'est un répertoire RH interne, pas le
// répertoire externe. Décision prise en lisant le modèle de rôles existant
// (users.role = admin | editor | read_only, pas de rôle "hr" dédié) plutôt
// que d'en ajouter un -- voir la note dans README du module si besoin de
// revenir dessus.
router.use(requireRole("admin", "editor"));

// Job titles management (admin only)
router.get("/meta/job-titles", controller.listJobTitles);
router.post("/meta/job-titles", requireRole("admin"), controller.createJobTitle);
router.get("/meta/job-titles/:id", controller.getJobTitleDetail);
router.patch("/meta/job-titles/:id", requireRole("admin"), controller.updateJobTitle);
router.post("/meta/job-titles/:id/variants", requireRole("admin"), controller.addJobTitleVariant);
router.delete("/meta/job-titles/:variantId/variants", requireRole("admin"), controller.removeJobTitleVariant);

router.get("/", controller.list);
router.get("/facets", controller.facets);
router.post("/import", requireRole("admin"), controller.importUpload, controller.importStaff);
router.get("/meta/job-title-category", controller.getJobTitleCategory);
router.get("/:id", controller.getOne);
router.post("/", requireRole("admin"), controller.create);
router.patch("/:id", requireRole("admin"), controller.update);
router.delete("/:id", requireRole("admin"), controller.remove);

// staff_sensitive : encore plus restreint, admin uniquement dans les deux sens.
router.get("/:id/sensitive", requireRole("admin"), controller.getSensitive);
router.patch("/:id/sensitive", requireRole("admin"), controller.updateSensitive);

// Engagements ajoutés/retirés à la main après l'import initial en masse -- admin uniquement,
// comme le reste des mutations de ce module.
router.post("/:id/engagements", requireRole("admin"), controller.createEngagement);
router.delete("/:id/engagements/:engagementId", requireRole("admin"), controller.removeEngagement);

// staff_welfare : même restriction que staff_sensitive (admin uniquement, lecture comprise).
router.get("/:id/welfare", requireRole("admin"), controller.getWelfare);
router.post("/:id/welfare", requireRole("admin"), controller.createWelfare);
router.delete("/:id/welfare/:welfareId", requireRole("admin"), controller.removeWelfare);

export default router;

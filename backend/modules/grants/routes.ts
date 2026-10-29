import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

// Donnees financieres internes : reserve aux admins, meme perimetre que
// Staff (requireRole("admin") seul sur tout le routeur).
router.use(requireRole("admin"));

router.get("/facets", controller.facets);

router.get("/donors", controller.listDonors);
router.post("/donors", controller.createDonor);
router.get("/donors/:id", controller.getDonor);
router.patch("/donors/:id", controller.updateDonor);
router.delete("/donors/:id", controller.removeDonor);

router.get("/", controller.listGrants);
router.post("/", controller.createGrant);
router.get("/:id", controller.getGrant);
router.patch("/:id", controller.updateGrant);
router.delete("/:id", controller.removeGrant);

export default router;

import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

// Registered before "/" is irrelevant here (distinct paths), but keep the
// static segment first for consistency with the other modules.
router.get("/facets", controller.facets);
router.get("/export", controller.exportXlsx);
router.get("/", controller.search);

export default router;

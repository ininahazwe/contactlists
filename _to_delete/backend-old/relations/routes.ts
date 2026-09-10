import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/contact/:contactId", controller.forContact);
router.delete("/:id", requireRole("admin", "investigator"), controller.remove);

export default router;

import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { requireCaseAccess } from "../../middleware/caseAccess";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", requireRole("admin", "investigator"), controller.create);

router.get("/:caseId", requireCaseAccess(), controller.getOne);
router.patch("/:caseId", requireCaseAccess(), requireRole("admin", "investigator"), controller.update);

router.post("/:caseId/members", requireCaseAccess(), requireRole("admin"), controller.addMember);
router.delete("/:caseId/members/:userId", requireCaseAccess(), requireRole("admin"), controller.removeMember);

router.get("/:caseId/contacts", requireCaseAccess(), controller.listContacts);
router.post(
  "/:caseId/contacts",
  requireCaseAccess(),
  requireRole("admin", "investigator"),
  controller.addContact
);

export default router;

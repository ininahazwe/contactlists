import { Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../utils/AppError";
import { recordAudit, recordRead } from "../../middleware/auditLogger";
import {
  createEngagementSchema,
  createStaffSchema,
  createWelfareSchema,
  listStaffQuerySchema,
  updateStaffSchema,
  updateStaffSensitiveSchema,
} from "./schema";
import * as service from "./service";
import { importStaffFromWorkbook } from "./import";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Multipart middleware for the single "file" field on the import endpoint. */
export const importUpload = upload.single("file");

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listStaffQuerySchema.parse(req.query);
  const { items, total } = await service.listStaff(filters);
  res.json({ items, total, page: filters.page, pageSize: filters.pageSize });
}

export async function facets(_req: Request, res: Response): Promise<void> {
  res.json(await service.getFacets());
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const staff = await service.getStaffById(id);
  const roleHistory = await service.getRoleHistory(id);
  const engagements = await service.getEngagements(id);

  if (req.user) {
    await recordRead({ userId: req.user.id, entityType: "staff", entityId: id, req });
  }

  res.json({ staff, roleHistory, engagements });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createStaffSchema.parse(req.body);
  const staff = await service.createStaff(input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "staff",
    entityId: staff.id,
    after: staff,
    req,
  });

  res.status(201).json({ staff });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const input = updateStaffSchema.parse(req.body);
  const { before, after } = await service.updateStaff(id, input);

  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "staff",
    entityId: id,
    before,
    after,
    req,
  });

  res.json({ staff: after });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const before = await service.deleteStaff(id);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "staff",
    entityId: id,
    before,
    req,
  });

  res.status(204).send();
}

// --- staff_engagements : ajout/suppression à la main, en plus de l'import en masse
// (modules/staff/import.ts). Pas de PATCH pour l'instant -- corriger une ligne se fait en la
// supprimant et en la recréant, plus simple qu'une édition partielle pour ce genre d'historique
// ajouté au fil de l'eau. ---

export async function createEngagement(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const staffId = Number(req.params.id);
  const input = createEngagementSchema.parse(req.body);
  const engagement = await service.createEngagement(staffId, input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "staff_engagement",
    entityId: engagement.id,
    after: engagement,
    req,
  });

  res.status(201).json({ engagement });
}

export async function removeEngagement(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const staffId = Number(req.params.id);
  const engagementId = Number(req.params.engagementId);
  await service.deleteEngagement(staffId, engagementId);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "staff_engagement",
    entityId: engagementId,
    req,
  });

  res.status(204).send();
}

// --- staff_welfare : même logique de confidentialité que staff_sensitive (voir plus bas) --
// jamais de valeurs en clair dans l'audit (nom d'événement / montant peuvent être sensibles,
// ex. "Father's funeral"), seulement la confirmation qu'une ligne a été créée/supprimée. ---

export async function getWelfare(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  await service.getStaffById(id);
  const items = await service.listWelfare(id);

  await recordRead({ userId: req.user.id, entityType: "staff_welfare", entityId: id, req });

  res.json({ items });
}

export async function createWelfare(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const staffId = Number(req.params.id);
  const input = createWelfareSchema.parse(req.body);
  const welfare = await service.createWelfare(staffId, input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "staff_welfare",
    entityId: welfare.id,
    after: { fieldsSet: Object.keys(req.body ?? {}) },
    req,
  });

  res.status(201).json({ welfare });
}

export async function removeWelfare(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const staffId = Number(req.params.id);
  const welfareId = Number(req.params.welfareId);
  await service.deleteWelfare(staffId, welfareId);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "staff_welfare",
    entityId: welfareId,
    req,
  });

  res.status(204).send();
}

// --- staff_sensitive : logué séparément (entityType distinct), pour qu'un
// relevé des accès à ces champs ne se noie pas dans le journal d'audit
// général du staff. ---

export async function getSensitive(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  await service.getStaffById(id); // 404 propre si le staff n'existe pas
  const sensitive = await service.getStaffSensitive(id);

  await recordRead({ userId: req.user.id, entityType: "staff_sensitive", entityId: id, req });

  res.json({ sensitive });
}

export async function updateSensitive(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const input = updateStaffSensitiveSchema.parse(req.body);
  const sensitive = await service.upsertStaffSensitive(id, input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "staff_sensitive",
    entityId: id,
    // Jamais `after: sensitive` en clair dans audit_log -- seuls les noms de
    // champs touchés sont tracés, pas leur contenu (deuils, contact d'urgence).
    after: { fieldsUpdated: Object.keys(req.body ?? {}) },
    req,
  });

  res.json({ sensitive });
}

export async function importStaff(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  if (!req.file) throw new AppError("No file uploaded", 400);

  const summary = await importStaffFromWorkbook(req.file.buffer, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "staff_import",
    entityId: `${Date.now()}`,
    after: summary.counts,
    req,
  });

  res.status(201).json(summary);
}

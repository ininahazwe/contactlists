import { Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../utils/AppError";
import { query } from "../../db/pool";
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


/** Valider que le job_title existe dans job_titles.canonical_title */
async function validateJobTitle(jobTitle: string | undefined): Promise<void> {
  if (!jobTitle) return; // optionnel
  const result = await query<{ id: number }[]>(
    "SELECT id FROM job_titles WHERE canonical_title = ? LIMIT 1",
    [jobTitle]
  );
  if (result.length === 0) {
    throw new AppError(
      `Job title "${jobTitle}" not found. Use a canonical title from the job_titles table.`,
      400
    );
  }
}


// ============================================================
// SEARCH FILTERS & OPTIONS
// ============================================================

export async function getSearchFilters(req: Request, res: Response): Promise<void> {
  const departments = await query<{ department: string }[]>(
    "SELECT DISTINCT department FROM staff WHERE department IS NOT NULL ORDER BY department",
    []
  );

  const severities = await query<{ seniority_level: string }[]>(
    "SELECT DISTINCT seniority_level FROM job_titles WHERE seniority_level IS NOT NULL ORDER BY CASE WHEN seniority_level = 'Intern' THEN 1 WHEN seniority_level = 'Staff' THEN 2 WHEN seniority_level = 'Mid' THEN 3 WHEN seniority_level = 'Senior' THEN 4 WHEN seniority_level = 'Executive' THEN 5 ELSE 6 END",
    []
  );

  const countries = await query<{ nationality: string }[]>(
    "SELECT DISTINCT nationality FROM staff WHERE nationality IS NOT NULL ORDER BY nationality",
    []
  );

  res.json({
    departments: departments.map(d => d.department),
    severities: severities.map(s => s.seniority_level),
    countries: countries.map(c => c.nationality),
  });
}

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
  await validateJobTitle(input.jobTitle);
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

export async function getJobTitleCategory(req: Request, res: Response): Promise<void> {
  const title = req.query.title as string;
  if (!title) throw new AppError("Missing query param: title", 400);

  const result = await query<{ category: string }[]>(
    "SELECT category FROM job_titles WHERE canonical_title = ?",
    [title]
  );

  if (result.length === 0) {
    res.json({ category: null });
    return;
  }

  res.json({ category: result[0].category });
}


// ============================================================
// JOB TITLES MANAGEMENT
// ============================================================

export async function listJobTitles(req: Request, res: Response): Promise<void> {
  const q = (req.query.q ?? "").toString().trim();
  
  let sql = "SELECT id, canonical_title, category, seniority_level FROM job_titles";
  const params: unknown[] = [];
  
  if (q) {
    sql += " WHERE canonical_title LIKE ?";
    params.push(`%${q}%`);
  }
  
  sql += " ORDER BY category, seniority_level, canonical_title LIMIT 50";
  
  const titles = await query<
    { id: number; canonical_title: string; category: string; seniority_level: string | null }[]
  >(sql, params);
  
  res.json({ titles });
}

export async function getJobTitleDetail(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  
  const titleResult = await query<
    { id: number; canonical_title: string; category: string; seniority_level: string | null; description: string | null }[]
  >("SELECT id, canonical_title, category, seniority_level, description FROM job_titles WHERE id = ?", [id]);
  
  if (titleResult.length === 0) throw AppError.notFound("Job title");
  
  const variants = await query<{ id: number; variant_title: string }[]>(
    "SELECT id, variant_title FROM job_title_variants WHERE job_title_id = ? ORDER BY variant_title",
    [id]
  );
  
  const staffCount = await query<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM staff WHERE job_title = ?",
    [titleResult[0].canonical_title]
  );
  
  res.json({
    title: titleResult[0],
    variants,
    staffCount: staffCount[0]?.count ?? 0,
  });
}

export async function createJobTitle(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  
  const { canonicalTitle, category, seniorityLevel, description } = req.body;
  
  if (!canonicalTitle || !category) {
    throw new AppError("Missing required fields: canonicalTitle, category", 400);
  }
  
  const result = await query<{ insertId: number }>(
    `INSERT INTO job_titles (canonical_title, category, seniority_level, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [canonicalTitle, category, seniorityLevel || null, description || null, req.user.id]
  );
  
  const newTitle = await query<
    { id: number; canonical_title: string; category: string; seniority_level: string | null; description: string | null }[]
  >("SELECT id, canonical_title, category, seniority_level, description FROM job_titles WHERE id = ?", [
    result.insertId,
  ]);
  
  res.status(201).json({ title: newTitle[0] });
}

export async function updateJobTitle(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  
  const id = Number(req.params.id);
  const { canonicalTitle, category, seniorityLevel, description } = req.body;
  
  const fields: string[] = [];
  const params: unknown[] = [];
  
  if (canonicalTitle !== undefined) {
    fields.push("canonical_title = ?");
    params.push(canonicalTitle);
  }
  if (category !== undefined) {
    fields.push("category = ?");
    params.push(category);
  }
  if (seniorityLevel !== undefined) {
    fields.push("seniority_level = ?");
    params.push(seniorityLevel);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    params.push(description);
  }
  
  if (fields.length === 0) {
    throw new AppError("No fields to update", 400);
  }
  
  fields.push("updated_by = ?");
  params.push(req.user.id);
  fields.push("updated_at = CURRENT_TIMESTAMP");
  
  params.push(id);
  
  await query(`UPDATE job_titles SET ${fields.join(", ")} WHERE id = ?`, params);
  
  const updated = await query<
    { id: number; canonical_title: string; category: string; seniority_level: string | null; description: string | null }[]
  >("SELECT id, canonical_title, category, seniority_level, description FROM job_titles WHERE id = ?", [id]);
  
  res.json({ title: updated[0] });
}

export async function addJobTitleVariant(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  
  const jobTitleId = Number(req.params.id);
  const { variantTitle } = req.body;
  
  if (!variantTitle) {
    throw new AppError("Missing required field: variantTitle", 400);
  }
  
  await query(
    `INSERT INTO job_title_variants (job_title_id, variant_title, created_by) VALUES (?, ?, ?)`,
    [jobTitleId, variantTitle, req.user.id]
  );
  
  res.status(201).json({ success: true });
}

export async function removeJobTitleVariant(req: Request, res: Response): Promise<void> {
  const variantId = Number(req.params.variantId);
  
  await query("DELETE FROM job_title_variants WHERE id = ?", [variantId]);
  
  res.json({ success: true });
}


export async function getAuditTrail(req: Request, res: Response): Promise<void> {
  const staffId = Number(req.params.id);
  
  // Vérifier que le staff existe
  await service.getStaffById(staffId);
  
  // Récupérer l'audit log pour ce staff
  const auditLog = await query<
    {
      id: number;
      action: string;
      entityType: string;
      after: string | null;
      changedAt: string;
      userName: string;
    }[]
  >(
    `SELECT 
       audit_log.id,
       audit_log.action,
       audit_log.entity_type as entityType,
       audit_log.after,
       audit_log.created_at as changedAt,
       users.full_name as userName
     FROM audit_log
     JOIN users ON audit_log.user_id = users.id
     WHERE audit_log.entity_type = 'staff' AND audit_log.entity_id = ?
     ORDER BY audit_log.created_at DESC
     LIMIT 100`,
    [staffId]
  );

  res.json({ auditLog });
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

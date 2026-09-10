import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit } from "../../middleware/auditLogger";
import {
  addEventContactSchema,
  addEventOrganizationSchema,
  createEventSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from "./schema";
import * as service from "./service";

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listEventsQuerySchema.parse(req.query);
  const { items, total } = await service.listEvents(filters);
  res.json({ items, total, page: filters.page, pageSize: filters.pageSize });
}

export async function years(_req: Request, res: Response): Promise<void> {
  const items = await service.listYears();
  res.json({ items });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const event = await service.getEventById(id);
  const organizations = await service.listEventOrganizations(id);
  res.json({ event, organizations });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createEventSchema.parse(req.body);
  const event = await service.createEvent(input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "event",
    entityId: event.id,
    after: event,
    req,
  });

  res.status(201).json({ event });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const input = updateEventSchema.parse(req.body);
  const { before, after } = await service.updateEvent(id, input);

  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "event",
    entityId: id,
    before,
    after,
    req,
  });

  res.json({ event: after });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const before = await service.deleteEvent(id);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "event",
    entityId: id,
    before,
    req,
  });

  res.status(204).send();
}

export async function contacts(req: Request, res: Response): Promise<void> {
  const items = await service.listEventContacts(Number(req.params.id));
  res.json({ items });
}

export async function addContact(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const eventId = Number(req.params.id);
  const input = addEventContactSchema.parse(req.body);
  await service.addContact(eventId, input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "event_contact",
    entityId: `${eventId}-${input.contactId}`,
    after: input,
    req,
  });

  res.status(201).json({ success: true });
}

export async function removeContact(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const eventId = Number(req.params.id);
  const contactId = Number(req.params.contactId);
  await service.removeContact(eventId, contactId);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "event_contact",
    entityId: `${eventId}-${contactId}`,
    req,
  });

  res.status(204).send();
}

export async function addOrganization(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const eventId = Number(req.params.id);
  const { organizationId } = addEventOrganizationSchema.parse(req.body);
  await service.addOrganization(eventId, organizationId);
  res.status(201).json({ success: true });
}

export async function removeOrganization(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const eventId = Number(req.params.id);
  const organizationId = Number(req.params.organizationId);
  await service.removeOrganization(eventId, organizationId);
  res.status(204).send();
}

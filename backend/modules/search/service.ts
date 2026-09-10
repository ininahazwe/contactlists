import { query } from "../../db/pool";
import { ContactCategory } from "../contacts/service";
import { SearchQuery } from "./schema";

export interface ContactHit {
  kind: "contact";
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  country: string | null;
  category: ContactCategory;
  role_title: string | null;
  organization_id: number | null;
  organization_name: string | null;
  event_count: number;
}

export interface OrganizationHit {
  kind: "organization";
  id: number;
  name: string;
  type: string | null;
  country: string | null;
  contact_count: number;
  event_count: number;
}

export interface EventHit {
  kind: "event";
  id: number;
  title: string;
  event_type: "event" | "training" | "other";
  start_date: string;
  end_date: string | null;
  location: string | null;
  contact_count: number;
}

export interface SearchResults {
  contacts: { items: ContactHit[]; total: number };
  organizations: { items: OrganizationHit[]; total: number };
  events: { items: EventHit[]; total: number };
}

export interface Facets {
  totals: {
    contacts: number;
    organizations: number;
    events: number;
    participations: number;
  };
  categories: { value: ContactCategory; count: number }[];
  countries: { value: string; count: number }[];
  years: { year: number; eventCount: number }[];
  eventTypes: { value: string; count: number }[];
}

/**
 * Contacts matching the criteria. A `year` filter means "took part in an
 * event that year", so it joins through the participation table; every
 * other filter is a plain column test on the contact itself.
 */
async function searchContacts(
  f: SearchQuery
): Promise<{ items: ContactHit[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  const joins: string[] = ["LEFT JOIN organizations o ON o.id = c.organization_id"];

  if (f.q) {
    conditions.push(
      "(c.first_name LIKE ? OR c.last_name LIKE ? OR CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.email LIKE ? OR c.role_title LIKE ? OR o.name LIKE ?)"
    );
    const like = `%${f.q}%`;
    params.push(like, like, like, like, like, like);
  }
  if (f.category) {
    conditions.push("c.category = ?");
    params.push(f.category);
  }
  if (f.country) {
    conditions.push("c.country = ?");
    params.push(f.country);
  }
  if (f.gender) {
    conditions.push("c.gender = ?");
    params.push(f.gender);
  }
  if (f.organizationId) {
    conditions.push("c.organization_id = ?");
    params.push(f.organizationId);
  }
  if (f.year) {
    joins.push(
      "INNER JOIN event_contacts ecy ON ecy.contact_id = c.id",
      "INNER JOIN events ey ON ey.id = ecy.event_id"
    );
    conditions.push("YEAR(ey.start_date) = ?");
    params.push(f.year);
  }

  const where = conditions.join(" AND ");
  const joinSql = joins.join(" ");
  const orderBy =
    f.sort === "recent" ? "c.created_at DESC, c.id DESC" : "c.last_name, c.first_name";
  const offset = (f.page - 1) * f.pageSize;

  const rows = await query<Array<Omit<ContactHit, "kind">>>(
    `SELECT DISTINCT
       c.id, c.first_name, c.last_name, c.email, c.phone, c.gender, c.country,
       c.category, c.role_title, c.organization_id, o.name AS organization_name,
       (SELECT COUNT(*) FROM event_contacts ec WHERE ec.contact_id = c.id) AS event_count
     FROM contacts c ${joinSql}
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, f.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(DISTINCT c.id) AS total FROM contacts c ${joinSql} WHERE ${where}`,
    params
  );

  return {
    items: rows.map((r) => ({ ...r, kind: "contact" as const })),
    total: countRows[0]?.total ?? 0,
  };
}

async function searchOrganizations(
  f: SearchQuery
): Promise<{ items: OrganizationHit[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  const joins: string[] = [];

  if (f.q) {
    conditions.push("(o.name LIKE ? OR o.type LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`);
  }
  if (f.country) {
    conditions.push("o.country = ?");
    params.push(f.country);
  }
  if (f.organizationId) {
    conditions.push("o.id = ?");
    params.push(f.organizationId);
  }
  if (f.year) {
    joins.push(
      "INNER JOIN event_organizations eoy ON eoy.organization_id = o.id",
      "INNER JOIN events eoye ON eoye.id = eoy.event_id"
    );
    conditions.push("YEAR(eoye.start_date) = ?");
    params.push(f.year);
  }

  const where = conditions.join(" AND ");
  const joinSql = joins.join(" ");
  const orderBy = f.sort === "recent" ? "o.created_at DESC, o.id DESC" : "o.name";
  const offset = (f.page - 1) * f.pageSize;

  const rows = await query<Array<Omit<OrganizationHit, "kind">>>(
    `SELECT DISTINCT
       o.id, o.name, o.type, o.country,
       (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) AS contact_count,
       (SELECT COUNT(*) FROM event_organizations eo WHERE eo.organization_id = o.id) AS event_count
     FROM organizations o ${joinSql}
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, f.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(DISTINCT o.id) AS total FROM organizations o ${joinSql} WHERE ${where}`,
    params
  );

  return {
    items: rows.map((r) => ({ ...r, kind: "organization" as const })),
    total: countRows[0]?.total ?? 0,
  };
}

async function searchEvents(f: SearchQuery): Promise<{ items: EventHit[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  const joins: string[] = [];

  if (f.q) {
    conditions.push("(e.title LIKE ? OR e.location LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`);
  }
  if (f.year) {
    conditions.push("YEAR(e.start_date) = ?");
    params.push(f.year);
  }
  if (f.eventType) {
    conditions.push("e.event_type = ?");
    params.push(f.eventType);
  }
  if (f.organizationId) {
    joins.push("INNER JOIN event_organizations eoe ON eoe.event_id = e.id");
    conditions.push("eoe.organization_id = ?");
    params.push(f.organizationId);
  }

  const where = conditions.join(" AND ");
  const joinSql = joins.join(" ");
  const orderBy = f.sort === "name" ? "e.title" : "e.start_date DESC";
  const offset = (f.page - 1) * f.pageSize;

  const rows = await query<Array<Omit<EventHit, "kind">>>(
    `SELECT DISTINCT
       e.id, e.title, e.event_type, e.start_date, e.end_date, e.location,
       (SELECT COUNT(*) FROM event_contacts ec WHERE ec.event_id = e.id) AS contact_count
     FROM events e ${joinSql}
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, f.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(DISTINCT e.id) AS total FROM events e ${joinSql} WHERE ${where}`,
    params
  );

  return {
    items: rows.map((r) => ({ ...r, kind: "event" as const })),
    total: countRows[0]?.total ?? 0,
  };
}

const EMPTY = { items: [], total: 0 };

export async function search(f: SearchQuery): Promise<SearchResults> {
  const wants = (kind: string) => f.kinds.includes(kind as "contact");

  // A category or gender criterion only describes people, so the other
  // two buckets are deliberately left out rather than returned unfiltered.
  const contactOnlyFilter = Boolean(f.category || f.gender);

  const [contacts, organizations, events] = await Promise.all([
    wants("contact") ? searchContacts(f) : Promise.resolve(EMPTY as never),
    wants("organization") && !contactOnlyFilter
      ? searchOrganizations(f)
      : Promise.resolve(EMPTY as never),
    wants("event") && !contactOnlyFilter ? searchEvents(f) : Promise.resolve(EMPTY as never),
  ]);

  return { contacts, organizations, events };
}

/**
 * Everything the filter bar and the KPI cards need, in one round trip:
 * global totals plus the distinct values actually present in the data
 * (no empty options offered to the user).
 */
export async function getFacets(): Promise<Facets> {
  const [totalsRows, categories, countries, years, eventTypes] = await Promise.all([
    query<
      { contacts: number; organizations: number; events: number; participations: number }[]
    >(
      `SELECT
         (SELECT COUNT(*) FROM contacts) AS contacts,
         (SELECT COUNT(*) FROM organizations) AS organizations,
         (SELECT COUNT(*) FROM events) AS events,
         (SELECT COUNT(*) FROM event_contacts) AS participations`
    ),
    query<{ value: ContactCategory; count: number }[]>(
      "SELECT category AS value, COUNT(*) AS count FROM contacts GROUP BY category ORDER BY count DESC"
    ),
    query<{ value: string; count: number }[]>(
      `SELECT country AS value, COUNT(*) AS count FROM contacts
       WHERE country IS NOT NULL AND country <> ''
       GROUP BY country ORDER BY count DESC`
    ),
    query<{ year: number; eventCount: number }[]>(
      `SELECT YEAR(start_date) AS year, COUNT(*) AS eventCount FROM events
       GROUP BY YEAR(start_date) ORDER BY year DESC`
    ),
    query<{ value: string; count: number }[]>(
      "SELECT event_type AS value, COUNT(*) AS count FROM events GROUP BY event_type ORDER BY count DESC"
    ),
  ]);

  return {
    totals: totalsRows[0] ?? { contacts: 0, organizations: 0, events: 0, participations: 0 },
    categories,
    countries,
    years,
    eventTypes,
  };
}

export type UserRole = "admin" | "editor" | "read_only";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export type ContactStatus = "active" | "archived";
export type ContactGender = "male" | "female" | "other";
export type ContactCategory =
  | "personal"
  | "diplomatic_corps"
  | "media"
  | "civil_society"
  | "state_institution"
  | "academia"
  | "political_party"
  | "stakeholder"
  | "company"
  | "other";

export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, string> = {
  personal: "Personal contact",
  diplomatic_corps: "Diplomatic corps",
  media: "Media",
  civil_society: "Civil society",
  state_institution: "State institution",
  academia: "Academia",
  political_party: "Political party",
  stakeholder: "Stakeholder",
  company: "Company",
  other: "Other",
};

export const GENDER_LABELS: Record<ContactGender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export type EventType = "event" | "training" | "other";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  event: "Event",
  training: "Training",
  other: "Other",
};

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  gender: ContactGender | null;
  country: string | null;
  category: ContactCategory;
  facebook: string | null;
  twitter: string | null;
  organization_id: number | null;
  role_title: string | null;
  status: ContactStatus;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  /** Provided by the contact detail endpoint (server join), absent from lists. */
  organization_name?: string | null;
}

export interface Organization {
  id: number;
  name: string;
  type: string | null;
  country: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: number;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  location: string | null;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** A participation entry, as displayed in a contact's timeline. */
export interface ContactTimelineEntry {
  event_id: number;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  location: string | null;
  role: string | null;
  per_diem: string | null;
  currency: string | null;
}

export interface OrganizationEventEntry {
  event_id: number;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  location: string | null;
}

export interface OrganizationContactEntry {
  contact_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  category: ContactCategory;
  country: string | null;
  event_count: number;
}

export interface EventContactEntry {
  contact_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  per_diem: string | null;
  currency: string | null;
  notes: string | null;
}

export interface EventOrganizationEntry {
  organization_id: number;
  name: string;
  type: string | null;
}

/* ---------- advanced search ---------- */

export type SearchKind = "contact" | "organization" | "event";

export interface ContactHit {
  kind: "contact";
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  gender: ContactGender | null;
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
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  location: string | null;
  contact_count: number;
}

export interface SearchResponse {
  contacts: { items: ContactHit[]; total: number };
  organizations: { items: OrganizationHit[]; total: number };
  events: { items: EventHit[]; total: number };
  page: number;
  pageSize: number;
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
  eventTypes: { value: EventType; count: number }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ---------- staff ---------- */

export type StaffEmploymentType = "full_time" | "part_time" | "contract" | "intern";
export type StaffStatus = "active" | "former";
export type StaffEngagementType = "training" | "meeting" | "conference" | "travel";

export const STAFF_EMPLOYMENT_TYPE_LABELS: Record<StaffEmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  intern: "Intern",
};

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Active",
  former: "Former",
};

export const STAFF_ENGAGEMENT_TYPE_LABELS: Record<StaffEngagementType, string> = {
  training: "Training",
  meeting: "Meeting",
  conference: "Conference",
  travel: "Travel",
};

/** Mirrors the `staff` table as returned by the API -- snake_case, no client-side mapping. */
export interface StaffMember {
  id: number;
  full_name: string;
  job_title: string | null;
  department: string | null;
  employment_type: StaffEmploymentType;
  nationality: string | null;
  year_joined: number | null;
  recruited_as: string | null;
  status: StaffStatus;
  exit_date: string | null;
  cv_updated: number | null;
  employee_info_sheet: number | null;
  total_years_served_raw: string | null;
  training_opportunities_raw: string | null;
  travel_opportunities_raw: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface StaffRoleHistoryEntry {
  year_from: number | null;
  year_to: number | null;
  role_title: string;
  sort_order: number;
}

export interface StaffEngagementEntry {
  id: number;
  engagement_type: StaffEngagementType;
  country: string | null;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  date_text: string | null;
  purpose: string | null;
  role_in_engagement: string | null;
  /** "manual" for an entry added from the UI, the source sheet name for an imported one. */
  source_sheet: string | null;
}

export interface StaffWelfareEntry {
  id: number;
  event_name: string;
  event_date: string | null;
  amount: string | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
}

export interface StaffDetail {
  staff: StaffMember;
  roleHistory: StaffRoleHistoryEntry[];
  engagements: StaffEngagementEntry[];
}

/** staff_sensitive -- always fetched separately, never part of StaffDetail. */
export interface StaffSensitive {
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  welfare_notes: string | null;
  exit_terms_notes: string | null;
  exit_interview_url: string | null;
}

export interface StaffFacets {
  totals: { total: number; active: number; former: number };
  employmentTypes: { value: StaffEmploymentType; count: number }[];
  departments: { value: string; count: number }[];
  countries: { value: string; count: number }[];
  engagementTypes: { value: StaffEngagementType; count: number }[];
}

/* ---------- bulk import ---------- */

export interface ImportRowResult {
  row: number;
  status: "created" | "existing" | "error";
  contactId?: number;
  message?: string;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  existing: number;
  errors: number;
  results: ImportRowResult[];
}

/* ---------- staff import ---------- */

export interface StaffImportCounts {
  staffCreated: number;
  roleHistoryCreated: number;
  engagementsCreated: number;
  engagementsSkipped: number;
  roleHistoryFlagged: number;
}

export interface StaffFlaggedRoleHistory {
  sourceRow: number;
  roleTitle: string;
  note: string;
}

export interface StaffImportSummary {
  counts: StaffImportCounts;
  flaggedRoleHistory: StaffFlaggedRoleHistory[];
}

export interface ManagedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  read_only: "Read only",
};

export type AuditAction = "create" | "update" | "delete" | "login" | "read";

export interface AuditEntry {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface AuditSummary {
  total: number;
  activeUsers: number;
  byAction: { action: string; total: number }[];
  topUsers: {
    user_id: number | null;
    user_name: string | null;
    user_email: string | null;
    total: number;
  }[];
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created",
  update: "Edited",
  delete: "Deleted",
  login: "Signed in",
  read: "Opened",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  contact: "contact",
  organization: "organization",
  event: "event",
  document: "document",
  user: "account",
};

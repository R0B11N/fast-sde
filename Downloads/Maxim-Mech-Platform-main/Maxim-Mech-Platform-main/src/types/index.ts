export type UserRole = 'owner' | 'hr' | 'supervisor' | 'labourer'

/* ── Phase 1: Authentication & Session Management ─────────────── */

/** New role hierarchy for Phase 1 auth (viewer → editor → admin → owner) */
export type AuthRole = 'viewer' | 'editor' | 'admin' | 'owner'

/** Decoded JWT payload (mock) */
export interface JWTPayload {
  sub: string
  name: string
  email: string
  role: AuthRole
  iat: number
  exp: number
}

/** Session stored in Redis (mock) */
export interface Session {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: AuthRole
  jwt: string
  jwtPayload: JWTPayload
  issuedAt: string
  expiresAt: string
  ttl: number
  heartbeatLastPing: string
  heartbeatStatus: 'connected' | 'degraded' | 'disconnected'
  status: 'active' | 'expired' | 'revoked'
}

/* ── End Phase 1 types ──────────────────────────────────────────── */

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  active: boolean
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  type: 'info' | 'alert' | 'reminder'
  /** Route to open when the notification is clicked (e.g. /forms/f1, /signing/sr1) */
  linkTo?: string
}

/** Compliance / audit status for H&S forms. HR has final authority for approval and archival. */
export type FormSubmissionStatus = 'draft' | 'pending_site_signatures' | 'submitted' | 'approved' | 'rejected' | 'archived'

export interface FormSubmissionAttachment {
  id: string
  name: string
  type: 'photo' | 'document'
  url?: string
  /** Inline PDF/image data URL for viewing in the app without download. */
  fileDataUrl?: string
  uploadedAt?: string
}

export interface FormSubmissionSigner {
  id: string
  name: string
  role: string
  status: 'pending' | 'signed'
  signedAt?: string
}

export interface FormAuditEvent {
  id: string
  type: 'draft_created' | 'submitted' | 'review_started' | 'approved' | 'rejected' | 'archived' | 'site_signed' | 'sent_to_hr'
  at: string
  by: string
  comment?: string
}

export interface FormSubmission {
  id: string
  templateId: string
  templateName: string
  status: FormSubmissionStatus
  submittedAt?: string
  submittedBy?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewComment?: string
  siteId?: string
  siteName?: string
  /** Attached photos or documents */
  attachments?: FormSubmissionAttachment[]
  /** Who signed and who is pending; timestamps for signed */
  signatures?: FormSubmissionSigner[]
  /** Full audit trail: draft creation, submission, reviews, approvals/rejections */
  auditEvents?: FormAuditEvent[]
  /** Set by HR only when form is archived */
  archivedAt?: string
  archivedBy?: string
  /** Site meeting workflow: H&S rep fills → site personnel sign → then sent to HR */
  workflowType?: 'standard' | 'site_meeting'
  /** User IDs of site personnel who must sign (site_meeting only) */
  siteSignerIds?: string[]
  /** Signatures from site personnel: userId and signedAt */
  siteSignatures?: { userId: string; signedAt: string }[]
  /** When all site signers have signed and form was sent to HR */
  submittedToHrAt?: string
  /** Field values from form fill (e.g. risk likelihood/impact for hazards) */
  fieldValues?: Record<string, string | number | boolean>
  /** When the form was last opened (for multi-HR awareness) */
  lastOpenedAt?: string
  lastOpenedBy?: string
  /** When the form was last edited (e.g. status/review) and by whom */
  lastEditedAt?: string
  lastEditedBy?: string
}

/** Category for filtering safety/form lists. HR creates templates with these types. */
export type FormTemplateCategory = 'incident' | 'near_miss' | 'hazard' | 'site_inspection' | 'site_meeting' | 'injury' | 'other'

export interface FormTemplate {
  id: string
  name: string
  description: string
  sections: FormSection[]
  version: number
  archived: boolean
  /** Used to show this template in the right safety list (e.g. near-miss reports, hazard register). */
  category?: FormTemplateCategory
  /** Optional regulatory reference (e.g. OSHA 301, Provincial OHS s. X) */
  regulatoryRef?: string
  /** Version history for compliance (changedAt, changedBy, snapshot) */
  versionHistory?: { version: number; changedAt: string; changedBy: string; snapshot: { name: string; sections: FormSection[] } }[]
}

export interface FormSection {
  id: string
  title: string
  fields: FormField[]
}

export interface FormField {
  id: string
  type: 'text' | 'textarea' | 'checkbox' | 'photo' | 'date' | 'time'
  label: string
  required?: boolean
  value?: string | boolean
}

export interface SignatureRequestSigner {
  id: string
  name: string
  role: string
  status: 'pending' | 'signed'
  userId?: string
  signedAt?: string
}

export interface SignatureRequest {
  id: string
  documentName: string
  requiredSigners: SignatureRequestSigner[]
  dueDate: string
  remindersSent: number
}

/** Who can view: everyone, or restricted to specific roles + optional specific user IDs (e.g. submitter) */
export type DocumentVisibility = 'everyone' | 'restricted'

export interface DocumentRecord {
  id: string
  name: string
  type: string
  siteId?: string
  siteName?: string
  date: string
  uploadedBy?: string
  /** @deprecated use visibility + visibleToRoles instead */
  roleRestricted?: UserRole[]
  /** When 'everyone', all users see it (e.g. safety handbook). When 'restricted', only visibleToRoles + visibleToUserIds can see. */
  visibility?: DocumentVisibility
  /** When visibility is 'restricted', which roles can view (e.g. owner, hr). */
  visibleToRoles?: UserRole[]
  /** When visibility is 'restricted', which user IDs can view (e.g. the supervisor who submitted the form). */
  visibleToUserIds?: string[]
  /** Inline PDF data URL for viewing in the app without download (optional). */
  fileDataUrl?: string
  /** When type is SOP: tags for filtering (site, role, hazard type) */
  tags?: string[]
  /** SOP acknowledgements: userId and date */
  acknowledgedBy?: { userId: string; acknowledgedAt: string }[]
  /** SOP version for re-acknowledgement when updated */
  version?: number
  /** When the document was last opened (for multi-HR awareness) */
  lastOpenedAt?: string
  lastOpenedBy?: string
  /** When the document was last edited and by whom */
  lastEditedAt?: string
  lastEditedBy?: string
}

export interface IncidentRecord {
  id: string
  title: string
  siteName: string
  date: string
  status: string
  severity?: 'low' | 'medium' | 'high'
  /** Classification for analytics and regulatory reporting */
  incidentType?: 'injury' | 'near-miss' | 'property-damage' | 'environmental' | 'other'
  severityLevel?: 1 | 2 | 3 | 4 | 5
  equipmentInvolved?: string
}

export interface EmailThread {
  id: string
  subject: string
  messages: { id: string; from: string; body: string; date: string; attachments?: string[] }[]
  status: 'new' | 'replied' | 'resolved'
  linkedRecordId?: string
}

export interface JobEntry {
  id: string
  source: string
  title: string
  fields: Record<string, string>
  status: 'pending' | 'approved' | 'discarded'
  emailId?: string
}

/** PDF document scanned/uploaded by HR for use as a form base */
export interface ScannedPdfDocument {
  id: string
  name: string
  uploadedAt: string
  uploadedBy: string
  /** URL or blob id for the file (mock: placeholder) */
  fileUrl?: string
}

/** A field HR places on a PDF form for the user to fill (text, date, or signature). Position as % of page (0–100). */
export interface PlacedFormField {
  id: string
  type: 'text' | 'date' | 'signature'
  label: string
  required?: boolean
  /** Page number (1-based). */
  page?: number
  /** Left position as % of page width (0–100). */
  x?: number
  /** Top position as % of page height (0–100). */
  y?: number
  /** Width as % of page width (0–100). */
  width?: number
  /** Height as % of page height (0–100). */
  height?: number
}

/** HR-created form template: either from scratch or from a scanned PDF with placed fields */
export interface SignableFormTemplate {
  id: string
  name: string
  description: string
  /** Assign by role: everyone with this role gets the form */
  assignedToRoles: UserRole[]
  /** Assign to specific users (HR can assign to anybody). When set, those users get the form in addition to/instead of role-based. */
  assignedToUserIds?: string[]
  schedule: 'daily' | 'weekly' | 'monthly' | 'once'
  createdAt: string
  createdBy: string
  active: boolean
  /** If set, this form is based on a scanned PDF; HR added fields to fill */
  sourcePdfId?: string
  /** Fields HR added (for PDF-based forms). Order = display order when filling. */
  placedFields?: PlacedFormField[]
}

/** A concrete instance of a form (daily/weekly/monthly) a user must fill out and sign */
export interface DailyFormToComplete {
  id: string
  signableFormId: string
  templateName: string
  dueDate: string
  status: 'pending' | 'filled' | 'signed'
  /** When set, only this user sees this instance (form assigned to specific person). */
  assignedToUserId?: string
  /** Role that sees this instance when assignedToUserId is not set. */
  assignedToRole: UserRole
}

/** A submitted signable form: field values, signature, and geo-tagged */
export interface SignableFormSubmission {
  id: string
  signableFormId: string
  templateName: string
  dailyFormId: string
  submittedBy: string
  submittedAt: string
  /** Values for each placed field (field id -> value) */
  fieldValues: Record<string, string>
  /** Signature: typed name (signature by text) */
  signatureText: string
  /** Geo at time of submission */
  geoLat?: number
  geoLng?: number
  geoAddress?: string
  /** When supervisor sends to labourers: labourers must also sign */
  workflowType?: 'standard' | 'site_meeting'
  /** User IDs of labourers who must sign (site_meeting only) */
  siteSignerIds?: string[]
  /** Signatures from labourers: userId and signedAt */
  siteSignatures?: { userId: string; signedAt: string }[]
}

/** Subcontractor company — HR tracks company, contact, contract, insurance, and certs */
export interface Subcontractor {
  id: string
  companyName: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone?: string
  status: 'active' | 'inactive'
  contractStart: string
  contractEnd?: string
  notes?: string
  /** Insurance (e.g. liability, WSIB); expiry triggers reminders */
  insurancePolicyNumber?: string
  insuranceExpiry?: string
  /** Site orientation / safety induction completed */
  orientationCompletedAt?: string
  /** When the subcontractor was last opened (for multi-HR awareness) */
  lastOpenedAt?: string
  lastOpenedBy?: string
  /** When the subcontractor was last edited and by whom */
  lastEditedAt?: string
  lastEditedBy?: string
}

/** Certification held by a subcontractor (company-level or key person); expiration tracked */
export interface SubcontractorCertification {
  id: string
  subcontractorId: string
  name: string
  issuedAt: string
  expiresAt: string
  status: 'current' | 'expiring-soon' | 'expired'
  fileName?: string
}

/** Subcontractor assigned to a job/site */
export interface SubcontractorJobAssignment {
  id: string
  jobId: string
  subcontractorId: string
  assignedBy: string
  assignedAt: string
}

/** Contractor worker (person) belonging to a subcontractor company; contractors do not log in */
export interface SubcontractorPersonnel {
  id: string
  subcontractorId: string
  name: string
  email?: string
}

/** Certification for an individual contractor worker */
export interface SubcontractorPersonnelCertification {
  id: string
  personnelId: string
  name: string
  issuedAt: string
  expiresAt: string
  status: 'current' | 'expiring-soon' | 'expired'
}

/** Contractor worker assigned to a specific job (which of their guys are on which job) */
export interface SubcontractorPersonnelJobAssignment {
  id: string
  personnelId: string
  jobId: string
  assignedAt: string
}

/** On-site check-in for a contractor worker (supervisor/HR marks who is on site) */
export interface SubcontractorPersonnelCheckIn {
  id: string
  personnelId: string
  jobId: string
  date: string
  checkedInAt: string | null
  checkedOutAt: string | null
}

/** Job/site assignment — created by Owner or HR; supervisor and labourers assigned */
export interface Job {
  id: string
  title: string
  siteName: string
  status: 'active' | 'completed' | 'on-hold'
  /** Multiple supervisors can be assigned to a single job. */
  assignedSupervisorIds: string[]
  createdBy: string
  createdAt: string
}

/** Labourer assigned to a job (by Owner/HR or by Supervisor) */
export interface JobAssignment {
  id: string
  jobId: string
  userId: string
  assignedBy: string
  assignedAt: string
}

/** Check-in for a labourer on a job for a given day */
export interface JobCheckIn {
  id: string
  jobId: string
  userId: string
  date: string
  checkedInAt: string | null
  checkedOutAt: string | null
}

/** Injury report — HR goes in depth; links to job/site; may have WSIB/workers' comp */
/** Injury type for classification and metrics */
export type InjuryType = 'laceration' | 'fracture' | 'strain' | 'sprain' | 'burn' | 'contusion' | 'amputation' | 'puncture' | 'other'
/** Body part affected */
export type BodyPart = 'hand' | 'finger' | 'arm' | 'back' | 'shoulder' | 'head' | 'eye' | 'leg' | 'knee' | 'foot' | 'torso' | 'other'
/** Mechanism of injury (OSHA-style) */
export type InjuryMechanism = 'struck-by' | 'struck-against' | 'caught-in' | 'fall-same-level' | 'fall-elevation' | 'overexertion' | 'contact-with' | 'exposure' | 'other'

export interface InjuryReport {
  id: string
  jobId?: string
  siteName: string
  reportedBy: string
  reportedAt: string
  status: 'draft' | 'submitted' | 'under-review' | 'closed'
  severity: 'minor' | 'moderate' | 'major'
  description: string
  followUpNotes?: string
  /** Who was injured (for tracking individuals) */
  injuredPersonName?: string
  injuredPersonId?: string
  /** Classification for metrics */
  injuryType?: InjuryType
  bodyPart?: BodyPart
  mechanism?: InjuryMechanism
  /** Date injury occurred (may differ from reportedAt) */
  dateOfInjury?: string
  /** Lost time injury */
  lostTime?: boolean
  daysAwayFromWork?: number
  restrictedDutyDays?: number
  /** WSIB / workers' comp workflow */
  wsibReported?: boolean
  wsibClaimNumber?: string
  wsibReportedAt?: string
  /** Root cause analysis id if completed */
  rootCauseId?: string
  /** Optional photo (URL or data URL) of scene/injury */
  photoUrl?: string
  /** When injury involves a subcontractor worker */
  subcontractorId?: string
}

/** Near-miss report — separate from injury; track and close */
export interface NearMissReport {
  id: string
  siteName: string
  reportedBy: string
  reportedAt: string
  description: string
  status: 'open' | 'under-review' | 'closed'
  followUpNotes?: string
}

/** Risk level from likelihood × impact (1–5 each) */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/** Control measure for a hazard */
export interface HazardControl {
  id: string
  description: string
  status: 'open' | 'in-progress' | 'completed'
  completedAt?: string
}

/** Hazard register entry */
export interface HazardReport {
  id: string
  siteName: string
  jobId?: string
  title: string
  description: string
  reportedBy: string
  reportedAt: string
  status: 'open' | 'in-progress' | 'closed'
  assignedTo?: string
  dueDate?: string
  closedAt?: string
  /** Risk scoring 1–5 */
  likelihood?: number
  impact?: number
  riskLevel?: RiskLevel
  recommendedControls?: HazardControl[]
}

/** Safety observation (positive or corrective) */
export interface SafetyObservation {
  id: string
  siteName: string
  type: 'positive' | 'corrective'
  description: string
  observedBy: string
  observedAt: string
  photoUrl?: string
}

/** Training or certification with expiry */
export interface TrainingCertification {
  id: string
  userId: string
  userName: string
  name: string
  type: 'first-aid' | 'whmis' | 'working-at-heights' | 'other'
  issuedAt: string
  expiresAt: string
  status: 'current' | 'expiring-soon' | 'expired'
}

/** Corrective or preventive action (CAPA) */
export interface CorrectiveAction {
  id: string
  /** Corrective = after event; preventive = to prevent recurrence */
  actionType: 'corrective' | 'preventive'
  sourceType: 'injury' | 'incident' | 'near-miss' | 'hazard'
  sourceId: string
  title: string
  description: string
  assignedTo: string
  dueDate: string
  status: 'open' | 'in-progress' | 'completed'
  completedAt?: string
}

/** Safety alert / bulletin */
export interface SafetyAlert {
  id: string
  title: string
  body: string
  siteNames?: string[]
  roles?: UserRole[]
  publishedAt: string
  expiresAt?: string
  acknowledgedBy?: string[]
}

/** Emergency info per site/job */
export interface EmergencySiteInfo {
  id: string
  jobId: string
  siteName: string
  firstAiderName?: string
  firstAiderPhone?: string
  emergencyContact?: string
  meetingPoint?: string
  nearestHospital?: string
}

/** Certificate uploaded by HR with expiration; HR is notified by email when close to expiration */
export interface Certificate {
  id: string
  name: string
  /** Display name of the certificate holder */
  holderName: string
  holderUserId?: string
  /** Expiration date (YYYY-MM-DD) */
  expirationDate: string
  uploadedAt: string
  uploadedBy: string
  /** Optional file name */
  fileName?: string
  /** Data URL of the attached PDF (so it can be displayed and printed) */
  fileDataUrl?: string
  /** When an expiration-reminder email was sent to HR (mock) */
  expirationReminderSentAt?: string
  /** Roles or job types this cert is required for (e.g. supervisor, first-aid) */
  requiredForRoles?: UserRole[]
}

/** Root cause analysis linked to an incident or injury */
export interface RootCauseAnalysis {
  id: string
  linkedType: 'injury' | 'incident'
  linkedId: string
  immediateCause: string
  contributingCauses: string[]
  underlyingCause?: string
  analyzedBy: string
  analyzedAt: string
}

/** Inspection checklist item */
export interface InspectionChecklistItem {
  id: string
  label: string
  result?: 'pass' | 'fail' | 'na'
  note?: string
}

/** Scheduled inspection */
export interface InspectionSchedule {
  id: string
  title: string
  siteName?: string
  checklistId: string
  frequency: 'weekly' | 'monthly' | 'quarterly'
  nextDue: string
  assignedToRole?: UserRole
}

/** Completed inspection result */
export interface InspectionResult {
  id: string
  scheduleId: string
  title: string
  siteName?: string
  completedAt: string
  completedBy: string
  items: InspectionChecklistItem[]
  submissionId?: string
}

/** Compliance calendar event (deadline, audit, renewal) */
export interface ComplianceCalendarEvent {
  id: string
  type: 'certificate_expiry' | 'inspection_due' | 'report_deadline' | 'regulatory' | 'subcontractor_cert_expiry' | 'subcontractor_insurance_expiry'
  title: string
  dueDate: string
  siteName?: string
  recordId?: string
  metadata?: Record<string, string>
}

/** HR task/todo item for daily, weekly, or monthly planning */
export type HRTodoRecurrence = 'daily' | 'weekly' | 'monthly'

export interface HRTodoItem {
  id: string
  title: string
  recurrence: HRTodoRecurrence
  /** ISO date (YYYY-MM-DD) for due date; for weekly, typically the week start; for monthly, first of month or specific day */
  dueDate: string
  /** Optional time (HH:mm) for due time; when set, task is shown with date + time */
  dueTime?: string
  completed: boolean
  completedAt?: string
  createdAt: string
  /** Optional link to internal route (e.g. injury report, form) */
  linkTo?: string
}

/** Audit log entry for admin view */
export interface AuditLogEntry {
  id: string
  at: string
  by: string
  action: string
  entityType: 'form' | 'injury' | 'document' | 'user' | 'subcontractor' | 'capa' | 'certificate'
  entityId: string
  entityLabel?: string
  linkTo?: string
}

/** Site (location) for site detail page */
export interface Site {
  id: string
  name: string
  jobId?: string
  activeJobTitle?: string
}

/** Job template for "Create from template" */
export interface JobTemplate {
  id: string
  name: string
  description?: string
  defaultSiteName?: string
}

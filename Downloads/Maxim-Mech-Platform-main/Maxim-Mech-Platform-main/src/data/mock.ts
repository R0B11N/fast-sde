import type {
  NotificationItem,
  FormSubmission,
  FormTemplate,
  SignatureRequest,
  DocumentRecord,
  IncidentRecord,
  EmailThread,
  JobEntry,
  ScannedPdfDocument,
  SignableFormTemplate,
  DailyFormToComplete,
  SignableFormSubmission,
  Job,
  JobAssignment,
  JobCheckIn,
  InjuryReport,
  NearMissReport,
  HazardReport,
  SafetyObservation,
  TrainingCertification,
  CorrectiveAction,
  SafetyAlert,
  EmergencySiteInfo,
  Certificate,
  RootCauseAnalysis,
  InspectionSchedule,
  InspectionResult,
  ComplianceCalendarEvent,
  Subcontractor,
  SubcontractorCertification,
  SubcontractorJobAssignment,
  SubcontractorPersonnel,
  SubcontractorPersonnelCertification,
  SubcontractorPersonnelJobAssignment,
  SubcontractorPersonnelCheckIn,
  HRTodoItem,
  AuditLogEntry,
  Site,
  JobTemplate,
} from '@/types'

/** All users in the app (for HR/Owner to assign forms to anybody) */
export const MOCK_APP_USERS: { id: string; name: string; role: string }[] = [
  { id: '1', name: 'Alex Chen', role: 'owner' },
  { id: '4', name: 'Morgan Reed', role: 'hr' },
  { id: '2', name: 'Jordan Smith', role: 'supervisor' },
  { id: '6', name: 'Pat Davis', role: 'supervisor' },
  { id: '7', name: 'Frank', role: 'supervisor' },
  { id: '3', name: 'Sam Williams', role: 'labourer' },
  { id: '5', name: 'Taylor Brown', role: 'labourer' },
]

/** Supervisors only (for job assignment) */
export const MOCK_SUPERVISORS = MOCK_APP_USERS.filter((u) => u.role === 'supervisor')

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'Form pending review', body: 'Site Inspection #204 needs your approval.', read: false, createdAt: '2025-02-09T10:00:00Z', type: 'reminder', linkTo: '/forms/f1' },
  { id: 'n2', title: 'Signature required', body: 'Safety Policy Acknowledgment is waiting for your signature.', read: false, createdAt: '2025-02-08T14:30:00Z', type: 'alert', linkTo: '/signing/sr1' },
  { id: 'n3', title: 'Incident reported', body: 'Minor incident at North Site has been submitted.', read: true, createdAt: '2025-02-07T09:15:00Z', type: 'info', linkTo: '/safety/incidents' },
  { id: 'n4', title: 'Subcontractor cert expiring', body: 'ABC Electrical — Working at Heights expires in 21 days.', read: false, createdAt: '2025-02-09T08:00:00Z', type: 'reminder', linkTo: '/subcontractors/sub1' },
  { id: 'n5', title: 'Subcontractor insurance expiry', body: 'Premier Plumbing liability insurance expires Mar 15, 2025.', read: false, createdAt: '2025-02-08T12:00:00Z', type: 'alert', linkTo: '/subcontractors/sub2' },
]

/** Subcontractors — HR tracks company, contact, contract, insurance, certs */
export const MOCK_SUBCONTRACTORS: Subcontractor[] = [
  { id: 'sub1', companyName: 'ABC Electrical Ltd', primaryContactName: 'Chris Adams', primaryContactEmail: 'chris@abcelectrical.ca', primaryContactPhone: '555-2001', status: 'active', contractStart: '2024-06-01', contractEnd: '2025-12-31', notes: 'Preferred for North and East sites.', insurancePolicyNumber: 'LIAB-ABC-001', insuranceExpiry: '2025-08-01', orientationCompletedAt: '2024-06-05T10:00:00Z' },
  { id: 'sub2', companyName: 'Premier Plumbing Inc', primaryContactName: 'Jamie Lee', primaryContactEmail: 'jamie@premierplumbing.ca', primaryContactPhone: '555-2002', status: 'active', contractStart: '2024-09-01', contractEnd: '2025-08-31', insurancePolicyNumber: 'LIAB-PREM-442', insuranceExpiry: '2025-03-15', orientationCompletedAt: '2024-09-02T14:00:00Z' },
  { id: 'sub3', companyName: 'SafeScaffold Co', primaryContactName: 'Riley Quinn', primaryContactEmail: 'riley@safescaffold.ca', status: 'inactive', contractStart: '2023-01-01', contractEnd: '2024-12-31', notes: 'Contract ended; may re-engage in 2025.' },
]

/** Subcontractor certifications with expiration */
export const MOCK_SUBCONTRACTOR_CERTIFICATIONS: SubcontractorCertification[] = [
  { id: 'scc1', subcontractorId: 'sub1', name: 'Working at Heights', issuedAt: '2024-03-01', expiresAt: '2025-03-01', status: 'expiring-soon' },
  { id: 'scc2', subcontractorId: 'sub1', name: 'Electrical Safety Authority', issuedAt: '2024-01-15', expiresAt: '2026-01-15', status: 'current' },
  { id: 'scc3', subcontractorId: 'sub2', name: 'WHMIS', issuedAt: '2024-06-01', expiresAt: '2025-06-01', status: 'current' },
  { id: 'scc4', subcontractorId: 'sub2', name: 'Confined Space', issuedAt: '2023-04-01', expiresAt: '2024-12-01', status: 'expired' },
]

/** Subcontractors assigned to jobs */
export const MOCK_SUBCONTRACTOR_JOB_ASSIGNMENTS: SubcontractorJobAssignment[] = [
  { id: 'sja1', jobId: 'job1', subcontractorId: 'sub1', assignedBy: 'Morgan Reed', assignedAt: '2025-02-01' },
  { id: 'sja2', jobId: 'job2', subcontractorId: 'sub2', assignedBy: 'Morgan Reed', assignedAt: '2025-02-05' },
]

/** Contractor workers (personnel) — they do not have system access; HR sees who is on which job */
export const MOCK_SUBCONTRACTOR_PERSONNEL: SubcontractorPersonnel[] = [
  { id: 'sp1', subcontractorId: 'sub1', name: 'Mike Sparks', email: 'mike@abcelectrical.ca' },
  { id: 'sp2', subcontractorId: 'sub1', name: 'Dana Cole', email: 'dana@abcelectrical.ca' },
  { id: 'sp3', subcontractorId: 'sub1', name: 'Jordan Blake' },
  { id: 'sp4', subcontractorId: 'sub2', name: 'Casey North', email: 'casey@premierplumbing.ca' },
  { id: 'sp5', subcontractorId: 'sub2', name: 'Riley Quinn' },
]

/** Certifications per contractor worker */
export const MOCK_SUBCONTRACTOR_PERSONNEL_CERTIFICATIONS: SubcontractorPersonnelCertification[] = [
  { id: 'spc1', personnelId: 'sp1', name: 'Working at Heights', issuedAt: '2024-03-01', expiresAt: '2025-03-01', status: 'expiring-soon' },
  { id: 'spc2', personnelId: 'sp1', name: 'Electrical Safety', issuedAt: '2024-01-15', expiresAt: '2026-01-15', status: 'current' },
  { id: 'spc3', personnelId: 'sp2', name: 'Working at Heights', issuedAt: '2024-05-01', expiresAt: '2025-05-01', status: 'current' },
  { id: 'spc4', personnelId: 'sp2', name: 'WHMIS', issuedAt: '2024-02-01', expiresAt: '2025-02-01', status: 'current' },
  { id: 'spc5', personnelId: 'sp3', name: 'Electrical Safety', issuedAt: '2024-06-01', expiresAt: '2026-06-01', status: 'current' },
  { id: 'spc6', personnelId: 'sp4', name: 'WHMIS', issuedAt: '2024-06-01', expiresAt: '2025-06-01', status: 'current' },
  { id: 'spc7', personnelId: 'sp4', name: 'Confined Space', issuedAt: '2024-04-01', expiresAt: '2025-04-01', status: 'current' },
  { id: 'spc8', personnelId: 'sp5', name: 'WHMIS', issuedAt: '2023-08-01', expiresAt: '2024-08-01', status: 'expired' },
]

/** Which contractor workers are assigned to which job */
export const MOCK_SUBCONTRACTOR_PERSONNEL_JOB_ASSIGNMENTS: SubcontractorPersonnelJobAssignment[] = [
  { id: 'spja1', personnelId: 'sp1', jobId: 'job1', assignedAt: '2025-02-01' },
  { id: 'spja2', personnelId: 'sp2', jobId: 'job1', assignedAt: '2025-02-01' },
  { id: 'spja3', personnelId: 'sp3', jobId: 'job1', assignedAt: '2025-02-03' },
  { id: 'spja4', personnelId: 'sp4', jobId: 'job2', assignedAt: '2025-02-05' },
  { id: 'spja5', personnelId: 'sp5', jobId: 'job2', assignedAt: '2025-02-05' },
]

const TODAY_SUB = '2025-02-09'
/** On-site check-ins for contractor workers (who is on site today) */
export const MOCK_SUBCONTRACTOR_PERSONNEL_CHECK_INS: SubcontractorPersonnelCheckIn[] = [
  { id: 'spci1', personnelId: 'sp1', jobId: 'job1', date: TODAY_SUB, checkedInAt: '2025-02-09T07:15:00Z', checkedOutAt: null },
  { id: 'spci2', personnelId: 'sp2', jobId: 'job1', date: TODAY_SUB, checkedInAt: '2025-02-09T07:30:00Z', checkedOutAt: null },
  { id: 'spci3', personnelId: 'sp3', jobId: 'job1', date: TODAY_SUB, checkedInAt: null, checkedOutAt: null },
  { id: 'spci4', personnelId: 'sp4', jobId: 'job2', date: TODAY_SUB, checkedInAt: '2025-02-09T08:00:00Z', checkedOutAt: null },
  { id: 'spci5', personnelId: 'sp5', jobId: 'job2', date: TODAY_SUB, checkedInAt: null, checkedOutAt: null },
]

export const MOCK_FORM_SUBMISSIONS: FormSubmission[] = [
  {
    id: 'f1',
    templateId: 't1',
    templateName: 'Site Inspection',
    status: 'submitted',
    submittedAt: '2025-02-09T08:00:00Z',
    submittedBy: 'Jordan Smith',
    siteName: 'North Site',
    attachments: [
      { id: 'a1', name: 'Inspection_photo_1.jpg', type: 'photo', uploadedAt: '2025-02-09T08:00:00Z' },
    ],
    signatures: [
      { id: 'sig1', name: 'Jordan Smith', role: 'Supervisor', status: 'signed', signedAt: '2025-02-09T08:05:00Z' },
      { id: 'sig2', name: 'Morgan Reed', role: 'HR', status: 'pending' },
    ],
    auditEvents: [
      { id: 'e1', type: 'draft_created', at: '2025-02-09T07:30:00Z', by: 'Jordan Smith' },
      { id: 'e2', type: 'submitted', at: '2025-02-09T08:00:00Z', by: 'Jordan Smith' },
    ],
  },
  { id: 'f2', templateId: 't2', templateName: 'Incident Report', status: 'draft', siteName: 'West Site' },
  {
    id: 'f3',
    templateId: 't1',
    templateName: 'Site Inspection',
    status: 'approved',
    submittedAt: '2025-02-08T16:00:00Z',
    reviewedAt: '2025-02-09T09:00:00Z',
    reviewedBy: 'Alex Chen',
    siteName: 'East Site',
    reviewComment: 'Looks good.',
    auditEvents: [
      { id: 'e3', type: 'draft_created', at: '2025-02-08T15:00:00Z', by: 'Jordan Smith' },
      { id: 'e4', type: 'submitted', at: '2025-02-08T16:00:00Z', by: 'Jordan Smith' },
      { id: 'e5', type: 'approved', at: '2025-02-09T09:00:00Z', by: 'Alex Chen', comment: 'Looks good.' },
    ],
  },
  {
    id: 'f4',
    templateId: 't2',
    templateName: 'Incident Report',
    status: 'approved',
    submittedAt: '2025-02-07T14:00:00Z',
    submittedBy: 'Sam Williams',
    siteName: 'North Site',
    reviewedBy: 'Jordan Smith',
  },
  {
    id: 'f5',
    templateId: 't3',
    templateName: 'Site Safety Meeting',
    status: 'pending_site_signatures',
    submittedAt: '2025-02-09T09:30:00Z',
    submittedBy: 'Jordan Smith',
    siteName: 'North Site',
    workflowType: 'site_meeting',
    siteSignerIds: ['3', '5'],
    siteSignatures: [],
    auditEvents: [
      { id: 'e6', type: 'draft_created', at: '2025-02-09T09:00:00Z', by: 'Jordan Smith' },
      { id: 'e7', type: 'submitted', at: '2025-02-09T09:30:00Z', by: 'Jordan Smith' },
    ],
  },
  {
    id: 'f6',
    templateId: 't4',
    templateName: 'Near-miss report',
    status: 'submitted',
    submittedAt: '2025-02-08T11:00:00Z',
    submittedBy: 'Sam Williams',
    siteName: 'West Site',
    auditEvents: [
      { id: 'e8', type: 'draft_created', at: '2025-02-08T10:30:00Z', by: 'Sam Williams' },
      { id: 'e9', type: 'submitted', at: '2025-02-08T11:00:00Z', by: 'Sam Williams' },
    ],
  },
  {
    id: 'f7',
    templateId: 't4',
    templateName: 'Near-miss report',
    status: 'approved',
    submittedAt: '2025-02-05T14:00:00Z',
    submittedBy: 'Jordan Smith',
    siteName: 'North Site',
    reviewedAt: '2025-02-06T09:00:00Z',
    reviewedBy: 'Morgan Reed',
    auditEvents: [
      { id: 'e10', type: 'submitted', at: '2025-02-05T14:00:00Z', by: 'Jordan Smith' },
      { id: 'e11', type: 'approved', at: '2025-02-06T09:00:00Z', by: 'Morgan Reed' },
    ],
  },
  {
    id: 'f8',
    templateId: 't5',
    templateName: 'Hazard report',
    status: 'submitted',
    submittedAt: '2025-02-09T08:30:00Z',
    submittedBy: 'Taylor Brown',
    siteName: 'North Site',
    fieldValues: { hzf5: 3, hzf6: 4 },
    auditEvents: [
      { id: 'e12', type: 'draft_created', at: '2025-02-09T08:00:00Z', by: 'Taylor Brown' },
      { id: 'e13', type: 'submitted', at: '2025-02-09T08:30:00Z', by: 'Taylor Brown' },
    ],
  },
  {
    id: 'f9',
    templateId: 't5',
    templateName: 'Hazard report',
    status: 'approved',
    submittedAt: '2025-02-07T16:00:00Z',
    submittedBy: 'Jordan Smith',
    siteName: 'East Site',
    fieldValues: { hzf5: 2, hzf6: 3 },
    reviewedAt: '2025-02-08T10:00:00Z',
    reviewedBy: 'Morgan Reed',
    auditEvents: [
      { id: 'e14', type: 'submitted', at: '2025-02-07T16:00:00Z', by: 'Jordan Smith' },
      { id: 'e15', type: 'approved', at: '2025-02-08T10:00:00Z', by: 'Morgan Reed' },
    ],
  },
]

export const MOCK_FORM_TEMPLATE: FormTemplate = {
  id: 't1',
  name: 'Site Inspection',
  description: 'Weekly site safety inspection',
  version: 2,
  archived: false,
  category: 'site_inspection',
  sections: [
    {
      id: 's1',
      title: 'General',
      fields: [
        { id: 'f1', type: 'text', label: 'Site name', required: true },
        { id: 'f2', type: 'text', label: 'Inspector name', required: true },
        { id: 'f3', type: 'textarea', label: 'Overall notes' },
      ],
    },
    {
      id: 's2',
      title: 'Hazards',
      fields: [
        { id: 'f4', type: 'checkbox', label: 'PPE compliance verified' },
        { id: 'f5', type: 'photo', label: 'Photo evidence (optional)' },
      ],
    },
  ],
}

/** Site Safety Meeting: H&S rep fills → meeting with site → all site personnel sign → then sent to HR */
export const MOCK_FORM_TEMPLATE_SITE_MEETING: FormTemplate = {
  id: 't3',
  name: 'Site Safety Meeting',
  description: 'H&S rep fills out, then meeting with site personnel; all sign off, then sent to HR',
  version: 1,
  archived: false,
  category: 'site_meeting',
  sections: [
    { id: 'sm1', title: 'Meeting details', fields: [{ id: 'smf1', type: 'text', label: 'Topic', required: true }, { id: 'smf2', type: 'textarea', label: 'Discussion notes' }] },
    { id: 'sm2', title: 'Attendees', fields: [{ id: 'smf3', type: 'text', label: 'Site personnel present' }] },
  ],
}

/** Near-miss report template — custom form created by HR with text fields to fill out */
export const MOCK_FORM_TEMPLATE_NEAR_MISS: FormTemplate = {
  id: 't4',
  name: 'Near-miss report',
  description: 'Report a near-miss event. HR creates this template with custom fields.',
  version: 1,
  archived: false,
  category: 'near_miss',
  sections: [
    { id: 'nm1', title: 'Event details', fields: [{ id: 'nmf1', type: 'text', label: 'Location / area', required: true }, { id: 'nmf2', type: 'textarea', label: 'What happened', required: true }, { id: 'nmf3', type: 'text', label: 'Immediate action taken' }] },
    { id: 'nm2', title: 'Follow-up', fields: [{ id: 'nmf4', type: 'textarea', label: 'Recommendations to prevent recurrence' }] },
  ],
}

/** Hazard report template — custom form created by HR; includes risk scoring */
export const MOCK_FORM_TEMPLATE_HAZARD: FormTemplate = {
  id: 't5',
  name: 'Hazard report',
  description: 'Report a hazard by site with risk likelihood and impact. HR creates this template.',
  version: 1,
  archived: false,
  category: 'hazard',
  sections: [
    {
      id: 'hz1',
      title: 'Hazard details',
      fields: [
        { id: 'hzf1', type: 'text', label: 'Title / summary', required: true },
        { id: 'hzf2', type: 'text', label: 'Site / location', required: true },
        { id: 'hzf3', type: 'textarea', label: 'Description', required: true },
        { id: 'hzf4', type: 'text', label: 'Suggested corrective action' },
        { id: 'hzf5', type: 'text', label: 'Risk likelihood (1–5)', required: false },
        { id: 'hzf6', type: 'text', label: 'Risk impact (1–5)', required: false },
      ],
    },
  ],
}

export const MOCK_FORM_TEMPLATES: Record<string, FormTemplate> = {
  t1: MOCK_FORM_TEMPLATE,
  t2: { ...MOCK_FORM_TEMPLATE, id: 't2', name: 'Incident Report', description: 'Custom form for incident or near-miss. HR edits this template in Admin → Templates; workers fill it out and submit.', category: 'incident', regulatoryRef: 'OSHA 301 / Provincial OHS equivalent', sections: [{ id: 'ir1', title: 'Details', fields: [{ id: 'irf1', type: 'text', label: 'Description', required: true }, { id: 'irf2', type: 'textarea', label: 'What happened', required: true }, { id: 'irf3', type: 'text', label: 'Site / location' }] }] },
  t3: MOCK_FORM_TEMPLATE_SITE_MEETING,
  t4: MOCK_FORM_TEMPLATE_NEAR_MISS,
  t5: MOCK_FORM_TEMPLATE_HAZARD,
}

export const MOCK_SIGNATURE_REQUESTS: SignatureRequest[] = [
  {
    id: 'sr1',
    documentName: 'Safety Policy Acknowledgment 2025',
    dueDate: '2025-02-15',
    remindersSent: 1,
    requiredSigners: [
      { id: 'u1', name: 'Sam Williams', role: 'Labourer', status: 'pending', userId: '3' },
      { id: 'u2', name: 'Jordan Smith', role: 'Supervisor', status: 'signed', userId: '2', signedAt: '2025-02-09T10:00:00Z' },
    ],
  },
  {
    id: 'sr2',
    documentName: 'Site Safety Briefing — Feb 2025',
    dueDate: '2025-02-20',
    remindersSent: 0,
    requiredSigners: [
      { id: 'u3', name: 'Sam Williams', role: 'Labourer', status: 'pending', userId: '3' },
    ],
  },
]

export const MOCK_DOCUMENTS: DocumentRecord[] = [
  { id: 'd1', name: 'Site Inspection North 2025-02-09.pdf', type: 'Inspection', siteName: 'North Site', date: '2025-02-09', uploadedBy: 'Jordan Smith', visibility: 'restricted', visibleToRoles: ['owner', 'hr'], visibleToUserIds: ['2'] },
  { id: 'd2', name: 'Safety Handbook 2025.pdf', type: 'Policy', date: '2025-01-01', uploadedBy: 'Morgan Reed', visibility: 'everyone' },
  { id: 'd3', name: 'Incident Report IR-204.pdf', type: 'Incident', siteName: 'West Site', date: '2025-02-07', uploadedBy: 'Sam Williams', visibility: 'restricted', visibleToRoles: ['owner', 'hr'], visibleToUserIds: ['3'] },
  { id: 'd4', name: 'Safety Policy 2025.pdf', type: 'Policy', date: '2025-01-01', uploadedBy: 'Morgan Reed', roleRestricted: ['owner', 'supervisor'] },
  { id: 'd5', name: 'Lockout/Tagout SOP v2.pdf', type: 'SOP', siteName: 'North Site', date: '2025-01-15', uploadedBy: 'Morgan Reed', visibility: 'everyone', tags: ['North Site', 'supervisor', 'electrical'], version: 2, acknowledgedBy: [{ userId: '2', acknowledgedAt: '2025-01-20T10:00:00Z' }, { userId: '6', acknowledgedAt: '2025-01-21T09:00:00Z' }] },
  { id: 'd6', name: '2026 - Maxim Mechanical Health Safety Manual.pdf', type: 'Policy', date: '2026-01-01', uploadedBy: 'Morgan Reed', visibility: 'everyone' },
]

export const MOCK_INCIDENTS: IncidentRecord[] = [
  { id: 'i1', title: 'Minor cut - first aid', siteName: 'North Site', date: '2025-02-09', status: 'Reported', severity: 'low' },
  { id: 'i2', title: 'Near miss - falling object', siteName: 'West Site', date: '2025-02-07', status: 'Under review', severity: 'medium' },
]

export const MOCK_EMAIL_THREADS: EmailThread[] = [
  {
    id: 'e1',
    subject: 'Re: Job #4521 - HVAC Install',
    status: 'replied',
    linkedRecordId: 'd1',
    messages: [
      { id: 'm1', from: 'client@example.com', body: 'Can we schedule for Tuesday?', date: '2025-02-08T10:00:00Z' },
      { id: 'm2', from: 'alex@maximmechanical.com', body: 'Yes, Tuesday 9am works. I will confirm with the crew.', date: '2025-02-08T14:00:00Z', attachments: ['schedule.pdf'] },
    ],
  },
]

export const MOCK_JOB_ENTRIES: JobEntry[] = [
  { id: 'j1', source: 'Email thread #4521', title: 'HVAC Install - 123 Main St', fields: { Client: 'ABC Corp', Address: '123 Main St', Due: '2025-02-15' }, status: 'pending', emailId: 'e1' },
  { id: 'j2', source: 'Email thread #4480', title: 'Plumbing Repair', fields: { Client: 'XYZ Ltd', Address: '456 Oak Ave', Due: '2025-02-12' }, status: 'approved', emailId: 'e2' },
]

export const MOCK_SITES = ['North Site', 'South Site', 'East Site', 'West Site']

/** Labourer's assigned supervisor (mock: by labourer name) */
export const MOCK_SUPERVISOR_BY_LABOURER: Record<string, string> = {
  'Sam Williams': 'Jordan Smith',
  'Taylor Brown': 'Jordan Smith',
}

/** Jobs assigned to labourers (mock) */
export const MOCK_ASSIGNED_JOBS_LABOURER = [
  { id: 'aj1', title: 'North Site — HVAC install', site: 'North Site', due: '2025-02-15' },
  { id: 'aj2', title: 'West Site — Plumbing support', site: 'West Site', due: '2025-02-18' },
]

/** PDFs scanned/uploaded by HR to turn into fillable forms */
export const MOCK_SCANNED_PDFS: ScannedPdfDocument[] = [
  { id: 'pdf1', name: 'Site Safety Checklist.pdf', uploadedAt: '2025-02-01T10:00:00Z', uploadedBy: 'Morgan Reed' },
  { id: 'pdf2', name: 'Equipment Inspection.pdf', uploadedAt: '2025-02-05T14:00:00Z', uploadedBy: 'Morgan Reed' },
  { id: 'pdf3', name: 'Site Opening Report.pdf', uploadedAt: '2025-02-01T11:00:00Z', uploadedBy: 'Alex Chen' },
  { id: 'pdf4', name: 'Weekly Toolbox Talk.pdf', uploadedAt: '2025-01-20T09:00:00Z', uploadedBy: 'Alex Chen' },
  { id: 'pdf5', name: 'Site-Specific Briefing.pdf', uploadedAt: '2025-02-08T10:00:00Z', uploadedBy: 'Morgan Reed' },
]

/** HR-created custom forms: some from scratch, some from scanned PDFs with placed fields */
export const MOCK_SIGNABLE_FORM_TEMPLATES: SignableFormTemplate[] = [
  { id: 'sf1', name: 'Daily Safety Checklist', description: 'Supervisors complete and sign each day.', assignedToRoles: ['supervisor'], schedule: 'daily', createdAt: '2025-01-15', createdBy: 'Alex Chen', active: true, sourcePdfId: 'pdf1', placedFields: [{ id: 'pf1', type: 'text', label: 'Site name', required: true, page: 1, x: 10, y: 18, width: 28, height: 6 }, { id: 'pf2', type: 'date', label: 'Date', required: true, page: 1, x: 10, y: 28, width: 28, height: 6 }, { id: 'pf3', type: 'text', label: 'Inspector name', required: true, page: 1, x: 10, y: 38, width: 28, height: 6 }, { id: 'pf4', type: 'signature', label: 'Signature', required: true, page: 1, x: 10, y: 55, width: 40, height: 8 }] },
  { id: 'sf2', name: 'Site Opening Report', description: 'Morning site opening form — fill and sign.', assignedToRoles: ['supervisor'], schedule: 'daily', createdAt: '2025-02-01', createdBy: 'Alex Chen', active: true, sourcePdfId: 'pdf3', placedFields: [{ id: 'po1', type: 'text', label: 'Site', required: true, page: 1, x: 10, y: 20, width: 28, height: 6 }, { id: 'po2', type: 'date', label: 'Date', required: true, page: 1, x: 10, y: 30, width: 28, height: 6 }, { id: 'po3', type: 'signature', label: 'Signature', required: true, page: 1, x: 10, y: 45, width: 40, height: 8 }] },
  { id: 'sf3', name: 'Weekly Toolbox Talk', description: 'Weekly acknowledgment; supervisors sign.', assignedToRoles: ['supervisor'], schedule: 'weekly', createdAt: '2025-01-20', createdBy: 'Alex Chen', active: true, sourcePdfId: 'pdf4', placedFields: [{ id: 'pt1', type: 'text', label: 'Topic', required: true, page: 1, x: 10, y: 18, width: 28, height: 6 }, { id: 'pt2', type: 'date', label: 'Date', required: true, page: 1, x: 10, y: 28, width: 28, height: 6 }, { id: 'pt3', type: 'signature', label: 'Signature', required: true, page: 1, x: 10, y: 45, width: 40, height: 8 }] },
  { id: 'sf4', name: 'Monthly Equipment Check', description: 'From scanned PDF — labourers and supervisors.', assignedToRoles: ['supervisor', 'labourer'], schedule: 'monthly', createdAt: '2025-02-06', createdBy: 'Morgan Reed', active: true, sourcePdfId: 'pdf2', placedFields: [{ id: 'pe1', type: 'text', label: 'Equipment ID', required: true, page: 1, x: 12, y: 20, width: 28, height: 6 }, { id: 'pe2', type: 'date', label: 'Inspection date', required: true, page: 1, x: 12, y: 32, width: 28, height: 6 }, { id: 'pe3', type: 'signature', label: 'Signature', required: true, page: 1, x: 12, y: 50, width: 40, height: 8 }] },
  { id: 'sf5', name: 'Site-Specific Briefing', description: 'Assigned to specific people by HR.', assignedToRoles: [], assignedToUserIds: ['2', '3'], schedule: 'weekly', createdAt: '2025-02-08', createdBy: 'Morgan Reed', active: true, sourcePdfId: 'pdf5', placedFields: [{ id: 'pb1', type: 'text', label: 'Briefing name', required: true, page: 1, x: 10, y: 20, width: 28, height: 6 }, { id: 'pb2', type: 'date', label: 'Date', required: true, page: 1, x: 10, y: 30, width: 28, height: 6 }, { id: 'pb3', type: 'signature', label: 'Signature', required: true, page: 1, x: 10, y: 45, width: 40, height: 8 }] },
]

/** Today's forms users need to fill out and sign (derived from signable templates + schedule). assignedToUserId = assigned to that person specifically. */
export const MOCK_DAILY_FORMS_TO_COMPLETE: DailyFormToComplete[] = [
  { id: 'df1', signableFormId: 'sf1', templateName: 'Daily Safety Checklist', dueDate: '2025-02-09', status: 'pending', assignedToRole: 'supervisor' },
  { id: 'df2', signableFormId: 'sf2', templateName: 'Site Opening Report', dueDate: '2025-02-09', status: 'filled', assignedToRole: 'supervisor' },
  { id: 'df3', signableFormId: 'sf4', templateName: 'Monthly Equipment Check', dueDate: '2025-02-28', status: 'pending', assignedToRole: 'labourer' },
  { id: 'df4', signableFormId: 'sf5', templateName: 'Site-Specific Briefing', dueDate: '2025-02-15', status: 'pending', assignedToUserId: '2', assignedToRole: 'supervisor' },
  { id: 'df5', signableFormId: 'sf5', templateName: 'Site-Specific Briefing', dueDate: '2025-02-15', status: 'pending', assignedToUserId: '3', assignedToRole: 'labourer' },
]

/** Submissions of signable forms (with field values, signature, geo) */
export const MOCK_SIGNABLE_SUBMISSIONS: SignableFormSubmission[] = [
  { id: 'ss1', signableFormId: 'sf1', templateName: 'Daily Safety Checklist', dailyFormId: 'df0', submittedBy: 'Jordan Smith', submittedAt: '2025-02-08T16:00:00Z', fieldValues: { pf1: 'North Site', pf2: '2025-02-08', pf3: 'Jordan Smith', pf4: 'Jordan Smith' }, signatureText: 'Jordan Smith', geoLat: 49.2827, geoLng: -123.1207, geoAddress: 'North Site, Vancouver (mock)' },
]

/** Jobs — Owner/HR create and assign supervisor; supervisors assign labourers */
export const MOCK_JOBS: Job[] = [
  { id: 'job1', title: 'HVAC Install — North Site', siteName: 'North Site', status: 'active', assignedSupervisorIds: ['2'], createdBy: 'Alex Chen', createdAt: '2025-02-01' },
  { id: 'job2', title: 'Plumbing — West Site', siteName: 'West Site', status: 'active', assignedSupervisorIds: ['2'], createdBy: 'Morgan Reed', createdAt: '2025-02-05' },
  { id: 'job3', title: 'Electrical — East Site', siteName: 'East Site', status: 'active', assignedSupervisorIds: ['6'], createdBy: 'Alex Chen', createdAt: '2025-02-08' },
  { id: 'job4', title: 'Site Safety — Demo', siteName: 'North Site', status: 'active', assignedSupervisorIds: ['7'], createdBy: 'Alex Chen', createdAt: '2025-02-09' },
]

export const MOCK_JOB_ASSIGNMENTS: JobAssignment[] = [
  { id: 'ja1', jobId: 'job1', userId: '3', assignedBy: 'Jordan Smith', assignedAt: '2025-02-02' },
  { id: 'ja2', jobId: 'job1', userId: '5', assignedBy: 'Jordan Smith', assignedAt: '2025-02-03' },
  { id: 'ja3', jobId: 'job2', userId: '3', assignedBy: 'Morgan Reed', assignedAt: '2025-02-06' },
  { id: 'ja4', jobId: 'job3', userId: '3', assignedBy: 'Pat Davis', assignedAt: '2025-02-07' },
  { id: 'ja5', jobId: 'job3', userId: '5', assignedBy: 'Pat Davis', assignedAt: '2025-02-07' },
  { id: 'ja6', jobId: 'job4', userId: '3', assignedBy: 'Frank', assignedAt: '2025-02-09' },
  { id: 'ja7', jobId: 'job4', userId: '5', assignedBy: 'Frank', assignedAt: '2025-02-09' },
]

const TODAY = '2025-02-09'
export const MOCK_JOB_CHECK_INS: JobCheckIn[] = [
  { id: 'ci1', jobId: 'job1', userId: '3', date: TODAY, checkedInAt: '2025-02-09T07:00:00Z', checkedOutAt: null },
  { id: 'ci2', jobId: 'job1', userId: '5', date: TODAY, checkedInAt: null, checkedOutAt: null },
  { id: 'ci3', jobId: 'job2', userId: '3', date: TODAY, checkedInAt: null, checkedOutAt: null },
]

/** Injury reports — HR manages in depth; optional WSIB; track type, who was injured, metrics */
export const MOCK_INJURY_REPORTS: InjuryReport[] = [
  { id: 'ir1', jobId: 'job1', siteName: 'North Site', reportedBy: 'Jordan Smith', reportedAt: '2025-02-09T10:00:00Z', status: 'under-review', severity: 'minor', description: 'Minor cut to finger during install; first aid applied on site.', injuredPersonName: 'Sam Williams', injuredPersonId: '3', injuryType: 'laceration', bodyPart: 'finger', mechanism: 'struck-by', dateOfInjury: '2025-02-09', lostTime: false, wsibReported: false, subcontractorId: 'sub1', photoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400' },
  { id: 'ir2', siteName: 'West Site', reportedBy: 'Sam Williams', reportedAt: '2025-02-07T14:00:00Z', status: 'submitted', severity: 'moderate', description: 'Twisted ankle stepping off scaffold. Seen at clinic.', injuredPersonName: 'Sam Williams', injuredPersonId: '3', injuryType: 'sprain', bodyPart: 'knee', mechanism: 'fall-same-level', dateOfInjury: '2025-02-07', lostTime: true, daysAwayFromWork: 2, restrictedDutyDays: 3, wsibReported: true, wsibClaimNumber: 'WSIB-2025-0042', wsibReportedAt: '2025-02-08T09:00:00Z' },
  { id: 'ir3', jobId: 'job1', siteName: 'North Site', reportedBy: 'Jordan Smith', reportedAt: '2025-01-28T11:00:00Z', status: 'closed', severity: 'minor', description: 'Small burn from hot pipe; first aid on site.', injuredPersonName: 'Taylor Brown', injuredPersonId: '5', injuryType: 'burn', bodyPart: 'hand', mechanism: 'contact-with', dateOfInjury: '2025-01-28', lostTime: false, wsibReported: false },
  { id: 'ir4', siteName: 'East Site', reportedBy: 'Pat Davis', reportedAt: '2025-01-15T09:00:00Z', status: 'closed', severity: 'major', description: 'Back strain lifting heavy equipment. Off work 5 days.', injuredPersonName: 'Alex Chen', injuredPersonId: '1', injuryType: 'strain', bodyPart: 'back', mechanism: 'overexertion', dateOfInjury: '2025-01-14', lostTime: true, daysAwayFromWork: 5, restrictedDutyDays: 7, wsibReported: true, wsibClaimNumber: 'WSIB-2025-0012', wsibReportedAt: '2025-01-15T14:00:00Z' },
  { id: 'ir5', jobId: 'job2', siteName: 'West Site', reportedBy: 'Morgan Reed', reportedAt: '2025-02-01T16:00:00Z', status: 'closed', severity: 'moderate', description: 'Finger contusion from hammer; no lost time.', injuredPersonName: 'Taylor Brown', injuredPersonId: '5', injuryType: 'contusion', bodyPart: 'finger', mechanism: 'struck-by', dateOfInjury: '2025-02-01', lostTime: false, wsibReported: false },
]

export const MOCK_NEAR_MISS_REPORTS: NearMissReport[] = [
  { id: 'nm1', siteName: 'North Site', reportedBy: 'Sam Williams', reportedAt: '2025-02-09T11:00:00Z', description: 'Unsecured ladder; no one hurt.', status: 'open' },
  { id: 'nm2', siteName: 'West Site', reportedBy: 'Jordan Smith', reportedAt: '2025-02-08T14:00:00Z', description: 'Near miss with forklift in narrow aisle.', status: 'closed', followUpNotes: 'Barriers installed.' },
]

export const MOCK_HAZARD_REPORTS: HazardReport[] = [
  { id: 'hz1', siteName: 'North Site', title: 'Wet floor at entrance', description: 'Slip risk when raining.', reportedBy: 'Taylor Brown', reportedAt: '2025-02-09T08:00:00Z', status: 'open', assignedTo: 'Jordan Smith', dueDate: '2025-02-10', likelihood: 3, impact: 4, riskLevel: 'high' },
  { id: 'hz2', siteName: 'East Site', jobId: 'job3', title: 'Exposed wiring', description: 'Temporary run needs guarding.', reportedBy: 'Jordan Smith', reportedAt: '2025-02-07T10:00:00Z', status: 'in-progress', assignedTo: 'Pat Davis', dueDate: '2025-02-12', likelihood: 2, impact: 5, riskLevel: 'high' },
]

export const MOCK_SAFETY_OBSERVATIONS: SafetyObservation[] = [
  { id: 'so1', siteName: 'North Site', type: 'positive', description: 'PPE worn correctly by all crew.', observedBy: 'Jordan Smith', observedAt: '2025-02-09T09:00:00Z' },
  { id: 'so2', siteName: 'West Site', type: 'corrective', description: 'Toolbox area cluttered; trip hazard.', observedBy: 'Pat Davis', observedAt: '2025-02-08T15:00:00Z' },
]

export const MOCK_TRAINING_CERTIFICATIONS: TrainingCertification[] = [
  { id: 'tc1', userId: '2', userName: 'Jordan Smith', name: 'First Aid Level 1', type: 'first-aid', issuedAt: '2024-02-01', expiresAt: '2026-02-01', status: 'current' },
  { id: 'tc2', userId: '3', userName: 'Sam Williams', name: 'WHMIS', type: 'whmis', issuedAt: '2024-06-01', expiresAt: '2025-03-01', status: 'expiring-soon' },
  { id: 'tc3', userId: '5', userName: 'Taylor Brown', name: 'Working at Heights', type: 'working-at-heights', issuedAt: '2023-01-15', expiresAt: '2024-12-31', status: 'expired' },
]

export const MOCK_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  { id: 'ca1', actionType: 'corrective', sourceType: 'injury', sourceId: 'ir1', title: 'Review glove policy', description: 'Ensure cut-resistant gloves available.', assignedTo: 'Morgan Reed', dueDate: '2025-02-16', status: 'open' },
  { id: 'ca2', actionType: 'corrective', sourceType: 'near-miss', sourceId: 'nm2', title: 'Forklift zone markings', description: 'Mark narrow aisles as no-forklift.', assignedTo: 'Jordan Smith', dueDate: '2025-02-14', status: 'in-progress' },
  { id: 'ca3', actionType: 'preventive', sourceType: 'hazard', sourceId: 'f8', title: 'Weekly slip-audit at entrance', description: 'Prevent recurrence of wet floor incidents.', assignedTo: 'Pat Davis', dueDate: '2025-02-20', status: 'open' },
]

export const MOCK_SAFETY_ALERTS: SafetyAlert[] = [
  { id: 'sa1', title: 'Ice on north lot', body: 'Salt and use caution when walking to trailers.', siteNames: ['North Site'], publishedAt: '2025-02-09T07:00:00Z', expiresAt: '2025-02-10T18:00:00Z' },
  { id: 'sa2', title: 'New PPE policy reminder', body: 'High-vis vests required on all sites from Feb 15.', publishedAt: '2025-02-01T00:00:00Z', expiresAt: '2025-02-15T00:00:00Z' },
]

export const MOCK_EMERGENCY_SITE_INFO: EmergencySiteInfo[] = [
  { id: 'em1', jobId: 'job1', siteName: 'North Site', firstAiderName: 'Jordan Smith', firstAiderPhone: '555-0102', meetingPoint: 'Main trailer', nearestHospital: 'City General — 5 km' },
  { id: 'em2', jobId: 'job2', siteName: 'West Site', firstAiderName: 'Pat Davis', firstAiderPhone: '555-0103', emergencyContact: 'Site lead 555-0100' },
]

/** Certificates uploaded by HR; expiration reminders are sent to HR when close to expiry */
export const MOCK_CERTIFICATES: Certificate[] = [
  { id: 'cert1', name: 'First Aid Level 1', holderName: 'Jordan Smith', holderUserId: '2', expirationDate: '2025-06-15', uploadedAt: '2025-01-10T12:00:00Z', uploadedBy: 'Morgan Reed', fileName: 'first-aid-jordan-smith.pdf', expirationReminderSentAt: undefined, requiredForRoles: ['supervisor'] },
  { id: 'cert2', name: 'Working at Heights', holderName: 'Sam Williams', holderUserId: '3', expirationDate: '2025-03-01', uploadedAt: '2025-02-01T09:00:00Z', uploadedBy: 'Morgan Reed', fileName: 'wah-sam-williams.pdf', expirationReminderSentAt: '2025-02-01T00:00:00Z', requiredForRoles: ['labourer', 'supervisor'] },
  { id: 'cert3', name: 'WHMIS', holderName: 'Taylor Brown', holderUserId: '5', expirationDate: '2026-01-20', uploadedAt: '2025-01-15T14:00:00Z', uploadedBy: 'Morgan Reed', fileName: 'whmis-taylor-brown.pdf', requiredForRoles: ['labourer'] },
]

/** Root cause analyses linked to injuries/incidents */
export const MOCK_ROOT_CAUSES: RootCauseAnalysis[] = [
  { id: 'rc1', linkedType: 'injury', linkedId: 'ir1', immediateCause: 'Cut from sharp edge on duct', contributingCauses: ['Gloves not worn', 'Rushed task'], underlyingCause: 'PPE not enforced for task', analyzedBy: 'Morgan Reed', analyzedAt: '2025-02-09T14:00:00Z' },
]

/** Inspection checklists (predefined); schedule references checklistId */
export const MOCK_INSPECTION_CHECKLISTS: { id: string; title: string; items: { id: string; label: string }[] }[] = [
  { id: 'cl1', title: 'Weekly Site Safety', items: [{ id: 'cl1a', label: 'PPE available and in good condition' }, { id: 'cl1b', label: 'Fire extinguishers accessible' }, { id: 'cl1c', label: 'First aid kit stocked' }, { id: 'cl1d', label: 'No obstructions in egress' }] },
]

export const MOCK_INSPECTION_SCHEDULES: InspectionSchedule[] = [
  { id: 'ins1', title: 'Weekly Site Safety', siteName: 'North Site', checklistId: 'cl1', frequency: 'weekly', nextDue: '2025-02-16', assignedToRole: 'supervisor' },
  { id: 'ins2', title: 'Weekly Site Safety', siteName: 'West Site', checklistId: 'cl1', frequency: 'weekly', nextDue: '2025-02-14', assignedToRole: 'supervisor' },
]

export const MOCK_INSPECTION_RESULTS: InspectionResult[] = [
  { id: 'res1', scheduleId: 'ins1', title: 'Weekly Site Safety', siteName: 'North Site', completedAt: '2025-02-09T10:00:00Z', completedBy: 'Jordan Smith', items: [{ id: 'cl1a', label: 'PPE available and in good condition', result: 'pass' }, { id: 'cl1b', label: 'Fire extinguishers accessible', result: 'pass' }, { id: 'cl1c', label: 'First aid kit stocked', result: 'fail', note: 'Restock bandages' }, { id: 'cl1d', label: 'No obstructions in egress', result: 'pass' }], submissionId: 'f1' },
]

export const MOCK_COMPLIANCE_CALENDAR: ComplianceCalendarEvent[] = [
  { id: 'cc1', type: 'certificate_expiry', title: 'Working at Heights — Sam Williams', dueDate: '2025-03-01', recordId: 'cert2' },
  { id: 'cc2', type: 'inspection_due', title: 'Weekly Site Safety — North Site', dueDate: '2025-02-16', siteName: 'North Site', recordId: 'ins1' },
  { id: 'cc3', type: 'report_deadline', title: 'Monthly injury summary', dueDate: '2025-03-05', metadata: { requirement: 'OSHA 300' } },
  { id: 'cc4', type: 'subcontractor_cert_expiry', title: 'ABC Electrical — Working at Heights', dueDate: '2025-03-01', recordId: 'scc1', metadata: { subcontractorId: 'sub1' } },
  { id: 'cc5', type: 'subcontractor_insurance_expiry', title: 'Premier Plumbing — Liability insurance', dueDate: '2025-03-15', recordId: 'sub2', metadata: { subcontractorId: 'sub2' } },
]

/** Regulatory / compliance alerts (mock) */
export const MOCK_REGULATORY_ALERTS: { id: string; title: string; body: string; date: string; link?: string }[] = [
  { id: 'ra1', title: 'OSHA recordable criteria update', body: 'Review updated guidance for recordable injuries (effective Q2 2025).', date: '2025-02-01', link: '#' },
]

/** HR metrics — injury reports by month (for trend chart) */
export const MOCK_HR_INJURIES_BY_MONTH: { month: string; reported: number; closed: number }[] = [
  { month: 'Sep', reported: 2, closed: 2 },
  { month: 'Oct', reported: 1, closed: 1 },
  { month: 'Nov', reported: 3, closed: 2 },
  { month: 'Dec', reported: 2, closed: 3 },
  { month: 'Jan', reported: 4, closed: 2 },
  { month: 'Feb', reported: 2, closed: 0 },
]

/** HR metrics — form completion rate by week (for dashboard) */
export const MOCK_HR_FORMS_COMPLETION: { week: string; completed: number; due: number }[] = [
  { week: 'Week 1', completed: 12, due: 14 },
  { week: 'Week 2', completed: 15, due: 15 },
  { week: 'Week 3', completed: 11, due: 14 },
  { week: 'Week 4', completed: 14, due: 14 },
]

/** HR todo list — initial tasks for daily/weekly/monthly planning */
export const MOCK_HR_TODOS: HRTodoItem[] = [
  { id: 'ht1', title: 'Review open injury reports', recurrence: 'daily', dueDate: '2025-02-09', completed: false, createdAt: '2025-02-09T08:00:00Z', linkTo: '/injury-reports' },
  { id: 'ht2', title: 'Check certs expiring this week', recurrence: 'weekly', dueDate: '2025-02-09', completed: false, createdAt: '2025-02-07T09:00:00Z', linkTo: '/certificates' },
  { id: 'ht3', title: 'Monthly injury summary (OSHA 300)', recurrence: 'monthly', dueDate: '2025-02-28', completed: false, createdAt: '2025-02-01T10:00:00Z', linkTo: '/injury-reports/analytics' },
  { id: 'ht4', title: 'Follow up on overdue CAPA', recurrence: 'daily', dueDate: '2025-02-09', completed: true, completedAt: '2025-02-09T11:00:00Z', createdAt: '2025-02-08T14:00:00Z', linkTo: '/safety/corrective-actions' },
  { id: 'ht5', title: 'Subcontractor compliance check', recurrence: 'weekly', dueDate: '2025-02-09', completed: false, createdAt: '2025-02-03T09:00:00Z', linkTo: '/subcontractors' },
]

/** Audit log (who did what when) — for Admin */
export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'al1', at: '2025-02-09T14:00:00Z', by: 'Morgan Reed', action: 'Closed', entityType: 'injury', entityId: 'ir1', entityLabel: 'North Site — Laceration', linkTo: '/injury-reports/ir1' },
  { id: 'al2', at: '2025-02-09T11:30:00Z', by: 'Jordan Smith', action: 'Submitted', entityType: 'form', entityId: 'f1', entityLabel: 'Site Inspection', linkTo: '/forms/f1' },
  { id: 'al3', at: '2025-02-09T10:00:00Z', by: 'Morgan Reed', action: 'Updated document visibility', entityType: 'document', entityId: 'd1', entityLabel: 'Safety Handbook' },
  { id: 'al4', at: '2025-02-08T16:00:00Z', by: 'Alex Chen', action: 'Added root cause', entityType: 'injury', entityId: 'ir2', entityLabel: 'West Site', linkTo: '/injury-reports/ir2' },
  { id: 'al5', at: '2025-02-08T12:00:00Z', by: 'Morgan Reed', action: 'Requested cert renewal', entityType: 'subcontractor', entityId: 'sub1', entityLabel: 'ABC Electrical Ltd', linkTo: '/subcontractors/sub1' },
]

/** Site details (for site detail page) — derived from jobs */
export const MOCK_SITE_DETAILS: Site[] = [
  { id: 'site-north', name: 'North Site', jobId: 'job1', activeJobTitle: 'North Tower HVAC' },
  { id: 'site-west', name: 'West Site', jobId: 'job2', activeJobTitle: 'West Wing Electrical' },
  { id: 'site-east', name: 'East Site', jobId: 'job3', activeJobTitle: 'East Building Plumbing' },
]

/** Job templates for "Create from template" */
export const MOCK_JOB_TEMPLATES: JobTemplate[] = [
  { id: 'jt1', name: 'Standard HVAC', description: 'Typical HVAC installation job', defaultSiteName: 'North Site' },
  { id: 'jt2', name: 'Electrical fit-out', description: 'Electrical rough-in and finish', defaultSiteName: 'West Site' },
  { id: 'jt3', name: 'Plumbing package', description: 'Full plumbing scope', defaultSiteName: 'East Site' },
]

/** User last active (mock) — for Admin Users */
export const MOCK_USER_LAST_ACTIVE: Record<string, string> = {
  '1': '2025-02-09T13:45:00Z',
  '4': '2025-02-09T14:00:00Z',
  '2': '2025-02-09T12:30:00Z',
  '6': '2025-02-09T11:00:00Z',
  '7': '2025-02-08T17:00:00Z',
  '3': '2025-02-09T09:15:00Z',
  '5': '2025-02-08T16:00:00Z',
}

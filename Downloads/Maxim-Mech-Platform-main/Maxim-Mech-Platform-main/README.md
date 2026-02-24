# Maxim Mechanical Group — Internal Platform (SALUS-style prototype)

A **frontend-only** design concept and prototype for Maxim’s internal platform. The focus is **health, safety, and HR compliance**, with job/site management and forms; the product is built to expand over time. UI/UX only: no backend, no real auth, no API calls. Uses mock data throughout.

---

## Feature overview

| Area | Features |
|------|----------|
| **Roles & dashboards** | Owner, HR, Supervisor, Labourer with role switcher; role-specific dashboards (KPIs, charts, quick links) |
| **Forms & documents** | PDF templates with placed fields; Library with Templates / Submissions / Documents / Signing; upload PDF, place fields, assign by role or people |
| **PDF form editor** | Place text/date/signature fields on PDF; **drag to move**, **resize by corner handle**; delete via **X on overlay** or **Remove** in sidebar; **required-field red \***; **all templates editable** |
| **Daily forms** | **Supervisor fills and signs → can send to labourers to sign**; labourers see "Waiting for your signature" in Daily forms and Library → Signing; sign page to add signature |
| **Job management** | Jobs and sites; assign supervisors and labourers; **daily check-in/check-out with timestamps** (In at / Out at); **Reset** to clear mistaken check-in for today |
| **Injury reports** | **Injured person**, type, body part, mechanism, lost time, days away, WSIB; HR full edit; root cause analysis; **Injury analytics** (who was injured, by type/body part/mechanism/severity/site/month, repeat injurers, date range) |
| **Subcontractors** | List and detail; certs, insurance, contract, orientation, jobs, injuries; **HR full edit**; compliance calendar and notifications; notification click → subcontractor |
| **Safety & HR** | Incidents, near-miss, hazards, observations, CAPA, alerts, inspections, **Sites** (list + site detail), compliance calendar, regulatory reference, safety analytics |
| **HR Todo & calendar** | Todo list (Owner/HR): **daily**, **weekly**, **monthly** views; add tasks with **date** and **optional time**; complete/remove; **Open Google Calendar** and **Week view** links |
| **Google Sheets** | **Owner/HR**: Connect Google account, select spreadsheet, view/sync jobs from Sheets (mock integration) |
| **Admin** | Users, notifications (**Read all**, click notification → related form/task); **Audit log** (who did what when; filter by entity type); **Permissions** matrix (role × feature); document visibility, templates, signable forms |
| **UX** | Mobile-responsive (e.g. supervisor dashboard buttons stack on mobile); light/dark mode; **Frank AI assistant** (chat; mobile: full-width panel, FAB hidden when open so Send isn’t blocked); **pin Safety hub cards to sidebar** (Owner/HR); **presence / last opened / last edited** on documents, form review, subcontractor; Save as PDF |

---

## Roles

The app has four roles. The **role switcher** in the header (after login) lets you switch users to see different dashboards and navigation.

| Role | Description | Key access |
|------|-------------|------------|
| **Owner** | Full access; job/site and business focused | Everything HR can do, plus owner-level dashboards and job oversight |
| **HR** | Health, safety, and people operations | Injury reports (in depth), custom/signable forms, job management, **subcontractors**, document visibility, admin (users, templates, notifications) |
| **Supervisor** | Field and site supervision | My jobs, daily forms (sign/complete), assign labourers, check-in/check-out, form review |
| **Labourer** | Field workers | Daily forms assigned to them, forms list, documents (by visibility), signing requests |

- **Owner** and **HR** both see: Job management, **Todo & calendar**, Injury reports, Certificates (Safety & HR), **Subcontractors**, Admin (Users & settings, Notifications, Document visibility).
- **Supervisor** sees: My jobs, Daily forms; can review and approve form submissions.
- **Labourer** sees: Daily forms (assigned to them), Forms, Documents (if visible), Signing.

---

## Features

### Layout & UX

- **Mobile-first** responsive layout (scales to tablet and desktop)
- **Light and dark mode** toggle with persistent preference
- **Grouped sidebar** with SVG icons: Dashboard; Work (Job management, **Todo & calendar**, **Google Sheets**, My jobs, Daily forms); Forms & documents (single tab with filtering: Templates, Submissions, Documents, Signing); Safety & HR (Health & safety, Injury reports, Certificates, **Subcontractors**); Admin (Users & settings, Notifications, **Audit log**, **Permissions**, Document visibility); Search. **Pin Safety hub cards** (Owner/HR) to show quick links in the sidebar.
- **Save as PDF**: Document detail and document library can be printed/saved as PDF; submitted form review page has “Save as PDF” so only submission content is printed (no nav or action buttons)

### Dashboards

- **Owner** — Overview with quick links to jobs, injury reports, and admin
- **HR** — Clean layout: **At a glance** (leading indicators in one card: observations, hazards, overdue CAPA, certs expiring, compliance due, form completion %); **key metrics** in a single row (open injuries, active jobs, checked in today, forms pending, subcontractors) with **uniform-height boxes**; **injury trend** and **injury severity** charts; **quick access** (open injury reports + custom forms in one card); form completion chart at bottom. **Text links** in header (Health & safety, Injury analytics, Injury reports, Jobs, Forms, Subcontractors, Documents, **Todo & calendar**, **Google Calendar**) instead of many buttons.
- **Supervisor** — Pending daily forms, labourer signatures waiting, quick links to My jobs and daily forms. **Action buttons** (Daily forms to sign, New incident report, New site inspection) **stack full-width on mobile** for a clean layout.
- **Labourer** — Assigned daily forms, quick links to forms and documents

### Job management

- **Owner/HR**: Create jobs/sites; assign **multiple supervisors** per job; assign labourers and **subcontractors** to jobs
- **Supervisors**: “My jobs” lists jobs where they are assigned; on each job they can assign labourers and run **daily check-in / check-out** for each labourer. Each check-in shows **In at** and **Out at** timestamps. If they accidentally check someone in (or out), **Reset** clears that day's check-in so they can do it again.
- **Job detail** (Owner/HR) shows **Subcontractors on this job** with links to each subcontractor’s profile
- Labourers see their assignments via daily forms and context (no separate “job management” screen)

### HR Todo & calendar (Owner / HR)

- **Todo & calendar** — Under **Work** in the sidebar. Track tasks by **daily**, **weekly**, or **monthly** view. **Add task**: title, **due date**, **optional time** (e.g. 9:00 AM), and cadence (daily / weekly / monthly). Tasks can link to internal pages (e.g. injury reports, certificates). Mark complete or remove. Data is stored in the browser (localStorage).
- **Google Calendar** — **Open Google Calendar** and **Week view** open Google Calendar in a new tab. HR dashboard header includes links to **Todo & calendar** and **Google Calendar**.

### Google Sheets (Owner / HR)

- **Google Sheets** — Under **Work** in the sidebar. **Connect** with a Google account (mock), **select a spreadsheet** from your drive, then **view/sync jobs** from the sheet. Designed for HR to pull job data from email or spreadsheets into the platform. No live API; UI flow only.

### Forms & documents (single tab with filtering)

- **Library** — One place for **Templates**, **Submissions**, **Documents**, and **Signing**, with a view filter. Access to each section depends on role and assignment.
- **Templates** — Form templates (from uploaded PDFs). **Upload PDF (template)** (Owner/HR): upload a PDF, then place **fillable fields** (text, date, signature) on the document (DocuSign-style). **Place fields** by clicking on the page; **drag a field to move** it, **drag the corner handle to resize**; **delete** via the X on the field overlay (when selected) or the **Remove** button in the sidebar. Required fields show a **red \*** on the fill form. **All templates are editable** (each has an Edit button). Assign the template by **role** and/or **specific people**. Only templates you’re allowed to see are listed (Owner/HR see all; others see templates assigned to their role or to them).
- **Documents** — Same as templates in that everything is **uploaded to the system**; the only difference is that documents have **no fillable fields** — they are view-only (and distribution/visibility). Use **Upload document** (Owner/HR) to add a PDF with name, type, optional site, and visibility (everyone / restricted by role). Same upload flow as templates; no fields to enter.
- **Submissions** — Filled-out forms (draft / submitted / approved / awaiting site sign-offs). Labourers see only their own; reviewers see those they can approve. Submissions can be **saved as PDF** from the review screen.
- **Signing** — Signature requests and documents waiting for your signature (role-filtered). Includes **site meeting forms** that need your sign-off (see below).
- **Daily forms** — Signable forms assigned by role and/or person; due dates; supervisors and labourers see only forms assigned to them. **Supervisor flow:** After filling and signing, a supervisor can **send the form to their labourers to sign** (select who must sign); labourers then see it under **Forms & documents → Signing** and **Daily forms → Waiting for your signature**, and open a sign page to add their signature. Filling and signing creates a **submission**.
- **Document visibility** (Admin): Set docs to **everyone** or **restricted** (owner + HR + selected roles/users). Document detail has **Save as PDF**.

#### Site meeting form workflow

A special form type for health and safety: the **H&S rep** (or supervisor) fills out the form, then holds a **meeting with everyone on site**. Once everyone is good with it, **all personnel on site sign off** on that form; then it is **sent to HR**.

- **Start**: From **Safety** → **Site Safety Meeting** (or Library → Templates → start from “Site Safety Meeting” template). The rep fills the form and submits.
- **Phases**: (1) Filled by rep ✓ → (2) Site sign-offs (X of Y) → (3) Sent to HR. The form review screen shows the three phases and lists site personnel with signed/pending and timestamps.
- **Site personnel**: If you’re in the sign-off list and haven’t signed, you see **Sign as site personnel** on the form review page (and the form appears under Library → Signing).
- **Submit to HR**: When all site have signed, the rep can **Submit to HR**; status becomes submitted and an audit event “Sent to HR” is recorded.

### Incident reports, near-miss, and hazards (custom forms by HR)

- **Incident reports** use a **custom form template** (Incident Report, template id `t2`) created and edited by HR in **Admin** → **Templates**. From **Health & safety** → **Incident reports**, users see the list of submissions and a **Report incident** button that opens the template to fill out and submit. Same pattern for **near-miss** (template `t4`) and **hazards** (template `t5`): each has a dedicated list and “Report” opens the corresponding template.
- **Root cause analysis** — From an injury report detail (Owner/HR), **Add root cause analysis** opens a form for immediate cause, contributing causes, and underlying cause. Supports prevention and regulatory reporting. Edit existing analysis from the same page.
- **Hazard risk scoring** — Hazard template includes **risk likelihood** and **risk impact** (1–5). Submissions store these; the Hazard register list shows a **Risk** badge (low / medium / high / critical) computed from likelihood × impact.
- **Safety hub** (Health & safety): Cards link to **Incident reports**, **Site Safety Meeting**, **Hazard register**, **Near-miss reports**, **Safety observations**, **Scheduled inspections**, **Training & certifications** (→ Certificates), **Corrective & preventive actions (CAPA)**, **Safety alerts & bulletins**, **Sites** (list and site detail), **Compliance calendar**, **Regulatory reference**, **Safety analytics**, and **Scan site QR**. Owner/HR can **pin** any card to the sidebar for quick access. **Quick report** button opens a modal to capture type (incident / near-miss / hazard) and open the full form. All report types are template-based where applicable. Forms and reports have an audit trail; HR has final authority for approval and archival.
- **Admin** → **Templates**: HR creates and edits form templates with sections and text/textarea fields. Templates can show a **regulatory reference** (e.g. OSHA 301 / Provincial OHS equivalent). Submissions appear in Forms & documents and in the safety lists.
- **Frank AI assistant** — Chat bubble in header (and floating button on mobile). **Mobile:** When the chat is open, the floating button is hidden so it doesn’t block the Send button; chat panel is full-width with side margins so it isn’t cut off; warning text wraps.

### Injury reports

- **Owner/HR** only: List and in-depth injury report detail. Each report tracks **who was injured** (injured person name), **injury type** (laceration, strain, burn, etc.), **body part**, **mechanism** (struck-by, fall, overexertion, etc.), **date of injury**, **lost time**, **days away / restricted duty**, status, notes, follow-up, WSIB. HR can **edit all fields** on the detail page. When an injury involves a **subcontractor**, the detail page shows **Subcontractor** with a link to that company’s profile. From the detail page, **Add root cause analysis** (or edit existing) for immediate, contributing, and underlying causes.
- **Injury analytics** (Injury reports → Analytics & metrics): **Who was injured** table (name, count, type, body part, site, date, severity, link to report); **summary metrics** (total, open/closed, lost time, days away, restricted days, WSIB reported, repeat injurers); **by injury type**, **by body part**, **by mechanism**, **by severity**, **by site**, **by month**; **date range** filter (All time / YTD / 90 days). Linked from HR dashboard.

### Certificates & training (Safety & HR — Owner/HR)

- **Certificates** — Under **Safety & HR** in the sidebar. View and upload certificates (e.g. First Aid, Working at Heights, WHMIS) with **expiration dates**; HR uploads and manages. Certificates can be tagged **required for roles** (e.g. supervisor, labourer). When a certificate is close to expiration (within 30 days), the system **sends an email to HR**. List shows status: current, expiring soon, or expired.
- **Training & certifications** on the Safety hub links to this **Certificates** page. HR dashboard shows **Certificates expiring (30 days)** and **Compliance items due** (compliance calendar).

### Subcontractors (Safety & HR — Owner/HR)

- **Subcontractors** — Under **Safety & HR** in the sidebar. Track **subcontractor companies**: how many, who they are, and their **certifications with expiration dates**.
- **List page** — Summary cards: total subcontractors, active count, **certifications expiring (30 days)**. Table: company name, primary contact, status (active/inactive), certification summary (count, expiring soon, expired), and **View** to detail.
- **Detail page** — Company and status; **primary contact** (name, email, phone); **contract** (start/end, notes); **insurance** (policy number, expiry — with expired/expiring-soon badges); **site orientation** completed date; **certifications** table (name, issued, expires, status: current / expiring soon / expired); **jobs assigned** (links to job detail); **injury reports** involving this subcontractor (links to injury detail).
- **Compliance calendar** includes **subcontractor cert expiry** and **subcontractor insurance expiry** events with links to the subcontractor.
- **Notifications** — In-app notifications for “Subcontractor cert expiring” and “Subcontractor insurance expiry”; **clicking a notification** takes you to the related subcontractor (or form/task for other notification types). **Read all** in the notification dropdown marks all as read.
- **Job detail** (Owner/HR) shows a **Subcontractors on this job** card when subcontractors are assigned. **Injury report detail** shows **Subcontractor** with link when the injury involves a subcontractor.

### Safety alerts, observations, and corrective actions (CAPA)

- **Safety alerts & bulletins** — HR posts and manages alerts (create, edit, delete). List shows title, body, sites, published/expiry; HR sees **Create alert** and per-alert **Edit** / **Delete**.
- **Safety observations** — Positive and corrective observations by site. HR can add, edit, and delete entries.
- **Corrective & preventive actions (CAPA)** — **Corrective** = after an event; **preventive** = to prevent recurrence. From injury, incident, near-miss, or hazard. HR can add, edit, delete, set status (open / in-progress / completed), and assign to users. List has filter: All / Corrective / Preventive. Safety analytics includes a CAPA status pie chart.

### Sites (Owner / HR / Supervisor)

- **Sites** — Safety hub card links to a **Sites** list. Each **Site detail** page shows **active job**, **checked-in personnel**, **open hazards**, **recent incidents**, and **injury reports** at that site. Role-based: Owner, HR, and Supervisor can access.

### Inspections and compliance

- **Scheduled inspections** — Safety hub card links to a list of **upcoming/due inspections** (predefined checklists by site and frequency). **Start inspection** opens the Site Inspection form (t1). **Recent results** list completed inspections with pass/fail per item and link to result detail.
- **Compliance calendar** — Owner/HR: list of **compliance events** (certificate expirations, inspection due dates, report deadlines, **subcontractor cert expiry**, **subcontractor insurance expiry**). Events show type, due date, site, and link to certificates, inspections, or subcontractor detail. HR dashboard shows count of **Compliance items due**.
- **Regulatory reference** — Safety hub card: **Regulatory reference** page with short guidance on OSHA / provincial OHS and WSIB. **Form-to-requirement mapping**: templates can have a regulatory ref in Admin → Templates (e.g. OSHA 301).
- **Safety analytics** — Owner/HR: **Incident report trend** (submissions by month), **CAPA status** (pie: open / in progress / completed), **Injury reports trend** (reported vs closed by month).

### SOP and document management

- **SOP documents** — Documents with type **SOP** can have **tags** (site, role, hazard type) and **version**. On document detail, **SOP acknowledgement** section shows who has acknowledged; current user can click **I acknowledge** to record (mock). Supports re-acknowledgement when SOP version is updated.

### Admin (Owner / HR)

- **Users & settings** — Manage users (mock)
- **Notifications** — Notification settings (role-based email toggles; mock). Header **bell icon** opens an in-app notification dropdown (unread count, **Read all**, mark as read). **Clicking a notification** navigates to the related form, task, or page (e.g. form review, signing request, incidents, **subcontractor detail** for cert/insurance expiry).
- **Audit log** — View **who did what when**; filter by entity type (e.g. forms, injury reports, users). Supports compliance and traceability.
- **Permissions** — **Permissions matrix** (role × feature reference) for at-a-glance view of what each role can access.
- **Document visibility** — Upload docs and set who can view (everyone vs restricted; roles and specific users)
- **Signable forms** — Custom forms to sign (no PDF); assign by role and/or specific users. PDF-based templates are created via **Forms & documents** → Upload PDF.
- **Templates** — Form templates (mock); HR edits Incident Report, Near-miss, Hazard, and other custom form templates. Templates can display a **regulatory reference** (e.g. OSHA 301). Version history and compliance calendar support are in place for future expansion.

### Mobile and field UX

- **Quick report** — On the Safety hub, **Quick report** opens a modal to choose type (incident / near-miss / hazard), optional site and description, then **Open full form** navigates to the corresponding template.
- **Offline banner** — When the browser is offline, a banner appears: “You appear to be offline. Drafts will sync when back online.” (UI only; no persistence yet.)
- **Scan site QR** — Safety hub card links to a **QR scan** placeholder screen (camera placeholder). In production this would use the device camera for site QR codes (e.g. pre-start checklist).

### Research-based additions (EHS / HR compliance)

The following were added to align with industry EHS and HR compliance practices: **root cause analysis** (injury/incident), **risk scoring** on hazards (likelihood × impact), **CAPA** (corrective and preventive actions with filter), **scheduled inspections** and result detail, **compliance calendar** and **regulatory reference** page, **SOP** documents with tags and **acknowledgement tracking**, **safety analytics** (incident trend, CAPA status, injury metrics), **Quick report** and **offline** banner, **QR scan** placeholder, **certificate required-for-roles** and **expiry/compliance** cards on the HR dashboard, **regulatory ref** on form templates, and **subcontractors** (company list, certifications and expiration, insurance, contract and orientation, job assignments, injury linkage, compliance calendar and notifications).

### Presence and multi-user awareness

- **Documents**, **form review**, and **subcontractor detail** can show **who is currently viewing** and **last opened / last edited** (with timestamp and user name). HR can see when others have the same item open or when it was last changed.

### Additional features (extended)

- **Reporting & export**: **Export CSV** on Injury reports and CAPA lists; **Print / Save as PDF** on HR dashboard; **Schedule weekly report** (mock) link.
- **Search**: **Type filter** (All / Documents / Submissions / Incidents) on Global search.
- **Breadcrumbs**: Injury report detail, Subcontractor detail (and other deep pages) show breadcrumb navigation.
- **Labourer dashboard**: **Today** heading; **Quick actions**: Report incident, Report near-miss, Report hazard.
- **Sites**: **Sites** card on Safety hub → list of sites → **Site detail** page (active job, checked-in personnel, open hazards, recent incidents, injury reports at site). Owner/HR/Supervisor.
- **Job templates**: **Create from template** dropdown on Job management (e.g. Standard HVAC, Electrical fit-out) pre-fills title and site.
- **Subcontractors**: **Compliance score** (Good / Attention needed / Non-compliant) and **Pre-qualification checklist** (mock) on detail; **Request cert renewal** (mock).
- **Injury reports**: **DART** and **TRIR** (mock) on Injury analytics; **Trend alert** on HR dashboard when there are open injuries; optional **photo** (scene/injury) on report detail.
- **HR Todo**: **Overdue** highlight and badge; **Add to Google Calendar** link per task (opens pre-filled event); **Print / Save as PDF** and **Schedule weekly report** on HR dashboard.
- **Admin**: **Audit log** (who did what when; filter by entity type); **Permissions** matrix (role × feature reference); **Last active** on Users list (mock).
- **UX**: **Keyboard shortcut** **?** to show shortcuts overlay; **Empty states** where applicable.
- **Frank**: Ask **"How many open injuries?"** (HR/Owner) for live count; **"Add to my todo"** or **"Remind me …"** to add a task to Todo & calendar (HR/Owner).

### Technical notes

- **Location** on form submit is captured for HR but not shown to the submitter (no “geo-tagged” or location message in the submit flow)
- **Print styles**: Header, sidebar, mobile nav, and FAB use `no-print` so only main content is included when saving as PDF
- **Add fields on PDF** (form template editor): The document preview and field labels use a consistent light “paper” look with dark text so they remain readable in both light and dark mode

---

## Tech stack

- React 18 + TypeScript
- Vite
- React Router v6
- Tailwind CSS (custom design tokens, blue/white brand palette)
- Recharts (HR dashboard charts)

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use any email to “log in” (mock). Then use the **role badge** in the header to switch between Owner, HR, Supervisor, and Labourer to see different dashboards and nav items.

---

## Build

```bash
npm run build
npm run preview   # preview production build
```

---

## Design

- Brand colours: blue and white with neutral supporting tones
- Typography: DM Sans (body), Outfit (headings)
- Touch-friendly controls (min 44px), clear hierarchy, accessible contrast in both themes

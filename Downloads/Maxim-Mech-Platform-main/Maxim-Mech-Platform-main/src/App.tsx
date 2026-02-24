import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { FrankChat } from '@/components/frank/FrankChat'
import { Login } from '@/pages/Login'
import { DashboardOwner } from '@/pages/dashboards/DashboardOwner'
import { DashboardHR } from '@/pages/dashboards/DashboardHR'
import { DashboardSupervisor } from '@/pages/dashboards/DashboardSupervisor'
import { DashboardLabourer } from '@/pages/dashboards/DashboardLabourer'
import { Library } from '@/pages/library/Library'
import { LibraryUpload } from '@/pages/library/LibraryUpload'
import { LibraryDocumentUpload } from '@/pages/library/LibraryDocumentUpload'
import { FormFill } from '@/pages/forms/FormFill'
import { FormReview } from '@/pages/forms/FormReview'
import { SigningRequest } from '@/pages/signing/SigningRequest'
import { SignatureCapture } from '@/pages/signing/SignatureCapture'
import { DocumentDetail } from '@/pages/documents/DocumentDetail'
import { GlobalSearch } from '@/pages/search/GlobalSearch'
import { SearchResultDetail } from '@/pages/search/SearchResultDetail'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminTemplates } from '@/pages/admin/AdminTemplates'
import { AdminNotifications } from '@/pages/admin/AdminNotifications'
import { AdminSignableForms } from '@/pages/admin/AdminSignableForms'
import { AdminDocuments } from '@/pages/admin/AdminDocuments'
import { AdminCertificates } from '@/pages/admin/AdminCertificates'
import { FormFromPdfEditor } from '@/pages/admin/FormFromPdfEditor'
import { DailyForms } from '@/pages/daily-forms/DailyForms'
import { FillSignableForm } from '@/pages/daily-forms/FillSignableForm'
import { SignSignableForm } from '@/pages/daily-forms/SignSignableForm'
import { JobManagement } from '@/pages/jobs/JobManagement'
import { JobDetail } from '@/pages/jobs/JobDetail'
import { MyJobs } from '@/pages/jobs/MyJobs'
import { SubcontractorsList } from '@/pages/subcontractors/SubcontractorsList'
import { SubcontractorDetail } from '@/pages/subcontractors/SubcontractorDetail'
import { InjuryReports } from '@/pages/injury-reports/InjuryReports'
import { InjuryReportDetail } from '@/pages/injury-reports/InjuryReportDetail'
import { InjuryAnalytics } from '@/pages/injury-reports/InjuryAnalytics'
import { RootCauseForm } from '@/pages/injury-reports/RootCauseForm'
import { SafetyHub } from '@/pages/safety/SafetyHub'
import { IncidentReportsList } from '@/pages/safety/IncidentReportsList'
import { HazardsList } from '@/pages/safety/HazardsList'
import { NearMissList } from '@/pages/safety/NearMissList'
import { SafetyObservationsList } from '@/pages/safety/SafetyObservationsList'
import { CorrectiveActionsList } from '@/pages/safety/CorrectiveActionsList'
import { SafetyAlertsList } from '@/pages/safety/SafetyAlertsList'
import { ScheduledInspections } from '@/pages/safety/ScheduledInspections'
import { InspectionResultDetail } from '@/pages/safety/InspectionResultDetail'
import { ComplianceCalendar } from '@/pages/safety/ComplianceCalendar'
import { RegulationsReference } from '@/pages/safety/RegulationsReference'
import { SafetyAnalytics } from '@/pages/safety/SafetyAnalytics'
import { QRScanPlaceholder } from '@/pages/safety/QRScanPlaceholder'
import { GoogleSheetsConnect } from '@/pages/sheets/GoogleSheetsConnect'
import { GoogleSheetsSpreadsheets } from '@/pages/sheets/GoogleSheetsSpreadsheets'
import { GoogleSheetsJobs } from '@/pages/sheets/GoogleSheetsJobs'
import { HRTodoList } from '@/pages/hr/HRTodoList'
import { AuditLog } from '@/pages/admin/AuditLog'
import { AdminPermissions } from '@/pages/admin/AdminPermissions'
import { SessionManagement } from '@/pages/admin/SessionManagement'
import { SitesList } from '@/pages/safety/SitesList'
import { SiteDetail } from '@/pages/safety/SiteDetail'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useUser()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function DashboardRouter() {
  const { user } = useUser()
  if (!user) return null
  if (user.role === 'owner') return <DashboardOwner />
  if (user.role === 'hr') return <DashboardHR />
  if (user.role === 'supervisor') return <DashboardSupervisor />
  return <DashboardLabourer />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRouter />} />
          <Route path="library" element={<Library />} />
          <Route path="library/upload" element={<ProtectedRoute roles={['owner', 'hr']}><LibraryUpload /></ProtectedRoute>} />
          <Route path="library/upload-document" element={<ProtectedRoute roles={['owner', 'hr']}><LibraryDocumentUpload /></ProtectedRoute>} />
          <Route path="library/template/:pdfId/edit" element={<ProtectedRoute roles={['owner', 'hr']}><FormFromPdfEditor /></ProtectedRoute>} />
          <Route path="forms" element={<Navigate to="/library?view=submissions" replace />} />
          <Route path="forms/new" element={<FormFill />} />
          <Route path="forms/new/:templateId" element={<FormFill />} />
          <Route path="forms/:id" element={<FormReview />} />
          <Route path="signing" element={<Navigate to="/library?view=signing" replace />} />
          <Route path="signing/:id" element={<SigningRequest />} />
          <Route path="signing/:id/sign" element={<SignatureCapture />} />
          <Route path="documents" element={<Navigate to="/library?view=documents" replace />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route path="daily-forms" element={<DailyForms />} />
          <Route path="daily-forms/fill/:dailyFormId" element={<FillSignableForm />} />
          <Route path="daily-forms/sign/:submissionId" element={<SignSignableForm />} />
          <Route path="admin/scanned-forms" element={<Navigate to="/library?view=templates" replace />} />
          <Route path="jobs" element={<ProtectedRoute roles={['owner', 'hr']}><JobManagement /></ProtectedRoute>} />
          <Route path="jobs/:id" element={<ProtectedRoute roles={['owner', 'hr', 'supervisor']}><JobDetail /></ProtectedRoute>} />
          <Route path="my-jobs" element={<ProtectedRoute roles={['supervisor']}><MyJobs /></ProtectedRoute>} />
          <Route path="subcontractors" element={<ProtectedRoute roles={['owner', 'hr']}><SubcontractorsList /></ProtectedRoute>} />
          <Route path="subcontractors/:id" element={<ProtectedRoute roles={['owner', 'hr']}><SubcontractorDetail /></ProtectedRoute>} />
          <Route path="injury-reports" element={<ProtectedRoute roles={['owner', 'hr']}><InjuryReports /></ProtectedRoute>} />
          <Route path="injury-reports/analytics" element={<ProtectedRoute roles={['owner', 'hr']}><InjuryAnalytics /></ProtectedRoute>} />
          <Route path="injury-reports/:id" element={<ProtectedRoute roles={['owner', 'hr']}><InjuryReportDetail /></ProtectedRoute>} />
          <Route path="injury-reports/:id/root-cause" element={<ProtectedRoute roles={['owner', 'hr']}><RootCauseForm /></ProtectedRoute>} />
          <Route path="safety" element={<SafetyHub />} />
          <Route path="safety/incidents" element={<IncidentReportsList />} />
          <Route path="safety/hazards" element={<HazardsList />} />
          <Route path="safety/near-miss" element={<NearMissList />} />
          <Route path="safety/observations" element={<SafetyObservationsList />} />
          <Route path="safety/training" element={<Navigate to="/certificates" replace />} />
          <Route path="safety/corrective-actions" element={<ProtectedRoute roles={['owner', 'hr']}><CorrectiveActionsList /></ProtectedRoute>} />
          <Route path="safety/alerts" element={<SafetyAlertsList />} />
          <Route path="safety/inspections" element={<ScheduledInspections />} />
          <Route path="safety/inspections/result/:id" element={<InspectionResultDetail />} />
          <Route path="safety/compliance-calendar" element={<ProtectedRoute roles={['owner', 'hr']}><ComplianceCalendar /></ProtectedRoute>} />
          <Route path="safety/regulations" element={<RegulationsReference />} />
          <Route path="safety/analytics" element={<ProtectedRoute roles={['owner', 'hr']}><SafetyAnalytics /></ProtectedRoute>} />
          <Route path="safety/qr-scan" element={<QRScanPlaceholder />} />
          <Route path="safety/sites" element={<ProtectedRoute roles={['owner', 'hr', 'supervisor']}><SitesList /></ProtectedRoute>} />
          <Route path="safety/sites/:id" element={<ProtectedRoute roles={['owner', 'hr', 'supervisor']}><SiteDetail /></ProtectedRoute>} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="search/:type/:id" element={<SearchResultDetail />} />
          <Route path="admin" element={<ProtectedRoute roles={['owner', 'hr']}><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute roles={['owner', 'hr']}><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/templates" element={<ProtectedRoute roles={['owner', 'hr']}><AdminTemplates /></ProtectedRoute>} />
          <Route path="admin/signable-forms" element={<ProtectedRoute roles={['owner', 'hr']}><AdminSignableForms /></ProtectedRoute>} />
          <Route path="admin/documents" element={<ProtectedRoute roles={['owner', 'hr']}><AdminDocuments /></ProtectedRoute>} />
          <Route path="admin/notifications" element={<ProtectedRoute roles={['owner', 'hr']}><AdminNotifications /></ProtectedRoute>} />
          <Route path="admin/audit-log" element={<ProtectedRoute roles={['owner', 'hr']}><AuditLog /></ProtectedRoute>} />
          <Route path="admin/permissions" element={<ProtectedRoute roles={['owner', 'hr']}><AdminPermissions /></ProtectedRoute>} />
          <Route path="admin/sessions" element={<ProtectedRoute roles={['owner', 'hr']}><SessionManagement /></ProtectedRoute>} />
          <Route path="certificates" element={<ProtectedRoute roles={['owner', 'hr']}><AdminCertificates /></ProtectedRoute>} />
          <Route path="hr/todo" element={<ProtectedRoute roles={['owner', 'hr']}><HRTodoList /></ProtectedRoute>} />
          <Route path="sheets" element={<ProtectedRoute roles={['owner', 'hr']}><Navigate to="/sheets/connect" replace /></ProtectedRoute>} />
          <Route path="sheets/connect" element={<ProtectedRoute roles={['owner', 'hr']}><GoogleSheetsConnect /></ProtectedRoute>} />
          <Route path="sheets/select" element={<ProtectedRoute roles={['owner', 'hr']}><GoogleSheetsSpreadsheets /></ProtectedRoute>} />
          <Route path="sheets/jobs" element={<ProtectedRoute roles={['owner', 'hr']}><GoogleSheetsJobs /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FrankChat />
    </>
  )
}

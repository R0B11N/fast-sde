import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useSubcontractors } from '@/contexts/SubcontractorsContext'
import { usePresence } from '@/contexts/PresenceContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { EditingPresence } from '@/components/EditingPresence'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MOCK_JOBS } from '@/data/mock'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'
import type { Subcontractor } from '@/types'

function emptyEditForm(sub: Subcontractor) {
  return {
    companyName: sub.companyName,
    status: sub.status,
    primaryContactName: sub.primaryContactName,
    primaryContactEmail: sub.primaryContactEmail,
    primaryContactPhone: sub.primaryContactPhone ?? '',
    contractStart: sub.contractStart,
    contractEnd: sub.contractEnd ?? '',
    notes: sub.notes ?? '',
    insurancePolicyNumber: sub.insurancePolicyNumber ?? '',
    insuranceExpiry: sub.insuranceExpiry ?? '',
    orientationCompletedAt: sub.orientationCompletedAt ?? '',
  }
}

export function SubcontractorDetail() {
  const { id } = useParams()
  const { user } = useUser()
  const {
    subcontractors,
    certifications,
    jobAssignments,
    updateSubcontractor,
    addCertification,
    updateCertification,
    removeCertification,
    addJobAssignment,
    removeJobAssignment,
    personnel,
    personnelCertifications,
    personnelJobAssignments,
    personnelCheckIns,
    addPersonnel,
    updatePersonnel,
    removePersonnel,
    addPersonnelCertification,
    removePersonnelCertification,
    addPersonnelJobAssignment,
    removePersonnelJobAssignment,
  } = useSubcontractors()
  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'
  const sub = id ? subcontractors.find((s) => s.id === id) : undefined
  const certs = sub ? certifications.filter((c) => c.subcontractorId === sub.id) : []
  const jobAssignmentsForSub = sub ? jobAssignments.filter((a) => a.subcontractorId === sub.id) : []
  const jobs = jobAssignmentsForSub
    .map((a) => MOCK_JOBS.find((j) => j.id === a.jobId))
    .filter(Boolean) as typeof MOCK_JOBS
  const { reports: injuryReports } = useInjuryReports()
  const injuries = sub ? injuryReports.filter((r) => r.subcontractorId === sub.id) : []
  const { getPresence, addPresence, removePresence } = usePresence()
  const currentlyViewing = id ? getPresence('subcontractor', id) : []

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(emptyEditForm(sub!))
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [certForm, setCertForm] = useState({ name: '', issuedAt: '', expiresAt: '' })
  const [newCert, setNewCert] = useState({ name: '', issuedAt: '', expiresAt: '' })
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null)
  const [personnelForm, setPersonnelForm] = useState({ name: '', email: '' })
  const [newPersonnel, setNewPersonnel] = useState({ name: '', email: '' })
  const [addingCertForPersonnelId, setAddingCertForPersonnelId] = useState<string | null>(null)
  const [newPersonnelCert, setNewPersonnelCert] = useState({ name: '', issuedAt: '', expiresAt: '' })

  useEffect(() => {
    if (sub) setForm(emptyEditForm(sub))
  }, [sub?.id, isEditing])

  useEffect(() => {
    if (!id || !user) return
    addPresence('subcontractor', id, { id: user.id, name: user.name })
    updateSubcontractor(id, { lastOpenedAt: new Date().toISOString(), lastOpenedBy: user.name })
    return () => removePresence('subcontractor', id, user.id)
  }, [id, user?.id])

  if (!isOwnerOrHr) return null
  if (!sub) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Subcontractors', to: '/subcontractors' }, { label: 'Not found' }]} />
        <p className="text-neutral-500 dark:text-neutral-400">Subcontractor not found.</p>
        <Link to="/subcontractors" className="text-brand-600 dark:text-brand-400 hover:underline">
          Back to subcontractors
        </Link>
      </div>
    )
  }

  const handleSave = () => {
    const now = new Date().toISOString()
    updateSubcontractor(sub.id, {
      companyName: form.companyName.trim(),
      status: form.status,
      primaryContactName: form.primaryContactName.trim(),
      primaryContactEmail: form.primaryContactEmail.trim(),
      primaryContactPhone: form.primaryContactPhone.trim() || undefined,
      contractStart: form.contractStart,
      contractEnd: form.contractEnd.trim() || undefined,
      notes: form.notes.trim() || undefined,
      insurancePolicyNumber: form.insurancePolicyNumber.trim() || undefined,
      insuranceExpiry: form.insuranceExpiry.trim() || undefined,
      orientationCompletedAt: form.orientationCompletedAt.trim()
        ? new Date(form.orientationCompletedAt.trim()).toISOString()
        : undefined,
      lastEditedAt: now,
      lastEditedBy: user?.name,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setForm(emptyEditForm(sub))
    setEditingCertId(null)
    setNewCert({ name: '', issuedAt: '', expiresAt: '' })
    setEditingPersonnelId(null)
    setNewPersonnel({ name: '', email: '' })
    setAddingCertForPersonnelId(null)
    setNewPersonnelCert({ name: '', issuedAt: '', expiresAt: '' })
    setIsEditing(false)
  }

  const handleSavePersonnel = (personnelId: string) => {
    updatePersonnel(personnelId, { name: personnelForm.name.trim(), email: personnelForm.email.trim() || undefined })
    setEditingPersonnelId(null)
  }

  const handleAddPersonnel = () => {
    if (!newPersonnel.name.trim()) return
    addPersonnel({
      subcontractorId: sub.id,
      name: newPersonnel.name.trim(),
      email: newPersonnel.email.trim() || undefined,
    })
    setNewPersonnel({ name: '', email: '' })
  }

  const handleAddPersonnelCert = (personnelId: string) => {
    if (!newPersonnelCert.name.trim() || !newPersonnelCert.issuedAt || !newPersonnelCert.expiresAt) return
    addPersonnelCertification({
      personnelId,
      name: newPersonnelCert.name.trim(),
      issuedAt: newPersonnelCert.issuedAt,
      expiresAt: newPersonnelCert.expiresAt,
    })
    setAddingCertForPersonnelId(null)
    setNewPersonnelCert({ name: '', issuedAt: '', expiresAt: '' })
  }

  const handleSaveCert = (certId: string) => {
    updateCertification(certId, {
      name: certForm.name.trim(),
      issuedAt: certForm.issuedAt,
      expiresAt: certForm.expiresAt,
    })
    setEditingCertId(null)
  }

  const handleAddCert = () => {
    if (!newCert.name.trim() || !newCert.issuedAt || !newCert.expiresAt) return
    addCertification({
      subcontractorId: sub.id,
      name: newCert.name.trim(),
      issuedAt: newCert.issuedAt,
      expiresAt: newCert.expiresAt,
    })
    setNewCert({ name: '', issuedAt: '', expiresAt: '' })
  }

  const assignedJobIds = jobAssignmentsForSub.map((a) => a.jobId)
  const availableJobs = MOCK_JOBS.filter((j) => !assignedJobIds.includes(j.id))

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Subcontractors', to: '/subcontractors' }, { label: sub.companyName }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/subcontractors"
            className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            {!isEditing ? (
              <>
                <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">
                  {sub.companyName}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  <Badge variant={sub.status === 'active' ? 'success' : 'default'}>{sub.status}</Badge>
                </p>
              </>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <Input
                  label="Company name"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="min-w-[200px]"
                />
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                    className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          </div>
        )}
      </div>

      <EditingPresence
        currentlyViewing={currentlyViewing}
        lastOpenedAt={sub.lastOpenedAt}
        lastOpenedBy={sub.lastOpenedBy}
        lastEditedAt={sub.lastEditedAt}
        lastEditedBy={sub.lastEditedBy}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader className="text-base">Compliance score</CardHeader>
          <CardDescription>Overall compliance health (certs + insurance)</CardDescription>
          {(() => {
            const hasExpired = certs.some((c) => c.status === 'expired') || (sub.insuranceExpiry && sub.insuranceExpiry < new Date().toISOString().slice(0, 10))
            const hasExpiringSoon = certs.some((c) => c.status === 'expiring-soon') || (sub.insuranceExpiry && sub.insuranceExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
            const score = hasExpired ? 'red' : hasExpiringSoon ? 'amber' : 'green'
            return (
              <div className="mt-3 flex items-center gap-3">
                <span className={`inline-flex h-12 w-12 rounded-full items-center justify-center text-lg font-bold ${score === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : score === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {score === 'green' ? '✓' : score === 'amber' ? '!' : '✕'}
                </span>
                <span className="font-medium text-neutral-900 dark:text-white">{score === 'green' ? 'Good' : score === 'amber' ? 'Attention needed' : 'Non-compliant'}</span>
              </div>
            )
          })()}
        </Card>
        <Card padding="md">
          <CardHeader className="text-base">Pre-qualification checklist</CardHeader>
          <CardDescription>Before marking active (mock)</CardDescription>
          <ul className="mt-3 space-y-2 text-sm">
            {['Insurance received', 'Certs received', 'Orientation scheduled', 'Contract signed'].map((label, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => alert('Request certificate renewal would be sent (mock).')}>Request cert renewal</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="lg">
          <CardHeader>Primary contact</CardHeader>
          {!isEditing ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-medium text-neutral-900 dark:text-white">{sub.primaryContactName}</p>
              <p className="text-neutral-600 dark:text-neutral-400">
                <a href={`mailto:${sub.primaryContactEmail}`} className="text-brand-600 dark:text-brand-400 hover:underline">
                  {sub.primaryContactEmail}
                </a>
              </p>
              {sub.primaryContactPhone && (
                <p className="text-neutral-600 dark:text-neutral-400">{sub.primaryContactPhone}</p>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <Input
                label="Contact name"
                value={form.primaryContactName}
                onChange={(e) => setForm((f) => ({ ...f, primaryContactName: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={form.primaryContactEmail}
                onChange={(e) => setForm((f) => ({ ...f, primaryContactEmail: e.target.value }))}
              />
              <Input
                label="Phone"
                value={form.primaryContactPhone}
                onChange={(e) => setForm((f) => ({ ...f, primaryContactPhone: e.target.value }))}
              />
            </div>
          )}
        </Card>

        <Card padding="lg">
          <CardHeader>Contract</CardHeader>
          {!isEditing ? (
            <div className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
              <p>Start: {sub.contractStart}</p>
              <p>End: {sub.contractEnd ?? '—'}</p>
              {sub.notes && (
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">{sub.notes}</p>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <Input
                label="Contract start"
                type="date"
                value={form.contractStart}
                onChange={(e) => setForm((f) => ({ ...f, contractStart: e.target.value }))}
              />
              <Input
                label="Contract end"
                type="date"
                value={form.contractEnd}
                onChange={(e) => setForm((f) => ({ ...f, contractEnd: e.target.value }))}
              />
              <Input
                label="Notes / site preference"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Preferred for North and East sites."
              />
            </div>
          )}
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader>Insurance</CardHeader>
        <CardDescription>Liability / WSIB — expiry triggers compliance reminders.</CardDescription>
        {!isEditing ? (
          <div className="mt-2 space-y-1 text-sm">
            {(sub.insurancePolicyNumber ?? sub.insuranceExpiry) ? (
              <>
                {sub.insurancePolicyNumber && (
                  <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Policy:</span> {sub.insurancePolicyNumber}</p>
                )}
                {sub.insuranceExpiry && (
                  <p>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Expires:</span>{' '}
                    {sub.insuranceExpiry}
                    {new Date(sub.insuranceExpiry) <= new Date() && (
                      <Badge variant="danger" className="ml-2">Expired</Badge>
                    )}
                    {new Date(sub.insuranceExpiry) > new Date() &&
                      new Date(sub.insuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                        Expiring soon
                      </Badge>
                    )}
                  </p>
                )}
              </>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400">No insurance on file.</p>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <Input
              label="Policy number"
              value={form.insurancePolicyNumber}
              onChange={(e) => setForm((f) => ({ ...f, insurancePolicyNumber: e.target.value }))}
              placeholder="e.g. LIAB-ABC-001"
            />
            <Input
              label="Expires"
              type="date"
              value={form.insuranceExpiry}
              onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
            />
          </div>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>Site orientation</CardHeader>
        {!isEditing ? (
          sub.orientationCompletedAt ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Completed {new Date(sub.orientationCompletedAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Not completed</p>
          )
        ) : (
          <div className="mt-2">
            <Input
              label="Completed date"
              type="datetime-local"
              value={form.orientationCompletedAt ? form.orientationCompletedAt.slice(0, 16) : ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  orientationCompletedAt: e.target.value ? new Date(e.target.value).toISOString() : '',
                }))
              }
            />
            <p className="text-xs text-neutral-500 mt-1">Leave empty if not yet completed.</p>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>Certifications</CardHeader>
        <CardDescription>Certifications and expiration dates for this subcontractor.</CardDescription>
        <div className="mt-4 overflow-x-auto">
          {certs.length === 0 && !isEditing ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No certifications on file.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Name</th>
                  <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Issued</th>
                  <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Expires</th>
                  <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                  {isEditing && <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400"></th>}
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    {editingCertId === c.id ? (
                      <>
                        <td className="py-2 pr-2">
                          <input
                            aria-label="Certification name"
                            value={certForm.name}
                            onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full min-h-[36px] px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="date"
                            aria-label="Issued date"
                            value={certForm.issuedAt}
                            onChange={(e) => setCertForm((f) => ({ ...f, issuedAt: e.target.value }))}
                            className="min-h-[36px] px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="date"
                            aria-label="Expires date"
                            value={certForm.expiresAt}
                            onChange={(e) => setCertForm((f) => ({ ...f, expiresAt: e.target.value }))}
                            className="min-h-[36px] px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="py-2 pr-2 text-neutral-500 text-sm">—</td>
                        <td className="py-2 pr-2">
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleSaveCert(c.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCertId(null)}>Cancel</Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-white">{c.name}</td>
                        <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-400">{c.issuedAt}</td>
                        <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-400">{c.expiresAt}</td>
                        <td className="py-3 pr-4">
                          {c.status === 'expired' && <Badge variant="danger">Expired</Badge>}
                          {c.status === 'expiring-soon' && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                              Expiring soon
                            </Badge>
                          )}
                          {c.status === 'current' && <Badge variant="success">Current</Badge>}
                        </td>
                        {isEditing && (
                          <td className="py-3 pr-4">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCertId(c.id)
                                  setCertForm({ name: c.name, issuedAt: c.issuedAt, expiresAt: c.expiresAt })
                                }}
                              >
                                Edit
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => removeCertification(c.id)}>
                                Remove
                              </Button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-end gap-3">
            <Input
              label="Name"
              value={newCert.name}
              onChange={(e) => setNewCert((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Working at Heights"
              className="min-w-[180px]"
            />
            <Input
              label="Issued"
              type="date"
              value={newCert.issuedAt}
              onChange={(e) => setNewCert((f) => ({ ...f, issuedAt: e.target.value }))}
            />
            <Input
              label="Expires"
              type="date"
              value={newCert.expiresAt}
              onChange={(e) => setNewCert((f) => ({ ...f, expiresAt: e.target.value }))}
            />
            <Button onClick={handleAddCert} disabled={!newCert.name.trim() || !newCert.issuedAt || !newCert.expiresAt}>
              Add certification
            </Button>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>Contractor personnel</CardHeader>
        <CardDescription>People who work for this contractor. Add workers here, then assign them to jobs below.</CardDescription>
        {(() => {
          const subPersonnel = personnel.filter((p) => p.subcontractorId === sub.id)
          return (
            <div className="mt-4 space-y-4">
              {subPersonnel.length === 0 && !isEditing && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No personnel added yet.</p>
              )}
              <ul className="space-y-3">
                {subPersonnel.map((p) => {
                  const personCerts = personnelCertifications.filter((c) => c.personnelId === p.id)
                  const isEditingThis = editingPersonnelId === p.id
                  const isAddingCert = addingCertForPersonnelId === p.id
                  return (
                    <li key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-neutral-50/50 dark:bg-neutral-800/50 p-3">
                      {isEditingThis ? (
                        <div className="flex flex-wrap items-end gap-3">
                          <Input label="Name" value={personnelForm.name} onChange={(e) => setPersonnelForm((f) => ({ ...f, name: e.target.value }))} className="min-w-[180px]" />
                          <Input label="Email" type="email" value={personnelForm.email} onChange={(e) => setPersonnelForm((f) => ({ ...f, email: e.target.value }))} className="min-w-[200px]" />
                          <Button size="sm" onClick={() => handleSavePersonnel(p.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingPersonnelId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-neutral-900 dark:text-white">{p.name}</span>
                            {p.email && <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.email}</p>}
                            {personCerts.length > 0 && (
                              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                Certifications:{' '}
                                {personCerts.map((c) => (
                                  <span key={c.id} className="inline-flex items-center gap-1 mr-2">
                                    <span>{c.name}</span>
                                    {isEditing && (
                                      <button type="button" onClick={() => removePersonnelCertification(c.id)} className="text-red-600 dark:text-red-400 hover:underline" aria-label={`Remove ${c.name}`}>
                                        Remove
                                      </button>
                                    )}
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                          {isEditing && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setEditingPersonnelId(p.id); setPersonnelForm({ name: p.name, email: p.email ?? '' }) }}>Edit</Button>
                              <Button size="sm" variant="ghost" onClick={() => removePersonnel(p.id)}>Remove</Button>
                            </div>
                          )}
                        </div>
                      )}
                      {isEditing && !isEditingThis && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                          {!isAddingCert ? (
                            <Button size="sm" variant="secondary" onClick={() => setAddingCertForPersonnelId(p.id)}>Add certification for this person</Button>
                          ) : (
                            <div className="flex flex-wrap items-end gap-2">
                              <Input label="Certification" value={newPersonnelCert.name} onChange={(e) => setNewPersonnelCert((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Working at Heights" className="min-w-[160px]" />
                              <Input label="Issued" type="date" value={newPersonnelCert.issuedAt} onChange={(e) => setNewPersonnelCert((f) => ({ ...f, issuedAt: e.target.value }))} />
                              <Input label="Expires" type="date" value={newPersonnelCert.expiresAt} onChange={(e) => setNewPersonnelCert((f) => ({ ...f, expiresAt: e.target.value }))} />
                              <Button size="sm" onClick={() => handleAddPersonnelCert(p.id)} disabled={!newPersonnelCert.name.trim() || !newPersonnelCert.issuedAt || !newPersonnelCert.expiresAt}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setAddingCertForPersonnelId(null); setNewPersonnelCert({ name: '', issuedAt: '', expiresAt: '' }) }}>Cancel</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
              {isEditing && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-end gap-3">
                  <Input label="Name" value={newPersonnel.name} onChange={(e) => setNewPersonnel((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="min-w-[180px]" />
                  <Input label="Email" type="email" value={newPersonnel.email} onChange={(e) => setNewPersonnel((f) => ({ ...f, email: e.target.value }))} placeholder="Optional" className="min-w-[200px]" />
                  <Button onClick={handleAddPersonnel} disabled={!newPersonnel.name.trim()}>Add person</Button>
                </div>
              )}
            </div>
          )
        })()}
      </Card>

      <Card padding="lg">
        <CardHeader>Jobs assigned</CardHeader>
        <CardDescription>Jobs/sites this subcontractor is assigned to.</CardDescription>
        {jobs.length === 0 && !isEditing ? (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No jobs assigned.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-2">
                <div>
                  <Link
                    to={`/jobs/${j.id}`}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    {j.title}
                  </Link>
                  <span className="text-neutral-500 dark:text-neutral-400 ml-2">— {j.siteName}</span>
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeJobAssignment(jobAssignmentsForSub.find((a) => a.jobId === j.id)!.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isEditing && availableJobs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Assign to job</span>
              <select
                id="assign-job-select"
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white min-w-[220px]"
                onChange={(e) => {
                  const jobId = e.target.value
                  if (!jobId) return
                  addJobAssignment({
                    jobId,
                    subcontractorId: sub.id,
                    assignedBy: user?.name ?? 'Unknown',
                    assignedAt: new Date().toISOString().slice(0, 10),
                  })
                  e.target.value = ''
                }}
              >
                <option value="">Select a job…</option>
                {availableJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.siteName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>Workforce by job</CardHeader>
        <CardDescription>
          Contractor personnel on each job, who is on site today, and each person&apos;s certifications. Add people to a job or remove them when editing.
        </CardDescription>
        {jobs.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No jobs assigned — assign a job above to see personnel here.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {jobs.map((j) => {
              const assignmentIdsOnJob = personnelJobAssignments.filter((a) => a.jobId === j.id).map((a) => a.personnelId)
              const personnelOnJob = personnel.filter((p) => p.subcontractorId === sub.id && assignmentIdsOnJob.includes(p.id))
              const subPersonnelNotOnJob = personnel.filter((p) => p.subcontractorId === sub.id && !assignmentIdsOnJob.includes(p.id))
              const today = '2025-02-09'
              const onSiteCount = personnelOnJob.filter((p) => {
                const checkIn = personnelCheckIns.find((c) => c.personnelId === p.id && c.jobId === j.id && c.date === today)
                return checkIn?.checkedInAt && !checkIn?.checkedOutAt
              }).length
              return (
                <div key={j.id} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-neutral-50/50 dark:bg-neutral-800/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <Link to={`/jobs/${j.id}`} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                      {j.title}
                    </Link>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {j.siteName} · {personnelOnJob.length} worker{personnelOnJob.length !== 1 ? 's' : ''} · {onSiteCount} on site today
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {personnelOnJob.map((p) => {
                      const checkIn = personnelCheckIns.find((c) => c.personnelId === p.id && c.jobId === j.id && c.date === today)
                      const isOnSite = !!(checkIn?.checkedInAt && !checkIn?.checkedOutAt)
                      const inTime = checkIn?.checkedInAt ? new Date(checkIn.checkedInAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) : null
                      const personCerts = personnelCertifications.filter((c) => c.personnelId === p.id)
                      const assignmentId = personnelJobAssignments.find((a) => a.jobId === j.id && a.personnelId === p.id)?.id
                      return (
                        <li key={p.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pl-3 border-l-2 border-slate-200 dark:border-slate-600">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-neutral-900 dark:text-white">{p.name}</span>
                            {p.email && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.email}</p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {isOnSite ? (
                                <Badge variant="success">On site{inTime ? ` · In at ${inTime}` : ''}</Badge>
                              ) : (
                                <Badge variant="default">Not on site today</Badge>
                              )}
                            </div>
                            {personCerts.length > 0 && (
                              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="font-medium">Certifications:</span>{' '}
                                {personCerts.map((c) => (
                                  <span key={c.id} className="inline-flex items-center gap-1 mr-2 mt-1">
                                    <span>{c.name}</span>
                                    <Badge
                                      variant={c.status === 'expired' ? 'danger' : c.status === 'expiring-soon' ? 'warning' : 'success'}
                                      className="text-xs"
                                    >
                                      {c.status === 'expired' ? 'Expired' : c.status === 'expiring-soon' ? 'Expiring soon' : 'Current'}
                                    </Badge>
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                          {isEditing && assignmentId && (
                            <Button size="sm" variant="ghost" onClick={() => removePersonnelJobAssignment(assignmentId)} className="shrink-0">
                              Remove from job
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {isEditing && subPersonnelNotOnJob.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center gap-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Add person to this job</span>
                        <select
                          className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white min-w-[200px] text-sm"
                          onChange={(e) => {
                            const personnelId = e.target.value
                            if (!personnelId) return
                            addPersonnelJobAssignment({ personnelId, jobId: j.id, assignedAt: new Date().toISOString().slice(0, 10) })
                            e.target.value = ''
                          }}
                        >
                          <option value="">Select person…</option>
                          {subPersonnelNotOnJob.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}{p.email ? ` (${p.email})` : ''}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {injuries.length > 0 && (
        <Card padding="lg">
          <CardHeader>Injury reports</CardHeader>
          <CardDescription>Injuries involving this subcontractor.</CardDescription>
          <ul className="mt-4 space-y-2">
            {injuries.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/injury-reports/${r.id}`}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  {r.siteName} · {r.reportedAt.slice(0, 10)}
                </Link>
                <span className="ml-2">
                  <Badge variant={r.severity === 'major' ? 'danger' : 'warning'}>{r.severity}</Badge>
                  <span className="text-neutral-500 dark:text-neutral-400 ml-1">{r.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

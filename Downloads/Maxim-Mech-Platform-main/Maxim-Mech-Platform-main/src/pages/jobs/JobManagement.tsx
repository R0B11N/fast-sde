import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_JOBS, MOCK_JOB_ASSIGNMENTS, MOCK_SUPERVISORS, MOCK_JOB_TEMPLATES } from '@/data/mock'

export function JobManagement() {
  const { user } = useUser()
  const [jobs, setJobs] = useState(MOCK_JOBS)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSite, setNewSite] = useState('North Site')

  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'

  const getAssignmentCount = (jobId: string) =>
    MOCK_JOB_ASSIGNMENTS.filter((a) => a.jobId === jobId).length

  const getSupervisorNames = (ids: string[]) =>
    ids.length === 0 ? 'None' : ids.map((id) => MOCK_SUPERVISORS.find((s) => s.id === id)?.name ?? id).join(', ')

  const toggleSupervisor = (jobId: string, supervisorId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j
        const ids = j.assignedSupervisorIds ?? []
        const next = ids.includes(supervisorId) ? ids.filter((id) => id !== supervisorId) : [...ids, supervisorId]
        return { ...j, assignedSupervisorIds: next }
      })
    )
  }

  const createJob = () => {
    if (!newTitle.trim()) return
    setJobs((prev) => [
      ...prev,
      {
        id: `job-${Date.now()}`,
        title: newTitle.trim(),
        siteName: newSite,
        status: 'active',
        assignedSupervisorIds: [],
        createdBy: user?.name ?? 'Unknown',
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ])
    setNewTitle('')
    setShowCreate(false)
  }

  if (!isOwnerOrHr) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Job management</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Create jobs, assign supervisors and labourers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowCreate(true)} leftIcon={<PlusIcon />}>Create job</Button>
          <select
            className="rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-2 text-sm"
            value=""
            onChange={(e) => {
              const id = e.target.value
              if (!id) return
              const t = MOCK_JOB_TEMPLATES.find((x) => x.id === id)
              if (t) {
                setNewTitle(t.name)
                setNewSite(t.defaultSiteName ?? 'North Site')
                setShowCreate(true)
              }
              e.target.value = ''
            }}
            aria-label="Create from template"
          >
            <option value="">Create from template…</option>
            {MOCK_JOB_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showCreate && (
        <Card padding="lg">
          <CardHeader>Create job</CardHeader>
          <CardDescription>Add a new job/site. Then assign one or more supervisors and labourers.</CardDescription>
          <div className="mt-4 space-y-4 max-w-md">
            <input
              placeholder="Job title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
            <select
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              aria-label="Site"
            >
              <option>North Site</option>
              <option>South Site</option>
              <option>East Site</option>
              <option>West Site</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={createJob}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <Card padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{job.title}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {job.siteName} · Supervisors: {getSupervisorNames(job.assignedSupervisorIds ?? [])} · {getAssignmentCount(job.id)} labourer(s)
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={job.status === 'active' ? 'success' : 'default'}>{job.status}</Badge>
                <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Assign supervisors">
                  {MOCK_SUPERVISORS.map((s) => (
                    <label key={s.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={(job.assignedSupervisorIds ?? []).includes(s.id)}
                        onChange={() => toggleSupervisor(job.id, s.id)}
                        className="rounded border-slate-300 text-brand-600"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">{s.name}</span>
                    </label>
                  ))}
                </div>
                <Link to={`/jobs/${job.id}`}><Button size="sm" variant="secondary">Manage</Button></Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlusIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
}

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_JOBS, MOCK_JOB_ASSIGNMENTS, MOCK_JOB_CHECK_INS, MOCK_EMERGENCY_SITE_INFO } from '@/data/mock'
import { useSubcontractors } from '@/contexts/SubcontractorsContext'

const MOCK_LABOURERS = [
  { id: '3', name: 'Sam Williams' },
  { id: '5', name: 'Taylor Brown' },
]

const TODAY = '2025-02-09'

function formatCheckInTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

export function JobDetail() {
  const { id } = useParams()
  const { user } = useUser()
  const job = MOCK_JOBS.find((j) => j.id === id)
  const [assignments, setAssignments] = useState(MOCK_JOB_ASSIGNMENTS)
  const [checkIns, setCheckIns] = useState(MOCK_JOB_CHECK_INS)

  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'
  const isSupervisor = user?.role === 'supervisor' && job?.assignedSupervisorIds?.includes(user?.id ?? '')

  const { subcontractors, jobAssignments: subJobAssignments } = useSubcontractors()
  const jobLabourers = assignments.filter((a) => a.jobId === id)
  const labourerIds = jobLabourers.map((a) => a.userId)
  const jobSubcontractors = id ? subJobAssignments.filter((a) => a.jobId === id) : []
  const subcontractorsOnJob = jobSubcontractors.map((a) => subcontractors.find((s) => s.id === a.subcontractorId)).filter(Boolean) as typeof subcontractors

  const assignLabourer = (userId: string) => {
    setAssignments((prev) => [
      ...prev,
      { id: `ja-${Date.now()}`, jobId: id!, userId, assignedBy: user?.name ?? 'Unknown', assignedAt: new Date().toISOString().slice(0, 10) },
    ])
  }

  const handleCheckIn = (userId: string) => {
    setCheckIns((prev) => {
      const existing = prev.find((c) => c.jobId === id && c.userId === userId && c.date === TODAY)
      if (existing) {
        if (!existing.checkedInAt) return prev.map((c) => (c.id === existing.id ? { ...c, checkedInAt: new Date().toISOString() } : c))
        if (!existing.checkedOutAt) return prev.map((c) => (c.id === existing.id ? { ...c, checkedOutAt: new Date().toISOString() } : c))
        return prev
      }
      return [...prev, { id: `ci-${Date.now()}`, jobId: id!, userId, date: TODAY, checkedInAt: new Date().toISOString(), checkedOutAt: null }]
    })
  }

  const handleResetCheckIn = (userId: string) => {
    if (!id) return
    setCheckIns((prev) => prev.filter((c) => !(c.jobId === id && c.userId === userId && c.date === TODAY)))
  }

  const getCheckIn = (userId: string) => checkIns.find((c) => c.jobId === id && c.userId === userId && c.date === TODAY)

  if (!job) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">Job not found.</p>
        <Link to="/jobs" className="text-brand-600 dark:text-brand-400 hover:underline">Back to jobs</Link>
      </div>
    )
  }

  const canAssignLabourers = isOwnerOrHr || isSupervisor
  const emergencyInfo = id ? MOCK_EMERGENCY_SITE_INFO.find((e) => e.jobId === id) : undefined

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={isSupervisor ? '/my-jobs' : '/jobs'} className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">{job.title}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">{job.siteName} · {job.status}</p>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>Assigned labourers</CardHeader>
        <CardDescription>Labourers on this job. {canAssignLabourers ? 'Assign more below.' : ''}</CardDescription>
        <ul className="mt-4 space-y-2">
          {jobLabourers.length === 0 ? (
            <li className="text-sm text-neutral-500">No labourers assigned yet.</li>
          ) : (
            jobLabourers.map((a) => {
              const labourer = MOCK_LABOURERS.find((l) => l.id === a.userId)
              const checkInRecord = getCheckIn(a.userId)
              const inTime = formatCheckInTime(checkInRecord?.checkedInAt)
              const outTime = formatCheckInTime(checkInRecord?.checkedOutAt)
              return (
                <li key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50">
                  <div className="min-w-0">
                    <span className="font-medium text-neutral-900 dark:text-white">{labourer?.name ?? a.userId}</span>
                    {(inTime || outTime) && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {inTime && <>In at {inTime}</>}
                        {inTime && outTime && ' · '}
                        {outTime && <>Out at {outTime}</>}
                      </p>
                    )}
                  </div>
                  {isSupervisor && (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        size="sm"
                        variant={checkInRecord?.checkedInAt ? 'secondary' : 'primary'}
                        onClick={() => handleCheckIn(a.userId)}
                        disabled={!!(checkInRecord?.checkedInAt && checkInRecord?.checkedOutAt)}
                      >
                        {!checkInRecord?.checkedInAt ? 'Check in' : checkInRecord.checkedOutAt ? 'Checked out' : 'Check out'}
                      </Button>
                      {checkInRecord && (
                        <button
                          type="button"
                          onClick={() => handleResetCheckIn(a.userId)}
                          className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 underline"
                          aria-label="Reset check-in for today"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )}
                  {!isSupervisor && checkInRecord && (
                    <Badge variant={checkInRecord.checkedInAt ? 'success' : 'default'}>
                      {checkInRecord.checkedOutAt ? 'Out' : 'In'}
                    </Badge>
                  )}
                </li>
              )
            })
          )}
        </ul>
        {canAssignLabourers && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Add labourer</p>
            <div className="flex flex-wrap gap-2">
              {MOCK_LABOURERS.filter((l) => !labourerIds.includes(l.id)).map((l) => (
                <Button key={l.id} size="sm" variant="outline" onClick={() => assignLabourer(l.id)}>
                  + {l.name}
                </Button>
              ))}
              {MOCK_LABOURERS.filter((l) => !labourerIds.includes(l.id)).length === 0 && (
                <span className="text-sm text-neutral-500">All labourers assigned.</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {isOwnerOrHr && subcontractorsOnJob.length > 0 && (
        <Card padding="lg">
          <CardHeader>Subcontractors on this job</CardHeader>
          <CardDescription>External companies assigned to this job/site.</CardDescription>
          <ul className="mt-4 space-y-2">
            {subcontractorsOnJob.map((s) => (
              <li key={s.id}>
                <Link to={`/subcontractors/${s.id}`} className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  {s.companyName}
                </Link>
                <span className="text-neutral-500 dark:text-neutral-400 ml-2">— {s.primaryContactName}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {emergencyInfo && (
        <Card padding="lg" className="border-l-4 border-red-500/50">
          <CardHeader>Emergency info — {emergencyInfo.siteName}</CardHeader>
          <CardDescription>First aider, meeting point, nearest hospital</CardDescription>
          <ul className="mt-4 space-y-2 text-sm">
            {emergencyInfo.firstAiderName && <li><span className="text-neutral-500">First aider:</span> {emergencyInfo.firstAiderName}{emergencyInfo.firstAiderPhone ? ` · ${emergencyInfo.firstAiderPhone}` : ''}</li>}
            {emergencyInfo.emergencyContact && <li><span className="text-neutral-500">Emergency contact:</span> {emergencyInfo.emergencyContact}</li>}
            {emergencyInfo.meetingPoint && <li><span className="text-neutral-500">Meeting point:</span> {emergencyInfo.meetingPoint}</li>}
            {emergencyInfo.nearestHospital && <li><span className="text-neutral-500">Nearest hospital:</span> {emergencyInfo.nearestHospital}</li>}
          </ul>
        </Card>
      )}

      {isSupervisor && (
        <Card padding="lg">
          <CardHeader>Today&apos;s check-in</CardHeader>
          <CardDescription>Mark who is on site today ({TODAY})</CardDescription>
          <p className="mt-2 text-sm text-neutral-500">Use the Check in / Check out buttons above for each assigned labourer.</p>
        </Card>
      )}
    </div>
  )
}

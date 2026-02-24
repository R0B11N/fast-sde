import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { MOCK_JOB_ENTRIES } from '@/data/mock'

export function GoogleSheetsJobs() {
  const [jobs, setJobs] = useState(MOCK_JOB_ENTRIES)

  const updateField = (jobId: string, key: string, value: string) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, fields: { ...j.fields, [key]: value } } : j)))
  }

  const setStatus = (jobId: string, status: 'pending' | 'approved' | 'discarded') => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/sheets/select" className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Potential jobs</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Parsed from emails — edit, approve, or discard. Link to original email.</p>
        </div>
      </div>

      <ul className="space-y-4">
        {jobs.map((job) => (
          <li key={job.id}>
            <Card padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <CardHeader>{job.title}</CardHeader>
                <Badge variant={job.status === 'approved' ? 'success' : job.status === 'discarded' ? 'danger' : 'warning'}>{job.status}</Badge>
              </div>
              <CardDescription className="mb-4">Source: {job.source}</CardDescription>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(job.fields).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">{key}</label>
                    <Input value={val} onChange={(e) => updateField(job.id, key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.emailId && <span className="text-sm text-neutral-500 dark:text-neutral-400">Source: external email</span>}
                {job.status === 'pending' && (
                  <>
                    <Button size="sm" variant="danger" onClick={() => setStatus(job.id, 'discarded')}>Discard</Button>
                    <Button size="sm" onClick={() => setStatus(job.id, 'approved')}>Approve</Button>
                  </>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}

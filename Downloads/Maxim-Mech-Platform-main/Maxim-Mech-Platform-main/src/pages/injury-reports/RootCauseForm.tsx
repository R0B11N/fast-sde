import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useRootCause } from '@/contexts/RootCauseContext'
import { useUser } from '@/contexts/UserContext'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'

export function RootCauseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { addAnalysis, updateAnalysis, getByLinked } = useRootCause()
  const { getReport } = useInjuryReports()
  const report = id ? getReport(id) : undefined
  const existing = id ? getByLinked('injury', id) : undefined

  const [immediateCause, setImmediateCause] = useState(existing?.immediateCause ?? '')
  const [contributing1, setContributing1] = useState(existing?.contributingCauses[0] ?? '')
  const [contributing2, setContributing2] = useState(existing?.contributingCauses[1] ?? '')
  const [underlyingCause, setUnderlyingCause] = useState(existing?.underlyingCause ?? '')

  const isHr = user?.role === 'owner' || user?.role === 'hr'

  if (!isHr || !id) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">Not found or access denied.</p>
        <Link to="/injury-reports" className="text-brand-600 dark:text-brand-400 hover:underline">Back to injury reports</Link>
      </div>
    )
  }

  const save = () => {
    const contributingCauses = [contributing1, contributing2].filter(Boolean)
    const payload = {
      immediateCause: immediateCause.trim(),
      contributingCauses,
      underlyingCause: underlyingCause.trim() || undefined,
      analyzedBy: user?.name ?? 'HR',
      analyzedAt: new Date().toISOString(),
    }
    if (existing) {
      updateAnalysis(existing.id, payload)
    } else {
      addAnalysis({ linkedType: 'injury', linkedId: id, ...payload })
    }
    navigate(`/injury-reports/${id}`)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Link to={`/injury-reports/${id}`} className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Injury report</Link>
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Root cause analysis</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {report ? `Linked to injury report: ${report.siteName} · ${report.reportedAt.slice(0, 10)}` : 'Capture immediate, contributing, and underlying causes.'}
        </p>
      </div>
      <Card padding="lg">
        <CardHeader>Analysis</CardHeader>
        <CardDescription>Structured root cause supports prevention and regulatory reporting.</CardDescription>
        <div className="mt-4 space-y-4">
          <Input label="Immediate cause" value={immediateCause} onChange={(e) => setImmediateCause(e.target.value)} placeholder="What directly caused the injury?" required />
          <Input label="Contributing cause 1" value={contributing1} onChange={(e) => setContributing1(e.target.value)} placeholder="e.g. PPE not worn" />
          <Input label="Contributing cause 2" value={contributing2} onChange={(e) => setContributing2(e.target.value)} placeholder="e.g. Time pressure" />
          <Textarea label="Underlying cause (optional)" value={underlyingCause} onChange={(e) => setUnderlyingCause(e.target.value)} placeholder="System or policy factors" rows={3} />
          <div className="flex gap-2">
            <Button onClick={save} disabled={!immediateCause.trim()}>Save analysis</Button>
            <Link to={`/injury-reports/${id}`}><Button variant="ghost">Cancel</Button></Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

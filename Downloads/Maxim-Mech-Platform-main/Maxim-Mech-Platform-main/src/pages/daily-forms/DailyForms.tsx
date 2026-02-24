import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_DAILY_FORMS_TO_COMPLETE } from '@/data/mock'
import { useUser } from '@/contexts/UserContext'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import { useSignableSubmissions } from '@/contexts/SignableSubmissionsContext'

type FormPeriod = 'daily' | 'monthly' | 'yearly'

export function DailyForms() {
  const { user } = useUser()
  const { templates: MOCK_SIGNABLE_FORM_TEMPLATES } = useSignableTemplates()
  const { submissions: signableSubmissions } = useSignableSubmissions()
  const [activeTab, setActiveTab] = useState<FormPeriod>('daily')
  const today = new Date().toISOString().slice(0, 10)
  const formsAwaitingMySignature = user?.id
    ? signableSubmissions.filter(
        (s) =>
          s.workflowType === 'site_meeting' &&
          s.siteSignerIds?.includes(user.id) &&
          !s.siteSignatures?.some((sig) => sig.userId === user.id)
      )
    : []
  
  // Filter forms by period based on template schedule
  const getFormsByPeriod = (period: FormPeriod) => {
    const allForms = MOCK_DAILY_FORMS_TO_COMPLETE.filter((f) => {
      if (f.assignedToUserId) return f.assignedToUserId === user?.id
      return f.assignedToRole === user?.role
    })
    
    return allForms.filter((f) => {
      const template = MOCK_SIGNABLE_FORM_TEMPLATES.find((t) => t.id === f.signableFormId)
      if (period === 'daily') return template?.schedule === 'daily'
      if (period === 'monthly') return template?.schedule === 'monthly'
      if (period === 'yearly') return template?.schedule === 'yearly'
      return false
    })
  }
  
  const myForms = getFormsByPeriod(activeTab)
  const pending = myForms.filter((f) => f.status === 'pending' || f.status === 'filled')
  const completed = myForms.filter((f) => f.status === 'signed')

  const getFillUrl = (dailyForm: (typeof myForms)[0]) => {
    const template = MOCK_SIGNABLE_FORM_TEMPLATES.find((t) => t.id === dailyForm.signableFormId)
    const hasPlacedFields = (template?.placedFields?.length ?? 0) > 0
    if (hasPlacedFields) return `/daily-forms/fill/${dailyForm.id}`
    return dailyForm.status === 'pending' ? `/forms/new?daily=${dailyForm.id}` : `/signing?daily=${dailyForm.id}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Work forms to complete</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Fill out and sign each form by the due date</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'daily' ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          }`}
        >
          Daily forms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'monthly' ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          }`}
        >
          Monthly forms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('yearly')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'yearly' ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          }`}
        >
          Yearly forms
        </button>
      </div>

      {formsAwaitingMySignature.length > 0 && (
        <Card padding="lg" className="border-l-4 border-brand-500">
          <CardHeader>Waiting for your signature</CardHeader>
          <CardDescription>Your supervisor has sent these forms for you to sign.</CardDescription>
          <ul className="mt-4 space-y-3">
            {formsAwaitingMySignature.map((s) => (
              <li key={s.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-brand-50/30 dark:bg-brand-900/10">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{s.templateName}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">From {s.submittedBy}</p>
                  </div>
                  <Link to={`/daily-forms/sign/${s.id}`}>
                    <Button size="sm">Sign</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {pending.length > 0 && (
        <Card padding="lg">
          <CardHeader>Due today</CardHeader>
          <CardDescription>Complete and sign these forms</CardDescription>
          <ul className="mt-4 space-y-3">
            {pending.map((f) => (
              <li key={f.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{f.templateName}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Due {new Date(f.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.status === 'signed' ? 'success' : f.status === 'filled' ? 'warning' : 'default'}>
                      {f.status === 'filled' ? 'Ready to sign' : f.status}
                    </Badge>
                    <Link to={getFillUrl(f)}>
                      <Button size="sm">{f.status === 'pending' ? 'Fill & sign' : 'Sign'}</Button>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {completed.length > 0 && (
        <Card padding="lg">
          <CardHeader>Completed today</CardHeader>
          <CardDescription>Forms you’ve already filled and signed</CardDescription>
          <ul className="mt-4 space-y-2">
            {completed.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span className="font-medium text-neutral-900 dark:text-white">{f.templateName}</span>
                <Badge variant="success">Signed</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {myForms.length === 0 && (
        <Card padding="lg" className="text-center text-neutral-500 dark:text-neutral-400">
          No daily forms assigned for today. Check back tomorrow or contact HR if you expect a form.
        </Card>
      )}
    </div>
  )
}

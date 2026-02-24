import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

export function RegulationsReference() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Regulatory reference</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">HR/legal: key frameworks and reporting requirements (informational).</p>
      </div>
      <Card padding="lg">
        <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-3">OSHA (US) / Provincial OHS (Canada)</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <li>Recordable injury criteria: work-related death, loss of consciousness, restricted work, transfer to another job, or medical treatment beyond first aid.</li>
          <li>Reporting timelines: serious injuries and fatalities must be reported within 24–48 hours per jurisdiction.</li>
          <li>OSHA 300 Log equivalent: maintain a log of recordable injuries; annual summary posting.</li>
        </ul>
      </Card>
      <Card padding="lg">
        <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-3">WSIB / workers&apos; compensation</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <li>Report workplace injuries to the board as required by your province.</li>
          <li>Claim numbers and reporting dates should be kept with the injury report.</li>
        </ul>
      </Card>
      <Card padding="lg">
        <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-3">Form-to-requirement mapping</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Templates can be tagged with a regulatory reference in Admin → Templates (e.g. OSHA 301, Provincial OHS s. X).</p>
        <Link to="/admin/templates" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">Go to Templates</Link>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_AUDIT_LOG } from '@/data/mock'
import type { AuditLogEntry } from '@/types'

const ENTITY_LABELS: Record<AuditLogEntry['entityType'], string> = {
  form: 'Form',
  injury: 'Injury report',
  document: 'Document',
  user: 'User',
  subcontractor: 'Subcontractor',
  capa: 'CAPA',
  certificate: 'Certificate',
}

export function AuditLog() {
  const [filter, setFilter] = useState<AuditLogEntry['entityType'] | 'all'>('all')
  const entries = filter === 'all'
    ? [...MOCK_AUDIT_LOG].sort((a, b) => b.at.localeCompare(a.at))
    : MOCK_AUDIT_LOG.filter((e) => e.entityType === filter).sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Audit log</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Who did what when across forms, injuries, documents, and more</p>
      </div>
      <Card padding="md">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            All
          </button>
          {(Object.keys(ENTITY_LABELS) as AuditLogEntry['entityType'][]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === type ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
            >
              {ENTITY_LABELS[type]}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg border border-neutral-100 dark:border-neutral-700/50">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {new Date(e.at).toLocaleString()}
              </span>
              <span className="font-medium text-neutral-900 dark:text-white">{e.by}</span>
              <span className="text-neutral-600 dark:text-neutral-300">{e.action}</span>
              <Badge variant="default">{ENTITY_LABELS[e.entityType]}</Badge>
              <span className="text-neutral-600 dark:text-neutral-300">{e.entityLabel ?? e.entityId}</span>
              {e.linkTo && (
                <Link to={e.linkTo} className="text-sm text-brand-600 dark:text-brand-400 hover:underline ml-auto">
                  View
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useUser } from '@/contexts/UserContext'
import { useDocuments } from '@/contexts/DocumentsContext'
import { MOCK_INCIDENTS } from '@/data/mock'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import { canUserViewDocument } from '@/utils/documentAccess'
import type { UserRole } from '@/types'

type ResultType = 'document' | 'submission' | 'incident'

const TYPE_FILTER_OPTIONS: { value: 'all' | ResultType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'document', label: 'Documents' },
  { value: 'submission', label: 'Submissions' },
  { value: 'incident', label: 'Incidents' },
]

interface SearchResult {
  type: ResultType
  id: string
  title: string
  subtitle: string
  roleFilter?: UserRole[]
}

export function GlobalSearch() {
  const { user } = useUser()
  const { documents } = useDocuments()
  const { submissions } = useFormSubmissions()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ResultType>('all')
  const [submitted, setSubmitted] = useState(false)

  const results: SearchResult[] = []
  if (query.trim() && user) {
    const q = query.toLowerCase()
    if (typeFilter === 'all' || typeFilter === 'document') {
      documents.forEach((d) => {
        if (!canUserViewDocument(d, user)) return
        if (d.name.toLowerCase().includes(q) || (d.siteName && d.siteName.toLowerCase().includes(q)))
          results.push({ type: 'document', id: d.id, title: d.name, subtitle: `${d.type} · ${d.date}`, roleFilter: d.roleRestricted })
      })
    }
    if (typeFilter === 'all' || typeFilter === 'submission') {
      submissions.forEach((f) => {
        if (f.templateName.toLowerCase().includes(q) || (f.siteName && f.siteName.toLowerCase().includes(q)))
          results.push({ type: 'submission', id: f.id, title: f.templateName, subtitle: `${f.status} · ${f.siteName || '—'}` })
      })
    }
    if (typeFilter === 'all' || typeFilter === 'incident') {
      MOCK_INCIDENTS.forEach((i) => {
        if (i.title.toLowerCase().includes(q) || i.siteName.toLowerCase().includes(q))
          results.push({ type: 'incident', id: i.id, title: i.title, subtitle: i.siteName })
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Search</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Documents, submissions, incidents. Results are filtered by your role.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="search"
            placeholder="Search documents, submissions, incidents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500">
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${typeFilter === opt.value ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </form>

      {submitted && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <Card padding="lg" className="text-center text-neutral-500 dark:text-neutral-400">No results for "{query}"</Card>
          ) : (
            results.map((r) => (
              <Link key={`${r.type}-${r.id}`} to={`/search/${r.type}/${r.id}`}>
                <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{r.title}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{r.subtitle} · {r.type}</p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
}

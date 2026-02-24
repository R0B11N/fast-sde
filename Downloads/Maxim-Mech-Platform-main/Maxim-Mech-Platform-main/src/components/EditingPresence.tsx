import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import type { PresenceEntry } from '@/contexts/PresenceContext'

interface EditingPresenceProps {
  /** Who has this open right now (in this session) */
  currentlyViewing: PresenceEntry[]
  /** Last time the record was opened */
  lastOpenedAt?: string
  lastOpenedBy?: string
  /** Last time the record was edited */
  lastEditedAt?: string
  lastEditedBy?: string
}

export function EditingPresence({
  currentlyViewing,
  lastOpenedAt,
  lastOpenedBy,
  lastEditedAt,
  lastEditedBy,
}: EditingPresenceProps) {
  const hasAny = currentlyViewing.length > 0 || lastOpenedAt || lastEditedAt

  if (!hasAny) return null

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    } catch {
      return iso
    }
  }

  return (
    <Card padding="md" className="no-print border-l-4 border-brand-500/50">
      <CardHeader className="text-base">Who&apos;s viewing &amp; recent activity</CardHeader>
      <CardDescription>So multiple HR users can see who has this open and who last edited it.</CardDescription>
      <dl className="mt-3 space-y-2 text-sm">
        {currentlyViewing.length > 0 && (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400 font-medium">Currently viewing</dt>
            <dd className="text-neutral-900 dark:text-white mt-0.5">
              {currentlyViewing.map((e) => e.userName).join(', ')}
            </dd>
          </div>
        )}
        {lastOpenedAt && (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400 font-medium">Last opened</dt>
            <dd className="text-neutral-900 dark:text-white mt-0.5">
              {formatDate(lastOpenedAt)}
              {lastOpenedBy && ` by ${lastOpenedBy}`}
            </dd>
          </div>
        )}
        {lastEditedAt && (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400 font-medium">Last edited</dt>
            <dd className="text-neutral-900 dark:text-white mt-0.5">
              {formatDate(lastEditedAt)}
              {lastEditedBy && ` by ${lastEditedBy}`}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  )
}

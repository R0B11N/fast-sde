import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import type { UserRole } from '@/types'
import { Badge } from '@/components/ui/Badge'

const roleLabels: Record<UserRole, string> = {
  owner: 'Owner',
  hr: 'HR',
  supervisor: 'Supervisor',
  labourer: 'Labourer',
}

export function RoleSwitcher() {
  const { user, switchRole } = useUser()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left min-w-0 max-w-[140px] md:max-w-none"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch role"
      >
        <Badge variant="info" className="shrink-0">{roleLabels[user.role]}</Badge>
        <svg className="w-4 h-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute left-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-soft-lg py-1 animate-slide-up"
          >
            {(['owner', 'hr', 'supervisor', 'labourer'] as UserRole[]).map((role) => (
              <li key={role}>
                <button
                  type="button"
                  role="option"
                  aria-selected={user.role === role}
                  onClick={() => { switchRole(role); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${user.role === role ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                >
                  {roleLabels[role]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

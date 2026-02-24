import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@/contexts/UserContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePinnedSafety } from '@/contexts/PinnedSafetyContext'
import { Button } from '@/components/ui/Button'
import { useNotifications } from '@/hooks/useNotifications'
import { useFrank } from '@/contexts/FrankContext'
import { FrankButton } from '@/components/frank/FrankButton'
import { RoleSwitcher } from '@/components/layout/RoleSwitcher'
import { SessionPanel } from '@/components/auth/SessionPanel'
import {
  IconDashboard,
  IconBriefcase,
  IconClipboard,
  IconFolder,
  IconShield,
  IconSearch,
  IconCog,
  IconDocumentDuplicate,
  IconCertificate,
  IconTable,
  IconBell,
  IconUserGroup,
  IconCalendar,
} from '@/components/icons/NavIcons'
import { OfflineBanner } from '@/components/safety/OfflineBanner'
import type { UserRole } from '@/types'

type NavItem = { to: string; label: string; roles?: UserRole[]; icon: React.ReactNode }
type NavGroup = { label?: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ to: '/search', label: 'Search', icon: <IconSearch /> }],
  },
  {
    items: [{ to: '/', label: 'Dashboard', icon: <IconDashboard /> }],
  },
  {
    label: 'Work',
    items: [
      { to: '/jobs', label: 'Job management', roles: ['owner', 'hr'], icon: <IconBriefcase /> },
      { to: '/hr/todo', label: 'Todo & calendar', roles: ['owner', 'hr'], icon: <IconCalendar /> },
      { to: '/sheets', label: 'Google Sheets', roles: ['owner', 'hr'], icon: <IconTable /> },
      { to: '/my-jobs', label: 'My jobs', roles: ['supervisor'], icon: <IconBriefcase /> },
      { to: '/daily-forms', label: 'Daily forms', roles: ['supervisor', 'labourer'], icon: <IconClipboard /> },
    ],
  },
  {
    label: 'Forms & documents',
    items: [
      { to: '/library', label: 'Forms & documents', icon: <IconFolder /> },
    ],
  },
  {
    label: 'Safety & HR',
    items: [
      { to: '/safety', label: 'Health & safety', icon: <IconShield /> },
      { to: '/injury-reports', label: 'Injury reports', roles: ['owner', 'hr'], icon: <IconShield /> },
      { to: '/certificates', label: 'Certificates', roles: ['owner', 'hr'], icon: <IconCertificate /> },
      { to: '/subcontractors', label: 'Subcontractors', roles: ['owner', 'hr'], icon: <IconUserGroup /> },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/admin', label: 'Users & settings', roles: ['owner', 'hr'], icon: <IconCog /> },
      { to: '/admin/notifications', label: 'Notifications', roles: ['owner', 'hr'], icon: <IconBell /> },
      { to: '/admin/audit-log', label: 'Audit log', roles: ['owner', 'hr'], icon: <IconDocumentDuplicate /> },
      { to: '/admin/permissions', label: 'Permissions', roles: ['owner', 'hr'], icon: <IconCog /> },
      { to: '/admin/sessions', label: 'Session management', roles: ['owner', 'hr'], icon: <IconShield /> },
      { to: '/admin/documents', label: 'Document visibility', roles: ['owner', 'hr'], icon: <IconDocumentDuplicate /> },
    ],
  },
]

export function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useUser()
  const { session } = useAuth()
  const { pinned } = usePinnedSafety()
  const location = useLocation()
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead, open: openNotifs, setOpen: setNotifsOpen } = useNotifications()
  const { isOpen: frankOpen } = useFrank()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const notifsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault()
          setShortcutsOpen((o) => !o)
        }
      }
      if (e.key === 'Escape') setShortcutsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!openNotifs) return
    const handleClickOutside = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setNotifsOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openNotifs, setNotifsOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const filteredGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((l) => !l.roles || l.roles.includes(user.role)),
  })).filter((g) => g.items.length > 0)

  const pinnedNavGroup: NavGroup | null =
    (user.role === 'owner' || user.role === 'hr') && pinned.length > 0
      ? {
        label: 'Pinned',
        items: pinned.map((p) => ({
          to: p.to,
          label: p.label,
          icon: <IconShield />,
        })),
      }
      : null
  const groupsWithPinned = pinnedNavGroup
    ? [...filteredGroups.slice(0, 5), pinnedNavGroup, ...filteredGroups.slice(5)]
    : filteredGroups

  const isActive = (path: string) => {
    if (path === '/library') {
      return location.pathname === '/library' || location.pathname.startsWith('/library/') ||
        location.pathname.startsWith('/forms') || location.pathname.startsWith('/signing') || location.pathname.startsWith('/documents')
    }
    if (path === '/safety') {
      return location.pathname === '/safety' || location.pathname.startsWith('/safety/')
    }
    if (path === '/sheets') {
      return location.pathname === '/sheets' || location.pathname.startsWith('/sheets/')
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
  }

  return (
    <div className="min-h-screen flex flex-col bg-app bg-app-light safe-bottom" style={{ ['--header-height' as string]: '3.5rem' }}>
      {/* Top bar */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-600/40 bg-white/90 dark:bg-[rgb(12,16,28)]/90 backdrop-blur-xl safe-top h-14 md:h-16 shadow-sm dark:shadow-none dark:border-b-slate-500/20">
        <div className="flex items-center justify-between h-14 md:h-16 px-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="md:hidden touch-target flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="font-display font-semibold text-lg tracking-tight text-brand-700 dark:text-brand-400 truncate">
              Maxim
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400" title="This is a front-end prototype; data is not persisted.">
              Demo
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            {/* session indicator */}
            {session && (
              <button
                type="button"
                onClick={() => setSessionPanelOpen(true)}
                className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5"
                aria-label="Session details"
                title="Session details"
              >
                <span className="relative flex h-2 w-2">
                  {session.heartbeatStatus === 'connected' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </>
                  ) : session.heartbeatStatus === 'degraded' ? (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse" />
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  )}
                </span>
                <span className="hidden sm:inline text-xs font-mono text-neutral-500 dark:text-neutral-400">{Math.floor(session.ttl / 60)}m</span>
              </button>
            )}
            <RoleSwitcher />
            <button
              type="button"
              onClick={toggleTheme}
              className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            <div className="relative" ref={notifsRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setNotifsOpen(!openNotifs) }}
                className="touch-target relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                aria-label="Notifications"
                aria-expanded={openNotifs}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" aria-hidden />
                )}
              </button>
              {openNotifs && (
                <div className="absolute right-0 top-full mt-1 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-soft-lg py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                      >
                        Read all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-neutral-500">No notifications</p>
                  ) : (
                    <ul className="max-h-64 overflow-auto">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              markRead(n.id)
                              setNotifsOpen(false)
                              if (n.linkTo) navigate(n.linkTo)
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${!n.read ? 'bg-brand-50/50 dark:bg-brand-950/30' : ''}`}
                          >
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{n.body}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="hidden md:block shrink-0"><FrankButton /></div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
              Log out
            </Button>
          </div>
        </div>

        {/* Session panel slide-over */}
        {sessionPanelOpen && <SessionPanel onClose={() => setSessionPanelOpen(false)} />}

      </header>
      {shortcutsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={() => setShortcutsOpen(false)} aria-hidden>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-sm w-full p-4 border border-neutral-200 dark:border-neutral-600" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-neutral-900 dark:text-white">Keyboard shortcuts</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              <li><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono">?</kbd> Show this help</li>
              <li><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono">Esc</kbd> Close</li>
              <li>Use the sidebar or search to navigate</li>
            </ul>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShortcutsOpen(false)}>Close</Button>
          </div>
        </div>
      )}
      <OfflineBanner />

      {/* Mobile nav: overlay + drawer above main content, below header when closed; when open, drawer overlays with correct stacking */}
      {mobileNavOpen && (
        <div
          className="no-print fixed inset-0 bg-black/40 z-[100] md:hidden animate-fade-in"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}
      <nav
        className={`no-print md:hidden fixed left-0 bottom-0 z-[110] w-72 max-w-[min(85vw,20rem)] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 transform transition-transform duration-200 ease-out shadow-soft-lg ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ top: 'var(--header-height, 3.5rem)' }}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 md:hidden">
          <span className="font-display font-semibold text-brand-700 dark:text-brand-400">Menu</span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="touch-target p-2 -m-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <ul className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-var(--header-height,3.5rem)-4rem)]">
          {groupsWithPinned.map((group) => (
            <li key={group.label ?? 'main'}>
              {group.label && (
                <p className="px-4 mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                    >
                      <span className="shrink-0 text-neutral-500 dark:text-neutral-400 [.bg-brand-100_&]:text-brand-600 dark:[.bg-brand-900\\/40_&]:text-brand-400">{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button type="button" onClick={() => { handleLogout(); setMobileNavOpen(false) }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              Log out
            </button>
          </li>
        </ul>
      </nav>

      <div className="flex flex-1">
        {/* Side nav desktop */}
        <aside className="no-print hidden md:flex md:flex-col md:w-56 lg:w-64 border-r border-slate-200/70 dark:border-slate-600/30 bg-white/70 dark:bg-[rgb(15,20,35)]/80 backdrop-blur-sm py-5 overflow-y-auto">
          <nav className="px-3 space-y-6" aria-label="Main">
            {groupsWithPinned.map((group) => (
              <div key={group.label ?? 'main'}>
                {group.label && (
                  <p className="px-4 mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{group.label}</p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                      >
                        <span className="shrink-0 text-neutral-500 dark:text-neutral-400 [.bg-brand-100_&]:text-brand-600 dark:[.bg-brand-900\\/40_&]:text-brand-400">{link.icon}</span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile: persistent Frank FAB — hide when chat is open so it doesn't block Send */}
      {!frankOpen && (
        <div className="no-print md:hidden fixed bottom-6 right-4 z-[90] safe-bottom">
          <FrankButton />
        </div>
      )}
    </div>
  )
}

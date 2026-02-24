import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Session } from '@/types'

function formatTTL(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function timeSince(iso: string): string {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ago`
}

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    viewer: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

function HeartbeatDot({ status }: { status: Session['heartbeatStatus'] }) {
    if (status === 'connected') {
        return (
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
        )
    }
    if (status === 'degraded') {
        return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 animate-pulse" />
    }
    return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
}

export function SessionManagement() {
    const { allSessions, revokeSession } = useAuth()
    const [, setTick] = useState(0)

    useEffect(() => {
        const iv = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(iv)
    }, [])

    const active = allSessions.filter(s => s.status === 'active')
    const expired = allSessions.filter(s => s.status === 'expired')
    const revoked = allSessions.filter(s => s.status === 'revoked')
    const avgTtl = active.length ? Math.floor(active.reduce((a, s) => a + s.ttl, 0) / active.length) : 0
    const heartbeatHealthy = active.filter(s => s.heartbeatStatus === 'connected').length
    const heartbeatPct = active.length ? Math.round((heartbeatHealthy / active.length) * 100) : 0

    return (
        <div className="space-y-6 animate-fade-in">
            {/* header */}
            <div>
                <h1 className="font-display text-display-lg font-bold text-neutral-900 dark:text-white">Session Management</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Phase 1 · PostgreSQL + JWT + Redis + WebRTC</p>
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Active Sessions" value={active.length.toString()} color="emerald" icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                } />
                <SummaryCard label="Expired Today" value={expired.length.toString()} color="red" icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                } />
                <SummaryCard label="Average TTL" value={formatTTL(avgTtl)} color="brand" icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                } />
                <SummaryCard label="Heartbeat Health" value={`${heartbeatPct}%`} color="purple" icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                } />
            </div>

            {/* sessions table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium">User</th>
                                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium">Role</th>
                                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium hidden sm:table-cell">Session ID</th>
                                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium">JWT</th>
                                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium">Redis TTL</th>
                                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium">Heartbeat</th>
                                <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-neutral-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allSessions.map(s => (
                                <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                {s.userName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-neutral-900 dark:text-white truncate">{s.userName}</p>
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{s.userEmail}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[s.role] || ROLE_COLORS.viewer}`}>{s.role}</span>
                                    </td>
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{s.id.slice(0, 12)}…</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge variant={s.status === 'active' ? 'success' : s.status === 'revoked' ? 'danger' : 'warning'}>
                                            {s.status === 'active' ? 'Valid' : s.status === 'revoked' ? 'Revoked' : 'Expired'}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono text-xs font-semibold ${s.ttl < 300 ? 'text-red-500' : s.ttl < 600 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {s.ttl > 0 ? formatTTL(s.ttl) : '00:00'}
                                            </span>
                                            <div className="hidden lg:block w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${s.ttl < 300 ? 'bg-red-500' : s.ttl < 600 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(0, (s.ttl / (30 * 60)) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <HeartbeatDot status={s.heartbeatStatus} />
                                            <span className="text-xs text-neutral-400 dark:text-neutral-500 hidden md:inline">{timeSince(s.heartbeatLastPing)}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {s.status === 'active' && (
                                            <Button size="sm" variant="secondary" onClick={() => revokeSession(s.id)}>Revoke</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {allSessions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-neutral-400 dark:text-neutral-500">No active sessions</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* revoked count */}
            {revoked.length > 0 && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">{revoked.length} session(s) revoked this period</p>
            )}
        </div>
    )
}

/* ── summary card ── */

function SummaryCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
    const bg: Record<string, string> = {
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    }
    return (
        <Card padding="md" className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg[color] || bg.brand}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white font-display">{value}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{label}</p>
            </div>
        </Card>
    )
}

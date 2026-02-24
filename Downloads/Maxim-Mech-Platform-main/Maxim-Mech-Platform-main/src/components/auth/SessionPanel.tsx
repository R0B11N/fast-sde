import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

function formatTTL(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function timeSince(iso: string): string {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ${diff % 60}s ago`
}

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    viewer: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

export function SessionPanel({ onClose }: { onClose: () => void }) {
    const { session, refreshToken, endSession } = useAuth()
    const [, setTick] = useState(0)

    /* re-render every second for live display */
    useEffect(() => {
        const iv = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(iv)
    }, [])

    if (!session) return null

    const ttlPct = Math.max(0, (session.ttl / (30 * 60)) * 100)
    const jwtParts = session.jwt.split('.')

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md h-full overflow-y-auto bg-white dark:bg-neutral-925 border-l border-neutral-200 dark:border-neutral-800 animate-slide-up shadow-soft-lg"
                onClick={e => e.stopPropagation()}
            >
                {/* header */}
                <div className="sticky top-0 z-10 glass border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 flex items-center justify-between">
                    <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white">Session Details</h2>
                    <button onClick={onClose} className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* ── Role ── */}
                    <Card padding="md">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium mb-2">Role</p>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${ROLE_COLORS[session.role] || ROLE_COLORS.viewer}`}>
                                {session.role}
                            </span>
                            <div className="flex gap-1 ml-auto">
                                {['viewer', 'editor', 'admin', 'owner'].map((r, i) => (
                                    <div key={r} className={`h-1.5 rounded-full transition-all ${i <= ['viewer', 'editor', 'admin', 'owner'].indexOf(session.role) ? 'w-6 bg-brand-500 dark:bg-brand-400' : 'w-4 bg-neutral-200 dark:bg-neutral-700'}`} />
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* ── Heartbeat ── */}
                    <Card padding="md">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium mb-2">WebRTC Heartbeat</p>
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                {session.heartbeatStatus === 'connected' && (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                    </>
                                )}
                                {session.heartbeatStatus === 'degraded' && (
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 animate-pulse" />
                                )}
                                {session.heartbeatStatus === 'disconnected' && (
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                )}
                            </span>
                            <span className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">{session.heartbeatStatus}</span>
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">Last ping: {timeSince(session.heartbeatLastPing)}</span>
                        </div>
                    </Card>

                    {/* ── Redis TTL ── */}
                    <Card padding="md">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium mb-2">Redis Session TTL</p>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className={`font-mono text-2xl font-bold ${session.ttl < 300 ? 'text-red-500' : session.ttl < 600 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {formatTTL(session.ttl)}
                            </span>
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">remaining</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${session.ttl < 300 ? 'bg-red-500' : session.ttl < 600 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${ttlPct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                            <span>Session ID: {session.id.slice(0, 12)}…</span>
                            <span>Issued: {new Date(session.issuedAt).toLocaleTimeString()}</span>
                        </div>
                    </Card>

                    {/* ── JWT Token ── */}
                    <Card padding="md">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium mb-2">JWT Token</p>
                        <div className="font-mono text-[11px] break-all space-y-0.5 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <span className="text-red-500 dark:text-red-400">{jwtParts[0]}</span>
                            <span className="text-neutral-400">.</span>
                            <span className="text-purple-600 dark:text-purple-400">{jwtParts[1]}</span>
                            <span className="text-neutral-400">.</span>
                            <span className="text-blue-600 dark:text-blue-400">{jwtParts[2]}</span>
                        </div>
                        <details className="mt-3">
                            <summary className="text-xs text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">Decoded payload</summary>
                            <pre className="mt-2 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                                {JSON.stringify(session.jwtPayload, null, 2)}
                            </pre>
                        </details>
                    </Card>

                    {/* ── Status ── */}
                    <Card padding="md">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium mb-2">Session Status</p>
                        <div className="flex items-center gap-2">
                            <Badge variant={session.status === 'active' ? 'success' : session.status === 'expired' ? 'danger' : 'warning'}>
                                {session.status.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">{session.userName} · {session.userEmail}</span>
                        </div>
                    </Card>

                    {/* ── Actions ── */}
                    <div className="flex gap-3">
                        <Button size="sm" onClick={refreshToken} fullWidth>
                            ↻ Refresh Token
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => { endSession(); onClose() }} fullWidth>
                            End Session
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

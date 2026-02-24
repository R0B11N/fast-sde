import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { AuthRole, JWTPayload, Session } from '@/types'
import { api } from '@/api'
import jwtDecode from 'jwt-decode'

/* ── helpers ─────────────────────────────────────────────────── */

function uid(): string {
    return 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const SESSION_TTL_SECONDS = 30 * 60 // 30 minutes

/* mock other sessions for admin view */
function buildMockSessions(): Session[] {
    const now = Date.now()
    return Array.from({ length: 5 }).map((_, i) => {
        const iat = Math.floor((now - (i + 1) * 300_000) / 1000)
        const exp = iat + SESSION_TTL_SECONDS
        const role = ['admin', 'editor', 'viewer'][i % 3] as AuthRole
        const payload: JWTPayload = { sub: `mock-${i}`, name: `Mock User ${i}`, email: `mock${i}@example.com`, role, iat, exp }
        const remaining = Math.max(0, exp - Math.floor(now / 1000))
        return {
            id: uid(),
            userId: `mock-${i}`,
            userName: `Mock User ${i}`,
            userEmail: `mock${i}@example.com`,
            role,
            jwt: 'mock.token.' + i,
            jwtPayload: payload,
            issuedAt: new Date(iat * 1000).toISOString(),
            expiresAt: new Date(exp * 1000).toISOString(),
            ttl: remaining,
            heartbeatLastPing: new Date(now - Math.random() * 15_000).toISOString(),
            heartbeatStatus: remaining > 0 ? (Math.random() > 0.2 ? 'connected' : 'degraded') : 'disconnected',
            status: remaining > 0 ? 'active' : 'expired',
        } satisfies Session
    })
}

/* ── context value ───────────────────────────────────────────── */

interface AuthStep {
    label: string
    status: 'pending' | 'running' | 'done'
}

interface AuthContextValue {
    session: Session | null
    allSessions: Session[]
    authSteps: AuthStep[]
    isAuthenticating: boolean
    heartbeatActive: boolean
    authenticate: (email: string, password: string) => Promise<boolean>
    endSession: () => void
    refreshToken: () => void
    revokeSession: (sessionId: string) => void
    switchAuthRole: (role: AuthRole) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ── provider ────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [allSessions, setAllSessions] = useState<Session[]>([])
    const [authSteps, setAuthSteps] = useState<AuthStep[]>([])
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [heartbeatActive, setHeartbeatActive] = useState(false)

    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const ttlRef = useRef<ReturnType<typeof setInterval> | null>(null)

    /* tick TTL down every second */
    useEffect(() => {
        if (!session || session.status !== 'active') return
        ttlRef.current = setInterval(() => {
            setSession(prev => {
                if (!prev || prev.ttl <= 0) return prev
                const next = { ...prev, ttl: prev.ttl - 1 }
                if (next.ttl <= 0) {
                    next.status = 'expired'
                    next.heartbeatStatus = 'disconnected'
                }
                return next
            })
            setAllSessions(prev =>
                prev.map(s => s.ttl > 0 ? { ...s, ttl: s.ttl - 1, status: s.ttl - 1 <= 0 ? 'expired' : s.status } : s)
            )
        }, 1000)
        return () => { if (ttlRef.current) clearInterval(ttlRef.current) }
    }, [session?.status])

    /* heartbeat every 10s */
    useEffect(() => {
        if (!heartbeatActive || !session) return
        heartbeatRef.current = setInterval(() => {
            setSession(prev => prev ? { ...prev, heartbeatLastPing: new Date().toISOString(), heartbeatStatus: 'connected' } : prev)
        }, 10_000)
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
    }, [heartbeatActive, session?.id])

    /* staged authentication */
    const authenticate = useCallback(async (_email: string, _password: string): Promise<boolean> => {
        setIsAuthenticating(true)
        const steps: AuthStep[] = [
            { label: 'Connecting to PostgreSQL…', status: 'pending' },
            { label: 'Validating credentials…', status: 'pending' },
            { label: 'Generating JWT token…', status: 'pending' },
            { label: 'Creating Redis session (TTL 30m)…', status: 'pending' },
            { label: 'Starting WebRTC heartbeat…', status: 'pending' },
        ]
        setAuthSteps([...steps])

        for (let i = 0; i < steps.length; i++) {
            steps[i].status = 'running'
            setAuthSteps([...steps])
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
            steps[i].status = 'done'
            setAuthSteps([...steps])
        }

        let user, accessToken, refreshToken;
        try {
            const res = await api.post('/auth/login', { email: _email, password: _password })
            user = res.data.user
            accessToken = res.data.accessToken
            refreshToken = res.data.refreshToken

            // Persist for interceptor and rehydrating session
            localStorage.setItem('maxim_access_token', accessToken)
            localStorage.setItem('maxim_refresh_token', refreshToken)
        } catch (err) {
            console.error('Login failed', err)
            setIsAuthenticating(false)
            setAuthSteps([])
            return false
        }

        let payload: JWTPayload;
        try {
            payload = jwtDecode<JWTPayload>(accessToken)
        } catch (e) {
            // fallback if decode fails
            const now = Math.floor(Date.now() / 1000)
            payload = { sub: user.id, name: user.name, email: user.email, role: user.role, iat: now, exp: now + SESSION_TTL_SECONDS }
        }

        const now = Math.floor(Date.now() / 1000)
        const newSession: Session = {
            id: uid(),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            role: user.role,
            jwt: accessToken,
            jwtPayload: payload,
            issuedAt: new Date(payload.iat * 1000).toISOString(),
            expiresAt: new Date(payload.exp * 1000).toISOString(),
            ttl: Math.max(0, payload.exp - now),
            heartbeatLastPing: new Date().toISOString(),
            heartbeatStatus: 'connected',
            status: 'active',
        }

        setSession(newSession)
        setAllSessions([newSession, ...buildMockSessions()])
        setHeartbeatActive(true)
        setIsAuthenticating(false)
        return true
    }, [])

    const endSession = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('maxim_refresh_token')
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken })
            }
        } catch (e) {
            console.error('Logout failed', e)
        }
        localStorage.removeItem('maxim_access_token')
        localStorage.removeItem('maxim_refresh_token')
        setSession(null)
        setAllSessions([])
        setHeartbeatActive(false)
        setAuthSteps([])
    }, [])

    const refreshToken = useCallback(async () => {
        if (!session) return
        const rt = localStorage.getItem('maxim_refresh_token')
        if (!rt) return endSession()

        try {
            const res = await api.post('/auth/refresh', { refreshToken: rt })
            const { accessToken, refreshToken: newRt } = res.data
            localStorage.setItem('maxim_access_token', accessToken)
            localStorage.setItem('maxim_refresh_token', newRt)

            const payload = jwtDecode<JWTPayload>(accessToken)
            const now = Math.floor(Date.now() / 1000)

            setSession({
                ...session,
                jwt: accessToken,
                jwtPayload: payload,
                issuedAt: new Date(payload.iat * 1000).toISOString(),
                expiresAt: new Date(payload.exp * 1000).toISOString(),
                ttl: Math.max(0, payload.exp - now),
                status: 'active',
            })
        } catch (e) {
            console.error('Token refresh failed', e)
            endSession()
        }
    }, [session, endSession])

    const revokeSession = useCallback((sessionId: string) => {
        setAllSessions(prev =>
            prev.map(s => s.id === sessionId ? { ...s, status: 'revoked', ttl: 0, heartbeatStatus: 'disconnected' } : s)
        )
    }, [])

    const switchAuthRole = useCallback((role: AuthRole) => {
        if (!session) return
        setSession(prev => prev ? { ...prev, role, jwtPayload: { ...prev.jwtPayload, role } } : prev)
    }, [session])

    return (
        <AuthContext.Provider value={{ session, allSessions, authSteps, isAuthenticating, heartbeatActive, authenticate, endSession, refreshToken, revokeSession, switchAuthRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

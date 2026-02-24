import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const { login } = useUser()
  const { authenticate, authSteps, isAuthenticating } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotMode) {
      alert('Password reset link would be sent to ' + email + ' (mock).')
      setForgotMode(false)
      return
    }
    /* run staged auth animation first, then login */
    await authenticate(email, password)
    login(email, password)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-app bg-app-light safe-bottom relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-brand-400/20 via-brand-500/8 to-transparent dark:from-brand-500/25 dark:via-brand-400/12 dark:to-transparent pointer-events-none" aria-hidden />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500/10 dark:bg-brand-400/8 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-brand-600/8 dark:bg-brand-300/6 blur-3xl pointer-events-none" aria-hidden />

      {/* top bar */}
      <div className="flex justify-between items-center p-4 relative z-10">
        <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 dark:text-neutral-500">Phase 1 · Day 1 of 28</span>
        <button
          type="button"
          onClick={toggleTheme}
          className="touch-target p-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* main card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md animate-slide-up glass-card border-white/50 dark:border-neutral-600/30" padding="lg">
          {/* header */}
          <div className="text-center mb-8">
            {/* logo mark */}
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 dark:from-brand-400 dark:to-brand-700 flex items-center justify-center shadow-glow-brand">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h1 className="font-display font-bold text-display-lg tracking-tight text-neutral-900 dark:text-white">Maxim Mechanical Group</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Internal Platform · Authentication</p>
          </div>

          {/* auth steps overlay */}
          {isAuthenticating ? (
            <div className="space-y-3 py-4 animate-fade-in">
              {authSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {step.status === 'pending' && (
                    <span className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 flex-shrink-0" />
                  )}
                  {step.status === 'running' && (
                    <span className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0" />
                  )}
                  {step.status === 'done' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                  )}
                  <span className={`transition-colors ${step.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : step.status === 'running' ? 'text-brand-600 dark:text-brand-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
              {authSteps.every(s => s.status === 'done') && (
                <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-4 animate-fade-in">
                  ✓ Authenticated — redirecting…
                </p>
              )}
            </div>
          ) : (
            /* login form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="you@maximmechanical.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {!forgotMode && (
                <Input
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              )}
              {forgotMode ? (
                <div className="flex flex-col gap-3">
                  <Button type="submit" fullWidth>Send reset link</Button>
                  <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                  <Button type="submit" fullWidth size="lg">Sign in</Button>
                </>
              )}
            </form>
          )}

          {/* role hint */}
          {!isAuthenticating && (
            <div className="mt-6 pt-5 border-t border-neutral-200/60 dark:border-neutral-700/40">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-3 uppercase tracking-wider font-medium">Role Hierarchy</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {(['viewer', 'editor', 'admin', 'owner'] as const).map((role) => (
                  <span key={role} className={`text-xs px-2.5 py-1 rounded-full font-medium ${role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                        role === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                          'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* footer */}
      <div className="text-center pb-4 relative z-10">
        <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-600 tracking-wide">
          Week 1–2 · Authentication & Session Management
        </p>
      </div>
    </div>
  )
}

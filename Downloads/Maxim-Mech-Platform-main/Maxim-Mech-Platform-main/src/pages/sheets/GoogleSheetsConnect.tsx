import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function GoogleSheetsConnect() {
  const [connected, setConnected] = useState(false)
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const connect = () => {
    setConnected(true)
    setTimeout(() => navigate('/sheets/select'), 400)
  }

  if (connected) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        <Card padding="lg" className="text-center">
          <p className="text-brand-600 dark:text-brand-400 font-medium">Connecting...</p>
          <p className="text-sm text-neutral-500 mt-2">Redirecting to spreadsheet selection</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Google Sheets integration</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">HR only — connect your Google account to sync jobs from email.</p>
      </div>
      <Card padding="lg">
        <CardHeader>Connect Google account</CardHeader>
        <CardDescription>Sign in with the Google account that has access to your job spreadsheets.</CardDescription>
        <Input label="Google account email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-4" />
        <Button className="w-full mt-4" onClick={connect}>Connect with Google</Button>
        <p className="text-xs text-neutral-500 mt-3">We will request read/write access to spreadsheets you select.</p>
      </Card>
    </div>
  )
}

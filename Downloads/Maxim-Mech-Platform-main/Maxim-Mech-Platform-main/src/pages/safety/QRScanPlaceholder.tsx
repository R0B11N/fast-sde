import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function QRScanPlaceholder() {
  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <Card padding="lg">
        <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Scan site QR code</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Point your device camera at the site QR code to load the pre-start checklist or site-specific info.</p>
        <div className="mt-6 aspect-square max-w-[200px] mx-auto rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 text-sm">
          Camera placeholder
        </div>
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 text-center">In production, this would use the device camera for QR scanning.</p>
        <div className="mt-6 flex justify-center">
          <Link to="/safety"><Button variant="ghost">Back to Safety</Button></Link>
        </div>
      </Card>
    </div>
  )
}

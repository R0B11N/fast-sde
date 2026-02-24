import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

type QuickType = 'incident' | 'hazard' | 'near-miss'

export function QuickCaptureModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [type, setType] = useState<QuickType>('incident')
  const [description, setDescription] = useState('')
  const [site, setSite] = useState('')

  const go = () => {
    if (type === 'incident') navigate('/forms/new/t2')
    else if (type === 'near-miss') navigate('/forms/new/t4')
    else navigate('/forms/new/t5')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" role="dialog" aria-modal="true" onClick={onClose}>
      <Card padding="lg" className="max-w-md w-full shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Quick report</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Capture and open the full form to submit.</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as QuickType)} className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
              <option value="incident">Incident</option>
              <option value="near-miss">Near-miss</option>
              <option value="hazard">Hazard</option>
            </select>
          </div>
          <Input label="Site / location (optional)" value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g. North Site" />
          <Textarea label="Brief description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quick note..." rows={2} />
        </div>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={go}>Open full form</Button>
        </div>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium no-print">
      You appear to be offline. Drafts will sync when back online.
    </div>
  )
}

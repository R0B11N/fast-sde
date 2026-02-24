import { useFrank } from '@/contexts/FrankContext'

export function FrankButton() {
  const { openChat } = useFrank()

  return (
    <button
      type="button"
      onClick={openChat}
      className="touch-target flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      aria-label="Chat with Frank"
    >
      <span className="hidden sm:inline">Frank</span>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    </button>
  )
}

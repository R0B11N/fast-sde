import { useState, useRef, useEffect } from 'react'
import { useFrank } from '@/contexts/FrankContext'
import { useUser } from '@/contexts/UserContext'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'
import { useHRTodos } from '@/contexts/HRTodosContext'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm Frank, Maxim's internal assistant. I can help with policies, forms, and procedures. My answers are limited to your role and company policies. How can I help?",
  policy: "Based on your access, here's the relevant policy: [Policy excerpt]. Source: Safety Handbook 2025, Section 2.1.",
  incident: "To report an incident: use the Forms section and submit an Incident Report. A supervisor will be notified.",
}

export function FrankChat() {
  const { isOpen, closeChat } = useFrank()
  const { user } = useUser()
  const { reports: injuryReports } = useInjuryReports()
  const { addTodo } = useHRTodos()
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string; sources?: string[] }[]>([
    { id: '0', role: 'assistant', text: "Hi, I'm Frank. I can help with policies, forms, and procedures. My knowledge is limited to what your role allows. What would you like to know?", sources: ['Maxim Knowledge Base'] },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { id: Date.now().toString(), role: 'user', text }])
    setLoading(true)
    setError(null)
    const lower = text.toLowerCase()
    let reply = MOCK_RESPONSES.default
    const openInjuries = injuryReports.filter((r) => r.status !== 'closed')
    if ((lower.includes('open injur') || lower.includes('how many injur')) && (user?.role === 'hr' || user?.role === 'owner')) {
      reply = `There are ${openInjuries.length} open injury report(s) right now. You can view them under Injury reports.`
    } else if ((lower.includes('add to todo') || lower.includes('remind me') || lower.includes('add to my todo')) && (user?.role === 'hr' || user?.role === 'owner')) {
      const title = text.replace(/add to (my )?todo|remind me/gi, '').trim() || 'Task from Frank'
      const today = new Date().toISOString().slice(0, 10)
      addTodo({ title: title.slice(0, 200), recurrence: 'daily', dueDate: today, completed: false })
      reply = `I've added "${title.slice(0, 50)}${title.length > 50 ? '…' : ''}" to your Todo & calendar for today. Open Todo & calendar to see it.`
    } else if (lower.includes('policy')) reply = MOCK_RESPONSES.policy
    else if (lower.includes('incident')) reply = MOCK_RESPONSES.incident
    setTimeout(() => {
      setMessages((m) => [...m, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply, sources: ['Internal Policy DB'] }])
      setLoading(false)
    }, 800)
  }

  if (!isOpen) return null

  const roleLabel = user?.role === 'owner' ? 'Full access' : user?.role === 'supervisor' ? 'Site & team access' : 'Labourer access'

  return (
    <div className="fixed left-4 right-4 bottom-4 md:left-auto md:right-4 md:w-full md:max-w-md z-[95] h-[calc(100vh-5rem)] max-h-[600px] flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-500/30 bg-white/95 dark:bg-[rgb(26,35,50)]/95 backdrop-blur-xl shadow-soft-lg dark:shadow-dark-glow animate-slide-up safe-bottom overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold tracking-tight">Frank</span>
          <span className="text-xs opacity-90">AI Assistant</span>
        </div>
        <button type="button" onClick={closeChat} className="touch-target p-2 rounded-lg hover:bg-white/20 transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 min-w-0">
        <p className="text-xs text-amber-800 dark:text-amber-200 break-words">
          <strong>Limited access.</strong> Frank's answers and sources are restricted by your role ({roleLabel}). Do not rely on Frank for legal or emergency decisions.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-600/50 text-neutral-900 dark:text-slate-100'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <p className="text-xs opacity-80 mt-2 pt-2 border-t border-white/20">Sources: {msg.sources.join(', ')}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-2xl px-4 py-2.5">
              <span className="inline-flex gap-1"><span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} /></span>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm px-4 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask Frank..."
            rows={1}
            className="min-h-[44px] resize-none"
          />
          <Button onClick={send} disabled={loading} className="shrink-0">Send</Button>
        </div>
      </div>
    </div>
  )
}

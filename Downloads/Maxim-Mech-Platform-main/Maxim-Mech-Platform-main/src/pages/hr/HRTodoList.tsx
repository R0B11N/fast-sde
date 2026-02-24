import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useHRTodos } from '@/contexts/HRTodosContext'
import type { HRTodoItem, HRTodoRecurrence } from '@/types'

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar'
const RECURRENCE_OPTIONS: { value: HRTodoRecurrence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getWeekStart(d: string) {
  const date = new Date(d + 'T12:00:00Z')
  const day = date.getUTCDay()
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setUTCDate(diff)
  return monday.toISOString().slice(0, 10)
}

function getMonthStart(d: string) {
  return d.slice(0, 7) + '-01'
}

/** Format HH:mm to 12h am/pm (e.g. "14:30" -> "2:30 PM") */
function formatTime(hhmm: string) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const hour = h % 12 || 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function HRTodoList() {
  const { todos, addTodo, removeTodo, toggleComplete } = useHRTodos()
  const [view, setView] = useState<HRTodoRecurrence>('daily')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState(todayISO())
  const [newDueTime, setNewDueTime] = useState('')
  const [newRecurrence, setNewRecurrence] = useState<HRTodoRecurrence>('daily')

  const filtered = todos.filter((t) => {
    if (t.recurrence !== view) return false
    const tDue = t.dueDate
    const today = todayISO()
    if (view === 'daily') return tDue === today
    if (view === 'weekly') return getWeekStart(tDue) === getWeekStart(today)
    if (view === 'monthly') return getMonthStart(tDue) === getMonthStart(today)
    return true
  })

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    addTodo({
      title,
      recurrence: newRecurrence,
      dueDate: newDue,
      ...(newDueTime.trim() ? { dueTime: newDueTime.trim() } : {}),
      completed: false,
    })
    setNewTitle('')
    setNewDue(todayISO())
    setNewDueTime('')
    setNewRecurrence('daily')
    setShowAdd(false)
  }

  const openGoogleCalendarWeek = () => {
    window.open('https://calendar.google.com/calendar/u/0/r/week', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Todo & calendar</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track daily, weekly, and monthly tasks. Open Google Calendar to sync meetings and reminders.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={GOOGLE_CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
          >
            <span aria-hidden>📅</span>
            Open Google Calendar
          </a>
          <Button variant="secondary" onClick={openGoogleCalendarWeek}>
            Week view
          </Button>
        </div>
      </header>

      {/* View tabs: Daily | Weekly | Monthly */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-600 p-0.5 bg-neutral-100/50 dark:bg-neutral-800/50">
            {RECURRENCE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === value
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAdd(true)}>Add task</Button>
        </div>
      </Card>

      {/* Add task form */}
      {showAdd && (
        <Card padding="md" className="mb-6 border-brand-200 dark:border-brand-800">
          <CardHeader className="text-base">New task</CardHeader>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Task"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Review injury reports"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div>
              <label id="hr-todo-due-label" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="hr-todo-due">Due date</label>
              <input
                id="hr-todo-due"
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                aria-labelledby="hr-todo-due-label"
                className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-500/50 bg-white/90 dark:bg-neutral-800/90 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label id="hr-todo-time-label" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="hr-todo-time">Time (optional)</label>
              <input
                id="hr-todo-time"
                type="time"
                value={newDueTime}
                onChange={(e) => setNewDueTime(e.target.value)}
                aria-labelledby="hr-todo-time-label"
                className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-500/50 bg-white/90 dark:bg-neutral-800/90 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label id="hr-todo-cadence-label" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="hr-todo-cadence">Cadence</label>
              <select
                id="hr-todo-cadence"
                value={newRecurrence}
                onChange={(e) => setNewRecurrence(e.target.value as HRTodoRecurrence)}
                aria-labelledby="hr-todo-cadence-label"
                className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-500/50 bg-white/90 dark:bg-neutral-800/90 text-neutral-900 dark:text-white"
              >
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAdd} disabled={!newTitle.trim()}>Save</Button>
              <Button variant="secondary" onClick={() => { setShowAdd(false); setNewTitle(''); setNewDue(todayISO()); setNewDueTime('') }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Task list */}
      <Card padding="md">
        <CardHeader className="text-base">
          {view.charAt(0).toUpperCase() + view.slice(1)} tasks
        </CardHeader>
        <CardDescription>
          {view === 'daily' && 'Tasks due today'}
          {view === 'weekly' && 'Tasks for this week'}
          {view === 'monthly' && 'Tasks for this month'}
        </CardDescription>
        <ul className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">No tasks in this view. Add one or switch view.</li>
          ) : (
            filtered.map((t) => (
              <TodoRow
                key={t.id}
                item={t}
                onToggle={() => toggleComplete(t.id)}
                onRemove={() => removeTodo(t.id)}
              />
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}

function addToGoogleCalendarUrl(item: HRTodoItem): string {
  const start = item.dueTime
    ? `${item.dueDate.replace(/-/g, '')}T${item.dueTime.replace(':', '')}00`
    : `${item.dueDate.replace(/-/g, '')}T090000`
  const [h] = item.dueTime ? item.dueTime.split(':').map(Number) : [9]
  const endH = String((h + 1) % 24).padStart(2, '0')
  const end = item.dueTime
    ? `${item.dueDate.replace(/-/g, '')}T${endH}${item.dueTime.slice(2)}00`
    : `${item.dueDate.replace(/-/g, '')}T100000`
  const params = new URLSearchParams({ action: 'TEMPLATE', text: item.title, dates: `${start}/${end}` })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function TodoRow({
  item,
  onToggle,
  onRemove,
}: {
  item: HRTodoItem
  onToggle: () => void
  onRemove: () => void
}) {
  const today = todayISO()
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const isOverdue =
    !item.completed &&
    (item.dueDate < today || (item.dueDate === today && item.dueTime != null && item.dueTime < currentTime))

  const content = (
    <>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={onToggle}
        aria-label={`Mark "${item.title}" as ${item.completed ? 'incomplete' : 'complete'}`}
        className="h-5 w-5 rounded border-neutral-300 dark:border-neutral-600 text-brand-600 focus:ring-brand-500 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${item.completed ? 'line-through text-neutral-500 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
          {item.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <Badge variant="default" className="text-xs">{item.recurrence}</Badge>
          {isOverdue && <Badge variant="danger" className="text-xs">Overdue</Badge>}
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Due {item.dueDate}{item.dueTime ? ` at ${formatTime(item.dueTime)}` : ''}
          </span>
        </div>
      </div>
      <a href={addToGoogleCalendarUrl(item)} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline shrink-0">Add to calendar</a>
      {item.linkTo && (
        <Link
          to={item.linkTo}
          className="text-sm text-brand-600 dark:text-brand-400 hover:underline shrink-0"
        >
          Open
        </Link>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 text-sm shrink-0"
        aria-label="Remove task"
      >
        Remove
      </button>
    </>
  )

  return (
    <li className={`flex items-start gap-3 py-3 px-3 rounded-xl border transition-colors ${isOverdue ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' : 'border-neutral-100 dark:border-neutral-700/50 hover:border-neutral-200 dark:hover:border-neutral-600'}`}>
      {content}
    </li>
  )
}

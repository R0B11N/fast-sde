import type { SignableFormTemplate, User } from '@/types'

/** Returns true if the user can see and use this form template (assigned by role or person). */
export function canUserAccessTemplate(template: SignableFormTemplate, user: User | null): boolean {
  if (!user) return false
  if (user.role === 'owner' || user.role === 'hr') return true
  if (template.assignedToRoles?.includes(user.role)) return true
  if (template.assignedToUserIds?.includes(user.id)) return true
  return false
}

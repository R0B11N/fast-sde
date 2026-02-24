import type { DocumentRecord, User, UserRole } from '@/types'

/** Returns true if the user is allowed to view this document. */
export function canUserViewDocument(doc: DocumentRecord, user: User | null): boolean {
  if (!user) return false

  // New model: visibility + visibleToRoles + visibleToUserIds
  if (doc.visibility === 'everyone') return true
  if (doc.visibility === 'restricted') {
    if (doc.visibleToRoles?.includes(user.role)) return true
    if (doc.visibleToUserIds?.includes(user.id)) return true
    return false
  }

  // Legacy: roleRestricted means "only these roles can see"
  if (doc.roleRestricted && doc.roleRestricted.length > 0) {
    return doc.roleRestricted.includes(user.role as UserRole)
  }

  // No restrictions = everyone can see
  return true
}

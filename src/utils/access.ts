export type AppRole = "ADMIN" | "LECTURER" | "STUDENT" | "UNKNOWN"

export function normalizeRole(value: unknown): AppRole {
  const role = String(value ?? "").toUpperCase()
  if (role === "ADMIN" || role === "LECTURER" || role === "STUDENT") return role
  return "UNKNOWN"
}

export function groupsHomePath(role: AppRole): string {
  return role === "LECTURER" ? "/app/lecturer/groups/list" : "/app/groups"
}

export function canLecturerAccessGroup(group: any, lecturerUserId: number): boolean {
  if (!group || !lecturerUserId) return false
  const lecturerId = group?.lecturer?.id ?? group?.lecturerId ?? null
  return lecturerId != null && Number(lecturerId) === Number(lecturerUserId)
}

export function canMemberAccessGroup(memberships: any, groupId: number): boolean {
  const groups = memberships?.groups || []
  return Array.isArray(groups) && groups.some((g: any) => Number(g.groupId) === Number(groupId))
}

export function isStudentLeader(memberships: any): boolean {
  const groups = memberships?.groups || []
  return Array.isArray(groups) && groups.some((g: any) => String(g?.role || "").toUpperCase() === "LEADER")
}


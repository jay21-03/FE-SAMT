import { describe, expect, it } from 'vitest'
import {
  addMemberSchema,
  createGroupSchema,
  createSemesterSchema,
  updateGroupSchema,
} from '../../schemas/groupSchema'

describe('groupSchema', () => {
  it('accepts valid createSemester payload', () => {
    const parsed = createSemesterSchema.safeParse({
      semesterCode: '2026S1',
      semesterName: 'Semester 1 2026',
      startDate: '2026-01-01',
      endDate: '2026-05-31',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects invalid semester date format', () => {
    const parsed = createSemesterSchema.safeParse({
      semesterCode: '2026S1',
      semesterName: 'Semester 1 2026',
      startDate: '01-01-2026',
      endDate: '2026-05-31',
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts valid createGroup payload and regex-compliant groupName', () => {
    const parsed = createGroupSchema.safeParse({
      groupName: 'SE123-G1',
      semesterId: 12,
      lecturerId: 77,
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects invalid createGroup groupName pattern', () => {
    const parsed = createGroupSchema.safeParse({
      groupName: 'group-1',
      semesterId: 12,
      lecturerId: 77,
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects createGroup when ids are non-positive or not integers', () => {
    const parsed = createGroupSchema.safeParse({
      groupName: 'SE123-G1',
      semesterId: 0,
      lecturerId: 1.5,
    })

    expect(parsed.success).toBe(false)
  })

  it('allows updateGroup without groupName but requires positive lecturerId', () => {
    const parsed = updateGroupSchema.safeParse({ lecturerId: 5 })

    expect(parsed.success).toBe(true)
  })

  it('rejects updateGroup with invalid optional groupName', () => {
    const parsed = updateGroupSchema.safeParse({
      groupName: 'bad',
      lecturerId: 5,
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts addMember with positive integer userId and rejects zero', () => {
    expect(addMemberSchema.safeParse({ userId: 9 }).success).toBe(true)
    expect(addMemberSchema.safeParse({ userId: 0 }).success).toBe(false)
  })
})

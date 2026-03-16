import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '../../schemas/authSchema'

describe('authSchema', () => {
  it('accepts a valid login payload', () => {
    const parsed = loginSchema.safeParse({
      email: 'qa@samt.local',
      password: 'P@ssw0rd!',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects invalid login email', () => {
    const parsed = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'P@ssw0rd!',
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts a strong student registration payload', () => {
    const parsed = registerSchema.safeParse({
      email: 'student@samt.local',
      password: 'StrongP@ss1',
      confirmPassword: 'StrongP@ss1',
      fullName: 'Student Name',
      role: 'STUDENT',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects mismatched confirmation password', () => {
    const parsed = registerSchema.safeParse({
      email: 'student@samt.local',
      password: 'StrongP@ss1',
      confirmPassword: 'WrongP@ss1',
      fullName: 'Student Name',
      role: 'STUDENT',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'confirmPassword')).toBe(true)
    }
  })

  it('rejects weak password without required complexity', () => {
    const parsed = registerSchema.safeParse({
      email: 'student@samt.local',
      password: 'weakpass',
      confirmPassword: 'weakpass',
      fullName: 'Student Name',
      role: 'STUDENT',
    })

    expect(parsed.success).toBe(false)
  })
})
import { describe, expect, it } from 'vitest'
import { projectConfigSchema, updateProjectConfigSchema } from '../../schemas/projectConfigSchema'

describe('projectConfigSchema', () => {
  it('accepts valid create project config payload', () => {
    const parsed = projectConfigSchema.safeParse({
      groupId: 10,
      jiraHostUrl: 'https://jira.example.com',
      jiraEmail: 'qa@example.com',
      jiraApiToken: 'jira-token',
      githubRepoUrl: 'https://github.com/org/repo',
      githubToken: 'gh-token',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects invalid create payload values', () => {
    const parsed = projectConfigSchema.safeParse({
      groupId: 0,
      jiraHostUrl: 'not-a-url',
      jiraEmail: 'invalid',
      jiraApiToken: '',
      githubRepoUrl: 'still-not-a-url',
      githubToken: '',
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts partial update payload', () => {
    const parsed = updateProjectConfigSchema.safeParse({
      jiraHostUrl: 'https://jira.example.com',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects malformed update payload', () => {
    const parsed = updateProjectConfigSchema.safeParse({
      jiraEmail: 'bad-email',
      githubRepoUrl: 'bad-url',
      jiraApiToken: '',
    })

    expect(parsed.success).toBe(false)
  })
})
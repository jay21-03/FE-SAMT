import { z } from "zod"

export const projectConfigSchema = z.object({
  groupId: z.number().int().positive(),
  jiraHostUrl: z.string().url(),
  jiraApiToken: z.string().min(1),
  githubRepoUrl: z.string().url(),
  githubToken: z.string().min(1),
})

export const updateProjectConfigSchema = z.object({
  jiraHostUrl: z.string().url().optional(),
  jiraApiToken: z.string().min(1).optional(),
  githubRepoUrl: z.string().url().optional(),
  githubToken: z.string().min(1).optional(),
})

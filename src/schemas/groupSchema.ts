import { z } from "zod"

const groupNameRegex = /^[A-Z]{2,4}[0-9]{2,4}-G[0-9]+$/

export const createSemesterSchema = z.object({
  semesterCode: z.string().min(1),
  semesterName: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
})

export const createGroupSchema = z.object({
  groupName: z.string().min(3).max(50).regex(groupNameRegex),
  semesterId: z.number().int().positive(),
  lecturerId: z.number().int().positive(),
})

export const updateGroupSchema = z.object({
  groupName: z.string().min(3).max(50).regex(groupNameRegex).optional(),
  lecturerId: z.number().int().positive(),
})

export const addMemberSchema = z.object({
  userId: z.number().int().positive(),
})

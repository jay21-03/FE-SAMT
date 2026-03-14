import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('../../../api/apiClient.ts', () => ({
  api: {
    get: getMock,
  },
}))

import { userGroupApi } from '../../../api/userGroupApi'

describe('userGroupApi', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('strips empty query params when listing users', async () => {
    getMock.mockResolvedValue({ data: { data: { content: [] } } })

    await userGroupApi.listUsers({ page: 0, size: 20, role: 'ADMIN', search: '' } as any)

    expect(getMock).toHaveBeenCalledWith('/api/users', {
      params: { page: 0, size: 20, role: 'ADMIN' },
    })
  })

  it('normalizes group members from paged content shape', async () => {
    getMock.mockResolvedValue({
      data: {
        data: {
          content: [{ userId: 1, fullName: 'Member One' }],
        },
      },
    })

    const members = await userGroupApi.getGroupMembers(10)
    expect(members).toEqual([{ userId: 1, fullName: 'Member One' }])
  })

  it('returns direct member array payload as-is', async () => {
    getMock.mockResolvedValue({
      data: [{ userId: 2, fullName: 'Member Two' }],
    })

    const members = await userGroupApi.getGroupMembers(11)
    expect(members).toEqual([{ userId: 2, fullName: 'Member Two' }])
  })
})

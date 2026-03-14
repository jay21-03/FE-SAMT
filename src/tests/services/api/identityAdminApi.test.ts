import { beforeEach, describe, expect, it, vi } from 'vitest'
import { identityAdminApi } from '../../../api/identityAdminApi'

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('../../../api/apiClient.ts', () => ({
  api: {
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  },
}))

describe('identityAdminApi', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
    deleteMock.mockReset()
  })

  it('creates/deletes/restores user', async () => {
    postMock.mockResolvedValue({ data: { id: 1 } })
    deleteMock.mockResolvedValue({ data: { success: true } })

    const created = await identityAdminApi.createUser({ email: 'admin@qa.com' })
    const deleted = await identityAdminApi.deleteUser(1)
    const restored = await identityAdminApi.restoreUser(1)

    expect(postMock).toHaveBeenCalledWith('/api/admin/users', { email: 'admin@qa.com' })
    expect(deleteMock).toHaveBeenCalledWith('/api/admin/users/1')
    expect(postMock).toHaveBeenCalledWith('/api/admin/users/1/restore')
    expect(created).toEqual({ id: 1 })
    expect(deleted).toEqual({ success: true })
    expect(restored).toEqual({ id: 1 })
  })

  it('locks/unlocks and updates external accounts', async () => {
    postMock.mockResolvedValue({ data: { success: true } })
    putMock.mockResolvedValue({ data: { linked: true } })

    const locked = await identityAdminApi.lockUser(7, 'policy')
    const unlocked = await identityAdminApi.unlockUser(7)
    const updated = await identityAdminApi.updateExternalAccounts(7, { jiraAccountId: 'jira-1' })

    expect(postMock).toHaveBeenCalledWith('/api/admin/users/7/lock', undefined, {
      params: { reason: 'policy' },
    })
    expect(postMock).toHaveBeenCalledWith('/api/admin/users/7/unlock')
    expect(putMock).toHaveBeenCalledWith('/api/admin/users/7/external-accounts', { jiraAccountId: 'jira-1' })
    expect(locked).toEqual({ success: true })
    expect(unlocked).toEqual({ success: true })
    expect(updated).toEqual({ linked: true })
  })

  it('fetches audit endpoints', async () => {
    getMock.mockResolvedValue({ data: { content: [] } })

    const security = await identityAdminApi.getSecurityEvents({ page: 0, size: 10 })
    const range = await identityAdminApi.getAuditByRange({ page: 0, size: 10 })
    const byEntity = await identityAdminApi.getAuditByEntity('USER', 2, { page: 0, size: 10 })
    const byActor = await identityAdminApi.getAuditByActor(3, { page: 0, size: 10 })

    expect(getMock).toHaveBeenCalledWith('/api/admin/audit/security-events', { params: { page: 0, size: 10 } })
    expect(getMock).toHaveBeenCalledWith('/api/admin/audit/range', { params: { page: 0, size: 10 } })
    expect(getMock).toHaveBeenCalledWith('/api/admin/audit/entity/USER/2', { params: { page: 0, size: 10 } })
    expect(getMock).toHaveBeenCalledWith('/api/admin/audit/actor/3', { params: { page: 0, size: 10 } })
    expect(security).toEqual({ content: [] })
    expect(range).toEqual({ content: [] })
    expect(byEntity).toEqual({ content: [] })
    expect(byActor).toEqual({ content: [] })
  })
})

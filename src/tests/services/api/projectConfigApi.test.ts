import { beforeEach, describe, expect, it, vi } from 'vitest'
import { projectConfigApi } from '../../../api/projectConfigApi'

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

describe('projectConfigApi', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
    deleteMock.mockReset()
  })

  it('creates config', async () => {
    postMock.mockResolvedValue({ data: { id: 'cfg-1' } })
    const result = await projectConfigApi.createConfig({ groupId: 1 })

    expect(postMock).toHaveBeenCalledWith('/api/project-configs', { groupId: 1 })
    expect(result).toEqual({ id: 'cfg-1' })
  })

  it('gets and updates config', async () => {
    getMock.mockResolvedValue({ data: { id: 'cfg-1' } })
    putMock.mockResolvedValue({ data: { id: 'cfg-1', jiraEmail: 'qa@edu.vn' } })

    const fetched = await projectConfigApi.getConfig('cfg-1')
    const updated = await projectConfigApi.updateConfig('cfg-1', { jiraEmail: 'qa@edu.vn' })

    expect(getMock).toHaveBeenCalledWith('/api/project-configs/cfg-1')
    expect(putMock).toHaveBeenCalledWith('/api/project-configs/cfg-1', { jiraEmail: 'qa@edu.vn' })
    expect(fetched).toEqual({ id: 'cfg-1' })
    expect(updated).toEqual({ id: 'cfg-1', jiraEmail: 'qa@edu.vn' })
  })

  it('deletes, verifies, restores and fetches by group', async () => {
    deleteMock.mockResolvedValue({ data: { success: true } })
    postMock.mockResolvedValue({ data: { success: true } })
    getMock.mockResolvedValue({ data: { id: 'cfg-2' } })

    const deleted = await projectConfigApi.deleteConfig('cfg-2')
    const verified = await projectConfigApi.verifyConfig('cfg-2')
    const restored = await projectConfigApi.restoreConfig('cfg-2')
    const byGroup = await projectConfigApi.getConfigByGroupId(2)

    expect(deleteMock).toHaveBeenCalledWith('/api/project-configs/cfg-2')
    expect(postMock).toHaveBeenCalledWith('/api/project-configs/cfg-2/verify')
    expect(postMock).toHaveBeenCalledWith('/api/project-configs/admin/cfg-2/restore')
    expect(getMock).toHaveBeenCalledWith('/api/project-configs/group/2')
    expect(deleted).toEqual({ success: true })
    expect(verified).toEqual({ success: true })
    expect(restored).toEqual({ success: true })
    expect(byGroup).toEqual({ id: 'cfg-2' })
  })
})

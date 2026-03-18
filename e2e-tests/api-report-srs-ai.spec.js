import { expect, test } from '@playwright/test'
import JSZip from 'jszip'

const apiUrl = process.env.E2E_API_URL || 'http://localhost:9080'

async function loginAndGetAccessToken(request, { email, password }) {
  const resp = await request.post(`${apiUrl}/api/auth/login`, {
    headers: { 'content-type': 'application/json' },
    data: { email, password },
    timeout: 45_000,
  })
  expect(resp.status(), 'login status').toBe(200)
  const body = await resp.json().catch(() => ({}))
  const token = body?.data?.accessToken ?? null
  expect(token, 'accessToken present').toBeTruthy()
  return token
}

async function findGroupIdByName(request, accessToken, groupName) {
  for (let page = 0; page < 20; page++) {
    const resp = await request.get(`${apiUrl}/api/groups?page=${page}&size=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 45_000,
    })
    expect(resp.status(), `listGroups status (page=${page})`).toBe(200)
    const body = await resp.json().catch(() => ({}))
    const content = body?.data?.content ?? []
    const match = content.find((g) => g?.groupName === groupName)
    if (match?.id) return match.id
    const totalPages = body?.data?.totalPages
    if (typeof totalPages === 'number' && page >= totalPages - 1) break
    if (!Array.isArray(content) || content.length === 0) break
  }
  throw new Error(`Could not find groupId for groupName="${groupName}" via /api/groups`)
}

async function getProjectConfigIdForGroup(request, accessToken, groupId) {
  const resp = await request.get(`${apiUrl}/api/project-configs/group/${groupId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 45_000,
  })
  expect(resp.status(), 'getConfigByGroupId status').toBe(200)
  const body = await resp.json().catch(() => ({}))
  const id = body?.data?.id ?? null
  expect(id, 'projectConfigId present').toBeTruthy()
  return id
}

async function downloadDocxXml(request, accessToken, downloadUrl) {
  const resp = await request.get(`${apiUrl}${downloadUrl}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 180_000,
  })
  expect(resp.status(), 'download status').toBe(200)
  const bytes = await resp.body()
  const zip = await JSZip.loadAsync(bytes)
  const xml = await zip.file('word/document.xml')?.async('string')
  expect(xml, 'docx document.xml present').toBeTruthy()
  return xml
}

test.describe('API-only SRS report generation (AI=true)', () => {
  test('POST /api/reports/srs uses AI (no NON_AI fallback)', async ({ request }) => {
    test.setTimeout(12 * 60 * 1000)
    const email = 'Lecturer@gmail.com'
    const password = 'Ph@050204'
    const groupName = 'SE1804-G5'

    const accessToken = await loginAndGetAccessToken(request, { email, password })
    const groupId = await findGroupIdByName(request, accessToken, groupName)
    const projectConfigId = await getProjectConfigIdForGroup(request, accessToken, groupId)

    const generateResp = await request.post(`${apiUrl}/api/reports/srs`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      data: { projectConfigId, useAi: true, exportType: 'DOCX' },
      timeout: 600_000,
    })

    expect([200, 201]).toContain(generateResp.status())
    const generateBody = await generateResp.json().catch(() => ({}))
    const reportId = generateBody?.data?.reportId ?? null
    const downloadUrl = generateBody?.data?.downloadUrl ?? null
    expect(reportId, 'reportId present').toBeTruthy()
    expect(downloadUrl, 'downloadUrl present').toBeTruthy()

    const xml = await downloadDocxXml(request, accessToken, downloadUrl)

    // Strict: fail if backend fell back to deterministic non-AI content.
    expect(xml).not.toContain('Mode: NON_AI')

    // Sanity that the AI writer produced the expected report structure.
    expect(xml).toContain('Functional Requirements')
    expect(xml).toContain('Non-Functional Requirements')

    // Basic schema-ish checks from rendered content (report API does not return structured requirements).
    const ids = Array.from(xml.matchAll(/\b(?:FR|NFR)-\d{3}\b/g)).map((m) => m[0])
    expect(ids.length, 'at least one requirement id present').toBeGreaterThan(0)
  })
})


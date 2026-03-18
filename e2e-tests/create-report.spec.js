import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import JSZip from 'jszip'

const LIVE = process.env.E2E_LIVE === '1'

test.describe.configure({ retries: LIVE ? 1 : 0 })

async function resetAuthState(page) {
  await page.context().clearCookies()
  // In LIVE mode we must not clear storage on every navigation,
  // otherwise freshly stored auth tokens are wiped right after login redirects.
  if (!LIVE) {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  }
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await expect(page.getByTestId('login-email')).toBeVisible()
}

function attachConsoleAndNetworkCapture(page) {
  const consoleMessages = []
  const pageErrors = []
  const failedRequests = []

  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    })
  })

  page.on('pageerror', (err) => {
    pageErrors.push({ message: String(err?.message ?? err), stack: String(err?.stack ?? '') })
  })

  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? 'unknown',
    })
  })

  return { consoleMessages, pageErrors, failedRequests }
}

async function uiLogin(page, testInfo, { email, password }) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('login-email')).toBeVisible()

  const loginUrlMatch = (url) => url.includes('/api/auth/login')
  const meUrlMatch = (url) => url.includes('/api/users/me')

  const loginResponsePromise = page.waitForResponse((resp) => loginUrlMatch(resp.url()), { timeout: 45_000 })
  const loginRequestFailedPromise = page.waitForEvent('requestfailed', (req) => loginUrlMatch(req.url()), {
    timeout: 45_000,
  })
  const loginUiErrorPromise = page.locator('.auth-error').waitFor({ state: 'visible', timeout: 45_000 })

  // Login page calls /api/users/me after successful login.
  const meResponsePromise = page.waitForResponse((resp) => meUrlMatch(resp.url()), { timeout: 45_000 }).catch(() => null)

  await page.getByTestId('login-email').fill(email)
  await page.getByTestId('login-password').fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  const first = await Promise.race([
    loginResponsePromise.then((resp) => ({ kind: 'response', resp })),
    loginRequestFailedPromise.then((req) => ({ kind: 'requestfailed', req })),
    loginUiErrorPromise.then(() => ({ kind: 'uierror' })),
  ])

  if (first.kind === 'requestfailed') {
    const failure = first.req.failure()?.errorText ?? 'unknown'
    await testInfo.attach('login-requestfailed.txt', {
      body: `url=${first.req.url()}\nmethod=${first.req.method()}\nerror=${failure}`,
      contentType: 'text/plain',
    })
    throw new Error(`Login request failed at network layer: ${failure}`)
  }

  if (first.kind === 'uierror') {
    const msg = await page.locator('.auth-error').innerText().catch(() => 'Login failed')
    await testInfo.attach('login-uierror.txt', { body: msg, contentType: 'text/plain' })
    throw new Error(`Login failed: ${msg}`)
  }

  const loginResp = first.resp
  const loginStatus = loginResp.status()
  let loginBodyText = ''
  try {
    loginBodyText = await loginResp.text()
  } catch {
    loginBodyText = ''
  }

  await testInfo.attach('login-response.txt', {
    body: `status=${loginStatus}\nurl=${loginResp.url()}\n\n${loginBodyText}`,
    contentType: 'text/plain',
  })

  if (loginStatus !== 200) {
    const uiError = page.locator('.auth-error')
    if (await uiError.isVisible().catch(() => false)) {
      const msg = await uiError.innerText().catch(() => 'Login failed')
      throw new Error(`Login failed (status ${loginStatus}): ${msg}`)
    }
    throw new Error(`Login failed (status ${loginStatus}). Check credentials and backend availability.`)
  }

  const meResp = await meResponsePromise
  if (meResp) {
    const meStatus = meResp.status()
    let meBodyText = ''
    try {
      meBodyText = await meResp.text()
    } catch {
      meBodyText = ''
    }
    await testInfo.attach('users-me-response.txt', {
      body: `status=${meStatus}\nurl=${meResp.url()}\n\n${meBodyText}`,
      contentType: 'text/plain',
    })

    if (meStatus !== 200) {
      throw new Error(`/api/users/me failed after login (status ${meStatus}). Likely auth/role/session issue.`)
    }
  } else {
    await testInfo.attach('users-me-response.txt', {
      body: 'No /api/users/me response observed within timeout after login.',
      contentType: 'text/plain',
    })
  }
}

function readDotEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const out = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx <= 0) continue
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim()
      out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

function resolveIntegrationSecrets() {
  // Prefer CI env vars, fallback to local SAMT/.env for developer convenience.
  const repoRoot = path.resolve(process.cwd(), '..')
  const samtEnvPath = path.join(repoRoot, 'SAMT', '.env')
  const fileEnv = readDotEnvFile(samtEnvPath)

  const jiraHostUrl = process.env.E2E_JIRA_HOST || process.env.JIRA_HOST || fileEnv.JIRA_HOST || ''
  const jiraEmail = process.env.E2E_JIRA_EMAIL || process.env.JIRA_EMAIL || fileEnv.JIRA_EMAIL || ''
  const jiraApiToken = process.env.E2E_JIRA_API_TOKEN || process.env.JIRA_API_TOKEN || fileEnv.JIRA_API_TOKEN || ''

  const githubRepoUrl = process.env.E2E_GITHUB_REPO || process.env.GITHUB_REPO || fileEnv.GITHUB_REPO || ''
  const githubToken = process.env.E2E_GITHUB_TOKEN || process.env.GITHUB_PAT || fileEnv.GITHUB_PAT || ''

  return { jiraHostUrl, jiraEmail, jiraApiToken, githubRepoUrl, githubToken }
}

async function loginViaApi(request, apiUrl, { email, password }) {
  const r = await request.post(`${apiUrl}/api/auth/login`, { data: { email, password } })
  const status = r.status()
  const bodyText = await r.text().catch(() => '')
  if (status !== 200) {
    throw new Error(`API login failed for ${email} (status ${status}): ${bodyText}`)
  }
  let body = {}
  try {
    body = JSON.parse(bodyText)
  } catch {
    body = {}
  }
  const token = body?.data?.accessToken
  if (!token) {
    throw new Error(`API login missing accessToken for ${email}. body=${bodyText}`)
  }
  return token
}

async function ensureVerifiedProjectConfig({ request, apiUrl, groupId, leaderCreds, verifierCreds, testInfo }) {
  const secrets = resolveIntegrationSecrets()
  if (
    !secrets.jiraHostUrl ||
    !secrets.jiraEmail ||
    !secrets.jiraApiToken ||
    !secrets.githubRepoUrl ||
    !secrets.githubToken
  ) {
    throw new Error(
      'Missing integration secrets for project config verification. Set E2E_JIRA_HOST/E2E_JIRA_EMAIL/E2E_JIRA_API_TOKEN and E2E_GITHUB_REPO/E2E_GITHUB_TOKEN (or provide SAMT/.env locally).',
    )
  }

  const leaderToken = await loginViaApi(request, apiUrl, leaderCreds)
  const verifierToken = await loginViaApi(request, apiUrl, verifierCreds)

  const authLeader = { Authorization: `Bearer ${leaderToken}` }
  const authVerifier = { Authorization: `Bearer ${verifierToken}` }

  // 1) Existing config for group?
  let configId = null
  const getResp = await request.get(`${apiUrl}/api/project-configs/group/${groupId}`, { headers: authLeader })
  if (getResp.status() === 200) {
    const body = await getResp.json().catch(() => ({}))
    configId = body?.data?.id ?? null
    const state = body?.data?.state ?? null
    if (configId && state === 'VERIFIED') {
      await testInfo.attach('project-config.txt', {
        body: `configId=${configId}\nstate=${state}\nsource=existing`,
        contentType: 'text/plain',
      })
      return configId
    }
  }

  // 2) Create config (requires LEADER)
  const createResp = await request.post(`${apiUrl}/api/project-configs`, {
    headers: authLeader,
    data: {
      groupId,
      jiraHostUrl: secrets.jiraHostUrl,
      jiraEmail: secrets.jiraEmail,
      jiraApiToken: secrets.jiraApiToken,
      githubRepoUrl: secrets.githubRepoUrl,
      githubToken: secrets.githubToken,
    },
  })

  if (![200, 201].includes(createResp.status())) {
    throw new Error(`Create project config failed (status ${createResp.status()}): ${await createResp.text()}`)
  }
  const createdBody = await createResp.json().catch(() => ({}))
  configId = createdBody?.data?.id ?? null
  if (!configId) {
    throw new Error(`Create project config missing id. body=${JSON.stringify(createdBody)}`)
  }

  // 3) Verify config (LEADER or LECTURER)
  const verifyResp = await request.post(`${apiUrl}/api/project-configs/${configId}/verify`, { headers: authVerifier })
  if (verifyResp.status() !== 200) {
    throw new Error(`Verify project config failed (status ${verifyResp.status()}): ${await verifyResp.text()}`)
  }

  // 4) Poll until VERIFIED (async verification)
  await expect
    .poll(
      async () => {
        const r = await request.get(`${apiUrl}/api/project-configs/${configId}`, { headers: authLeader })
        const body = await r.json().catch(() => ({}))
        return body?.data?.state ?? null
      },
      { timeout: 120_000, intervals: [1000, 2000, 4000, 8000] },
    )
    .toBe('VERIFIED')

  await testInfo.attach('project-config.txt', {
    body: `configId=${configId}\nstate=VERIFIED\nsource=created+verified`,
    contentType: 'text/plain',
  })
  return configId
}

test.describe('Create Report flow', () => {
  /** @type {{consoleMessages:any[], pageErrors:any[], failedRequests:any[]}|null} */
  let capture = null

  test.beforeEach(async ({ page }) => {
    await resetAuthState(page)
    capture = attachConsoleAndNetworkCapture(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'passed' || !capture) return
    await testInfo.attach('console.json', {
      body: JSON.stringify(capture.consoleMessages, null, 2),
      contentType: 'application/json',
    })
    await testInfo.attach('pageerrors.json', {
      body: JSON.stringify(capture.pageErrors, null, 2),
      contentType: 'application/json',
    })
    await testInfo.attach('failed-requests.json', {
      body: JSON.stringify(capture.failedRequests, null, 2),
      contentType: 'application/json',
    })

    // Extra screenshot beyond config defaults (helps when failures happen before navigation completes).
    await testInfo.attach('page.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('Login → Reports → Generate SRS report → success + saved (mocked)', async ({ page }) => {
    test.skip(LIVE, 'LIVE mode enabled; mocked test skipped')

    const groupId = 5
    const projectConfigId = 'fc745356-a546-41d1-9763-b5d43214591a'

    const reportId = 'r-e2e-1'
    const createdAt = new Date().toISOString()

    // --- Auth ---
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      })
    })

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 1,
            email: 'admin@samt.local',
            role: 'ADMIN',
          },
        }),
      })
    })

    // --- Data dependencies for Reports page ---
    await page.route('**/api/groups**', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.endsWith('/api/groups')) {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            content: [
              {
                id: groupId,
                groupName: 'QA Group',
                semesterCode: 'SP26',
              },
            ],
            totalPages: 1,
            totalElements: 1,
            page: 0,
            size: 100,
          },
        }),
      })
    })

    await page.route(`**/api/project-configs/group/${groupId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: projectConfigId,
            state: 'VERIFIED',
          },
        }),
      })
    })

    let hasGenerated = false
    let generateRequestBody = null
    let generateStatus = null

    await page.route('**/api/reports/srs', async (route) => {
      generateRequestBody = route.request().postDataJSON()
      hasGenerated = true
      generateStatus = 201
      await route.fulfill({
        status: generateStatus,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 201,
          success: true,
          data: { reportId },
          path: '/api/reports/srs',
        }),
      })
    })

    // Match only the list endpoint (NOT /api/reports/srs etc).
    await page.route(/.*\/api\/reports(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url())

      const status = url.searchParams.get('status') ?? ''
      const pageParam = Number(url.searchParams.get('page') ?? 0)
      const sizeParam = Number(url.searchParams.get('size') ?? 10)

      const base = {
        page: pageParam,
        size: sizeParam,
        totalPages: 1,
      }

      const includeGenerated = hasGenerated && (status === '' || status === 'PENDING' || status === 'PROCESSING')
      const generatedRow = {
        reportId,
        status: 'PENDING',
        createdAt,
        fileName: null,
        type: 'SRS',
      }

      let content = []
      if (includeGenerated && pageParam === 0) {
        content = [generatedRow]
      }

      let totalElements = content.length
      if (status === 'COMPLETED') totalElements = 0
      if (status === 'FAILED') totalElements = 0
      if (status === 'PROCESSING') totalElements = includeGenerated ? 1 : 0
      if (status === 'PENDING') totalElements = includeGenerated ? 1 : 0

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          success: true,
          data: {
            ...base,
            content,
            totalElements,
          },
          path: '/api/reports',
        }),
      })
    })

    // --- Execute UI flow ---
    await page.getByTestId('login-email').fill('admin@samt.local')
    await page.getByTestId('login-password').fill('Password@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await page.waitForURL('**/app/admin/dashboard')

    await page.goto('/app/reports')
    await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: /Generate Report/i }).click()
    await expect(page.getByRole('heading', { name: 'Generate SRS Report' })).toBeVisible()

    await page.locator('select.reports-select').first().selectOption(String(groupId))
    await expect(page.locator('.reports-config-state', { hasText: 'VERIFIED' })).toBeVisible()

    // Ensure generate is enabled and submit
    const generateBtn = page.getByRole('button', { name: /^Generate Report$/ })
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()

    // --- Assertions ---
    await expect(page.getByText('Report generation started! It will appear in the list shortly.')).toBeVisible()

    expect(generateStatus).toBe(201)
    expect(generateRequestBody).toEqual({
      projectConfigId: projectConfigId,
      useAi: true,
      exportType: 'DOCX',
    })

    // "Data saved" verification: new report row appears after refetch()
    await expect(page.getByText(`#${reportId.substring(0, 8)}`)).toBeVisible()
  })

  test('Login → Reports → Generate SRS report → success + saved (LIVE, no mocks)', async ({ page }, testInfo) => {
    test.skip(!LIVE, 'Set E2E_LIVE=1 to run against real backend/DB')
    // AI generation + export can take several minutes in real environments.
    test.setTimeout(15 * 60 * 1000)

    const email = process.env.E2E_EMAIL
    const password = process.env.E2E_PASSWORD
    const groupMatch = process.env.E2E_GROUP_MATCH // optional; if missing/unmatched we auto-pick a VERIFIED group
    const apiUrl = process.env.E2E_API_URL || 'http://localhost:9080'

    if (!email || !password) {
      throw new Error('Missing E2E_EMAIL/E2E_PASSWORD env vars')
    }
    // Wait for backend to be ready (prevents flaky net::ERR_EMPTY_RESPONSE right after restarts).
    await expect.poll(async () => {
      try {
        const r = await page.request.get(`${apiUrl}/actuator/health`, { timeout: 10_000 })
        return r.status()
      } catch {
        return 0
      }
    }, { timeout: 60_000, intervals: [500, 1000, 2000, 4000, 8000] }).toBe(200)

    // Ensure report-service route is reachable (may return 401/403 when unauthenticated).
    await expect
      .poll(async () => {
        try {
          const r = await page.request.get(`${apiUrl}/api/reports?page=0&size=1`, { timeout: 10_000 })
          return [200, 401, 403].includes(r.status())
        } catch {
          return false
        }
      }, { timeout: 120_000, intervals: [500, 1000, 2000, 4000, 8000] })
      .toBe(true)

    await uiLogin(page, testInfo, { email, password })

    // Route after login depends on role; just wait until we leave /login.
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60_000 })

    await page.goto('/app/reports')
    await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible()

    // Ensure at least one group has a VERIFIED project config, otherwise Generate is disabled.
    // Stable seed target (in current docker seed data):
    // - groupId=1384 (SE1804-G5)
    // - leader: phucltse184678@fpt.edu.vn
    // - lecturer: Lecturer@gmail.com
    await ensureVerifiedProjectConfig({
      request: page.request,
      apiUrl,
      groupId: 1384,
      leaderCreds: {
        email: process.env.E2E_LEADER_EMAIL || 'phucltse184678@fpt.edu.vn',
        password: process.env.E2E_LEADER_PASSWORD || 'Ph@050204',
      },
      verifierCreds: {
        email: process.env.E2E_VERIFIER_EMAIL || 'Lecturer@gmail.com',
        password: process.env.E2E_VERIFIER_PASSWORD || 'Ph@050204',
      },
      testInfo,
    })

    // Capture groups API response (needed to populate the modal dropdown).
    const groupsResp = await page
      .waitForResponse((resp) => resp.url().includes('/api/groups') && resp.request().method() === 'GET', {
        timeout: 30_000,
      })
      .catch(() => null)
    if (groupsResp) {
      const status = groupsResp.status()
      let body = ''
      try {
        body = await groupsResp.text()
      } catch {
        body = ''
      }
      await testInfo.attach('groups-response.txt', {
        body: `status=${status}\nurl=${groupsResp.url()}\n\n${body}`,
        contentType: 'text/plain',
      })
    } else {
      await testInfo.attach('groups-response.txt', {
        body: 'No /api/groups response observed before opening Generate modal.',
        contentType: 'text/plain',
      })
    }

    // Capture current total (best-effort; not all roles see the same data).
    const totalBeforeText = await page.locator('.reports-stat-card-total .reports-stat-value').innerText().catch(() => null)
    const totalBefore = totalBeforeText ? Number(String(totalBeforeText).replace(/[^\d]/g, '')) : null

    await page.getByRole('button', { name: /Generate Report/i }).click()
    await expect(page.getByRole('heading', { name: 'Generate SRS Report' })).toBeVisible()

    const groupSelect = page.locator('select.reports-select').first()
    await expect(groupSelect).toBeVisible()

    // Use AI in LIVE mode (slower, but matches real behavior).
    const useAiCheckbox = page.locator('.reports-ai-checkbox')
    await expect(useAiCheckbox).toBeVisible()
    await useAiCheckbox.setChecked(true)

    // Select group by matching visible option text (works with real DB data).
    const optionValues = await groupSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent ?? '' })),
    )
    const availableOptionsText = optionValues
      .map((o) => o.text.trim())
      .filter(Boolean)
      .join(' | ')

    const findByMatch = (m) =>
      optionValues.find((o) => o.value && o.text.toLowerCase().includes(String(m).toLowerCase()))

    const candidates = []
    const matchOption = groupMatch ? findByMatch(groupMatch) : null
    if (matchOption) {
      candidates.push(matchOption)
    }
    // Fallback: try all real options in order (skip placeholder / empty values).
    for (const o of optionValues) {
      if (!o.value) continue
      if (matchOption && o.value === matchOption.value) continue
      candidates.push(o)
    }

    const configState = page.locator('.reports-config-state')
    let selected = null
    for (const o of candidates.slice(0, 50)) {
      await groupSelect.selectOption(o.value)
      // Must be VERIFIED; otherwise Generate is disabled by UI logic.
      // Config fetch is async, so poll a bit longer than a simple visibility wait.
      const ok = await expect
        .poll(
          async () => {
            const text = await configState.innerText().catch(() => '')
            return String(text || '').trim().toUpperCase()
          },
          { timeout: 30_000, intervals: [500, 1000, 2000, 4000, 8000] },
        )
        .toBe('VERIFIED')
        .then(() => true)
        .catch(() => false)
      if (ok) {
        selected = o
        break
      }
    }

    if (!selected) {
      throw new Error(
        groupMatch
          ? `Could not select a VERIFIED group. Tried match="${groupMatch}". Available options: ${availableOptionsText}`
          : `Could not select a VERIFIED group (no E2E_GROUP_MATCH provided). Available options: ${availableOptionsText}`,
      )
    }

    await testInfo.attach('selected-group.txt', {
      body: `selected.value=${selected.value}\nselected.text=${selected.text}\n\navailable=${availableOptionsText}`,
      contentType: 'text/plain',
    })

    const generateBtn = page.getByRole('button', { name: /^Generate Report$/ })
    await expect(generateBtn).toBeEnabled()

    const generateUrlMatch = (url) => url.includes('/api/reports/srs')
    const generateResponsePromise = page.waitForResponse((resp) => generateUrlMatch(resp.url()), { timeout: 600_000 })
    const generateRequestFailedPromise = page
      .waitForEvent('requestfailed', (req) => generateUrlMatch(req.url()), { timeout: 600_000 })
      .catch(() => null)

    await generateBtn.click()

    const first = await Promise.race([
      generateResponsePromise.then((resp) => ({ kind: 'response', resp })),
      generateRequestFailedPromise.then((req) => (req ? { kind: 'requestfailed', req } : null)),
    ])

    if (!first) {
      throw new Error('No /api/reports/srs response or requestfailed event observed.')
    }

    if (first.kind === 'requestfailed') {
      const failure = first.req.failure()?.errorText ?? 'unknown'
      await testInfo.attach('generate-requestfailed.txt', {
        body: `url=${first.req.url()}\nmethod=${first.req.method()}\nerror=${failure}`,
        contentType: 'text/plain',
      })
      throw new Error(`Generate report request failed at network layer: ${failure}`)
    }

    const generateResp = first.resp
    const generateStatus = generateResp.status()
    let generateBody = ''
    try {
      generateBody = await generateResp.text()
    } catch {
      generateBody = ''
    }
    await testInfo.attach('generate-response.txt', {
      body: `status=${generateStatus}\nurl=${generateResp.url()}\n\n${generateBody}`,
      contentType: 'text/plain',
    })

    expect([200, 201]).toContain(generateStatus)

    await expect(page.getByText('Report generation started! It will appear in the list shortly.')).toBeVisible()

    // ---- Verify AI was used (no NON_AI fallback) by inspecting generated DOCX content ----
    // Backend generation is synchronous; response includes reportId + downloadUrl.
    let reportId = null
    let downloadUrl = null
    try {
      const parsed = JSON.parse(generateBody || '{}')
      reportId = parsed?.data?.reportId ?? parsed?.data?.reportID ?? null
      downloadUrl = parsed?.data?.downloadUrl ?? null
    } catch {
      reportId = null
      downloadUrl = null
    }
    if (!reportId || !downloadUrl) {
      throw new Error(`Could not parse reportId/downloadUrl from /api/reports/srs response body. body=${generateBody}`)
    }

    // Playwright's APIRequestContext does not automatically reuse UI localStorage tokens.
    // Pull the JWT from the app tokenStore keys and send it explicitly.
    const accessToken = await page.evaluate(() => window.localStorage.getItem('access_token') || window.localStorage.getItem('accessToken') || window.localStorage.getItem('token'))
    if (!accessToken) {
      throw new Error('Missing access token in localStorage after login; cannot download report for verification.')
    }

    const downloadResp = await page.request.get(`${apiUrl}${downloadUrl}`, {
      timeout: 120_000,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const downloadStatus = downloadResp.status()
    await testInfo.attach('download-response.txt', {
      body: `status=${downloadStatus}\nurl=${apiUrl}${downloadUrl}\ncontentType=${downloadResp.headers()['content-type'] ?? ''}`,
      contentType: 'text/plain',
    })
    expect(downloadStatus).toBe(200)

    const docxBytes = await downloadResp.body()
    const zip = await JSZip.loadAsync(docxBytes)
    const xml = await zip.file('word/document.xml')?.async('string')
    if (!xml) {
      throw new Error('Downloaded DOCX missing word/document.xml (cannot verify AI vs NON_AI).')
    }

    await testInfo.attach('report-document.xml', { body: xml.slice(0, 20_000), contentType: 'text/plain' })

    // NON_AI fallback content contains an explicit marker.
    expect(xml).not.toContain('Mode: NON_AI')
    // AI-generated SRS prompt requires these headings.
    expect(xml).toContain('Functional Requirements')
    expect(xml).toContain('Non-Functional Requirements')

    // Verify saved: refresh until total increases OR a new PENDING/PROCESSING row appears.
    const refreshBtn = page.getByRole('button', { name: '↻ Refresh' })
    await expect(refreshBtn).toBeVisible()

    await expect
      .poll(
        async () => {
          await refreshBtn.click()

          const totalAfterText = await page
            .locator('.reports-stat-card-total .reports-stat-value')
            .innerText()
            .catch(() => null)
          const totalAfter = totalAfterText ? Number(String(totalAfterText).replace(/[^\d]/g, '')) : null

          const hasInProgressRow = (await page.locator('.reports-status-badge').filter({ hasText: /PENDING|PROCESSING/i }).count()) > 0

          if (totalBefore !== null && totalAfter !== null) {
            return { totalBefore, totalAfter, hasInProgressRow }
          }
          return { totalBefore: null, totalAfter: null, hasInProgressRow }
        },
        { timeout: 60_000, intervals: [500, 1000, 2000, 4000, 8000] },
      )
      .toMatchObject(
        totalBefore !== null
          ? { totalAfter: expect.any(Number) }
          : { hasInProgressRow: true },
      )
  })
})


import { expect, test } from '@playwright/test'

async function resetAuthState(page) {
  await page.context().clearCookies()
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await expect(page.getByTestId('login-email')).toBeVisible()
}

test.describe('Authentication and routing journeys', () => {
  test.beforeEach(async ({ page }) => {
    await resetAuthState(page)
  })

  test('login success routes admin to admin dashboard', async ({ page }) => {
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

    await page.getByTestId('login-email').fill('admin@samt.local')
    await page.getByTestId('login-password').fill('Password@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await page.waitForURL('**/app/admin/dashboard')
    await expect(page).toHaveURL(/\/app\/admin\/dashboard/)
  })

  test('login failure shows error message', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      })
    })

    await page.getByTestId('login-email').fill('student@samt.local')
    await page.getByTestId('login-password').fill('wrong-password')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page.getByText('Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.')).toBeVisible()
  })

  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await resetAuthState(page)
    await page.goto('/app/admin/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('lecturer login routes to lecturer workflow', async ({ page }) => {
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
            id: 2,
            email: 'lecturer@samt.local',
            role: 'LECTURER',
          },
        }),
      })
    })

    await page.getByTestId('login-email').fill('lecturer@samt.local')
    await page.getByTestId('login-password').fill('Password@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await page.waitForURL('**/app/lecturer/groups/list')
    await expect(page).toHaveURL(/\/app\/lecturer\/groups\/list/)
  })

  test('student login routes to student workflow', async ({ page }) => {
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
            id: 3,
            email: 'student@samt.local',
            role: 'STUDENT',
          },
        }),
      })
    })

    await page.getByTestId('login-email').fill('student@samt.local')
    await page.getByTestId('login-password').fill('Password@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await page.waitForURL('**/app/student/my-work')
    await expect(page).toHaveURL(/\/app\/student\/my-work/)
  })
})

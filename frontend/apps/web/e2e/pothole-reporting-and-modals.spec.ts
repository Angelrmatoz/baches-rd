import { test, expect } from '@playwright/test'

test.describe('E2E Web - Pothole Reporting, Geocoding & Modal Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept all API calls to return mock data (backend returns 401 for fake JWT)
    await page.route('**/api/**', (route) => {
      const url = route.request().url()
      if (url.includes('/users/me')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-e2e-123',
            nombre: 'Ángel Ricardo Matos',
            email: 'angel@example.com',
            rol: 'ADMIN',
            activo: true,
            avatarUrl: null,
            createdAt: '2026-01-01T00:00:00Z',
          }),
        })
      } else if (url.includes('/reports')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
        })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      }
    })

    // Inject mock authenticated user session in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-e2e-jwt-token')
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'user-e2e-123',
          nombre: 'Ángel Ricardo Matos',
          email: 'angel@example.com',
          rol: 'ADMIN',
          activo: true,
          createdAt: '2026-01-01T00:00:00Z',
        })
      )
    })
  })

  test('should open New Report modal and toggle between Street and GPS tabs', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Reportar un bache/i }).click()

    await expect(page.getByRole('heading', { name: 'Reportar nuevo bache' })).toBeVisible()
    await expect(page.getByText('1. Por nombre de calle')).toBeVisible()
    await expect(page.getByText('2. GPS / Coordenadas')).toBeVisible()

    // Toggle to GPS tab
    await page.getByText('2. GPS / Coordenadas').click()
    await expect(page.getByText('Obtener mi posición GPS actual')).toBeVisible()
    await expect(page.getByText('Latitud')).toBeVisible()
    await expect(page.getByText('Longitud')).toBeVisible()
  })

  test('should reject invalid street name and prevent report submission', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Reportar un bache/i }).click()

    const addressInput = page.getByPlaceholder(/Av. 27 de Febrero/i)
    await addressInput.fill('asdfasfa')

    await page.getByRole('button', { name: 'Publicar reporte' }).click()

    await expect(
      page.getByText(/no se encontró en el mapa de Santo Domingo/i)
    ).toBeVisible()
  })

  test('should display animated user dropdown menu on header click', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Baches RD').first()).toBeVisible()

    const userMenuBtn = page.getByRole('button', { name: /Ángel/i })
    await userMenuBtn.click({ force: true })
    await page.waitForTimeout(350)

    await expect(page.getByText('angel@example.com')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /Mi cuenta/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /Cerrar sesión/i })).toBeVisible()

    await page.getByRole('menuitem', { name: /Mi cuenta/i }).click({ force: true })
    await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  })
})

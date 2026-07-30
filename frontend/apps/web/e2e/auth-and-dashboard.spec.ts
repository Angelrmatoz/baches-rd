import { test, expect } from '@playwright/test';

test.describe('E2E Web - Auth and Dashboard Flow', () => {
  test('should render login page with civic branding', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Vite|Baches|React/i);
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
    await expect(page.getByPlaceholder('tu@correo.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('should render register page and validate fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
    await expect(page.getByPlaceholder('María Rodríguez')).toBeVisible();

    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByRole('alert')).toContainText('Por favor completa todos los campos');
  });

  test('should navigate to dashboard and display interactive elements', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Baches RD').first()).toBeVisible();
    await expect(page.getByText('Estado de las calles')).toBeVisible();
    await expect(page.getByText('Iniciar sesión')).toBeVisible();
  });
});

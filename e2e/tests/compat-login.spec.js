const { test, expect } = require('@playwright/test')

test('login works and protected pages load', async ({ page }) => {
  // Go to auth screen and login with seeded account
  await page.goto('/auth')

  await page.getByLabel('Email').fill('jorge@remarket.com')
  await page.getByLabel('Contraseña').fill('Test1234!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  // Should land on home
  await expect(page).toHaveURL(/\/$/)

  // Protected pages should be reachable when authenticated
  await page.goto('/wishlist')
  await expect(page).not.toHaveURL(/\/auth$/)

  await page.goto('/messages')
  await expect(page).not.toHaveURL(/\/auth$/)
})

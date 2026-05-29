import { test, expect } from '@playwright/test'

test('lobby to first roll smoke test', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Actuarialopoly' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start a session' })).toBeVisible()

  await page.getByRole('button', { name: 'Begin underwriting' }).click()

  await expect(page.getByText('Current actuary')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Roll dice' })).toBeVisible()

  await page.getByRole('button', { name: 'Roll dice' }).click()

  await expect(page.locator('.dice-display')).toBeVisible()
})

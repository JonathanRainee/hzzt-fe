import { expect, test } from '@playwright/test'

test('app boots and shows the heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'HZZT' })).toBeVisible()
})

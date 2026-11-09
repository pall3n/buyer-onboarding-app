import { test, expect } from '@playwright/test'

test.describe('Demo navigation', () => {
  test('root redirects to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/buyers')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('viewing brief demo page loads without auth', async ({ page }) => {
    await page.goto('/viewing-briefs/demo-brief-larkfield')
    await expect(page).not.toHaveURL(/sign-in/)
    await expect(page.getByText('Larkfield House')).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

const LARKFIELD_URL = '/buyers/demo-buyer-maya/matches/demo-prop-larkfield'
const ASHGROVE_URL = '/buyers/demo-buyer-maya/matches/demo-prop-ashgrove'

test.describe('Demo property fit — Screen F', () => {
  test('Larkfield tab shows strong matches section', async ({ page }) => {
    await page.goto(LARKFIELD_URL)
    await expect(page.getByText('Strong matches')).toBeVisible()
    await expect(page.getByText('Larkfield House')).toBeVisible()
  })

  test('Larkfield tab shows create viewing brief link', async ({ page }) => {
    await page.goto(LARKFIELD_URL)
    await expect(page.getByRole('link', { name: /viewing brief/i })).toBeVisible()
  })

  test('Ashgrove tab shows conflicts section', async ({ page }) => {
    await page.goto(ASHGROVE_URL)
    await expect(page.getByText('Conflicts with non-negotiables')).toBeVisible()
  })

  test('property tabs are both visible on Larkfield page', async ({ page }) => {
    await page.goto(LARKFIELD_URL)
    await expect(page.getByRole('link', { name: 'Larkfield House' })).toBeVisible()
    await expect(page.getByRole('link', { name: '4 Ashgrove Place' })).toBeVisible()
  })
})

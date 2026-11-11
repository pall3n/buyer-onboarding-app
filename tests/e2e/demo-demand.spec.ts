import { test, expect } from '@playwright/test'

const DEMAND_URL = '/demand'

test.describe('Demo demand radar — Screen I', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMAND_URL)
  })

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Buyer Demand Radar' })).toBeVisible()
  })

  test('demo mode banner is visible', async ({ page }) => {
    await expect(page.getByText('Example data only')).toBeVisible()
  })

  test('total active buyers count is shown', async ({ page }) => {
    await expect(page.getByText('Active buyers')).toBeVisible()
    await expect(page.getByText('14')).toBeVisible()
  })

  test('garden demand stat is shown', async ({ page }) => {
    await expect(page.getByText('Garden required')).toBeVisible()
    await expect(page.getByText('9')).toBeVisible()
  })

  test('search area cohort section is present', async ({ page }) => {
    await expect(page.getByText('Search area')).toBeVisible()
    await expect(page.getByText('Tunbridge Wells / TN1–TN4')).toBeVisible()
  })

  test('suppressed cells show minimum-cell indicator', async ({ page }) => {
    // Sevenoaks and other small cohorts show < 3
    await expect(page.getByText(/< 3/).first()).toBeVisible()
  })

  test('bedrooms cohort section is present', async ({ page }) => {
    await expect(page.getByText('Minimum bedrooms')).toBeVisible()
    await expect(page.getByText('3 bedrooms')).toBeVisible()
  })

  test('budget range section is present', async ({ page }) => {
    await expect(page.getByText('Budget range')).toBeVisible()
    await expect(page.getByText('£500,000 – £700,000')).toBeVisible()
  })

  test('seller pitch paragraph is present', async ({ page }) => {
    await expect(page.getByText('Seller appointment snapshot')).toBeVisible()
    await expect(page.getByText(/Hartfield & Rowe has 14 active/)).toBeVisible()
  })

  test('disclaimer is always visible', async ({ page }) => {
    await expect(page.getByText('Disclaimer')).toBeVisible()
    await expect(page.getByText(/indications of buyer preferences/)).toBeVisible()
  })

  test('exclusions breakdown explains what was left out', async ({ page }) => {
    await expect(page.getByText('What this snapshot excludes')).toBeVisible()
    await expect(page.getByText(/90 days/)).toBeVisible()
  })

  test('no individual buyer names or personal data visible', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    // None of the demo buyers' names should appear on this page
    expect(bodyText).not.toContain('Maya')
    expect(bodyText).not.toContain('Amara')
    expect(bodyText).not.toContain('Jordan')
  })
})

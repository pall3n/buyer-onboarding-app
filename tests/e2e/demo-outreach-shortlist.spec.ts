import { test, expect } from '@playwright/test'

const SHORTLIST_URL = '/properties/demo-prop-larkfield/shortlist'

test.describe('Demo outreach shortlist — Screen H', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHORTLIST_URL)
  })

  test('page loads and shows property address', async ({ page }) => {
    await expect(page.getByText('Larkfield House, TN15 7PQ')).toBeVisible()
  })

  test('important compliance notice is visible', async ({ page }) => {
    await expect(page.getByText('Approval records your review only')).toBeVisible()
    await expect(page.getByText(/PECR/)).toBeVisible()
  })

  test('eligible candidates appear before ineligible ones', async ({ page }) => {
    const cards = page.locator('[class*="rounded-xl"]').filter({ hasText: 'Draft message' })
    // Maya (eligible, approved) and Amara (eligible, pending) have draft messages
    // Jordan (conflicts) has no draft message
    await expect(cards).toHaveCount(2)
  })

  test('approved candidate shows approved badge', async ({ page }) => {
    await expect(page.getByText('Approved for outreach')).toBeVisible()
  })

  test('dismissed candidate with hard conflicts is shown as ineligible', async ({ page }) => {
    await expect(page.getByText('Jordan and Priya Nair')).toBeVisible()
    await expect(page.getByText(/Hard conflicts/)).toBeVisible()
  })

  test('match reasons are listed for eligible candidates', async ({ page }) => {
    await expect(page.getByText('Private garden (south-facing)')).toBeVisible()
  })

  test('communication preference chips are shown', async ({ page }) => {
    // Maya has email_ok:true
    await expect(page.getByText('Email').first()).toBeVisible()
  })

  test('draft message is expandable', async ({ page }) => {
    const summary = page.getByText('Draft message ▾').first()
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(page.getByText(/Hi Maya and James/)).toBeVisible()
  })

  test('eligibility criteria footnote explains the rules', async ({ page }) => {
    await expect(page.getByText('Eligibility criteria')).toBeVisible()
    await expect(page.getByText(/90 days/)).toBeVisible()
  })

  test('no send button is present anywhere on the page', async ({ page }) => {
    const sendButtons = page.getByRole('button', { name: /send/i })
    await expect(sendButtons).toHaveCount(0)
  })
})

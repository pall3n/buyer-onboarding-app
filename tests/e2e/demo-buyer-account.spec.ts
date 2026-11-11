import { test, expect } from '@playwright/test'

const ACCOUNT_URL = '/account?demo=1'
const CLAIM_URL = '/account/claim?demo=1'

test.describe('Demo buyer account — Screen J (grants dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ACCOUNT_URL)
  })

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Connected agencies' })).toBeVisible()
  })

  test('demo banner is visible', async ({ page }) => {
    await expect(page.getByText(/Demo view/)).toBeVisible()
  })

  test('shows active grant for Hartfield & Rowe', async ({ page }) => {
    await expect(page.getByText('Hartfield & Rowe')).toBeVisible()
    await expect(page.getByText('Active').first()).toBeVisible()
  })

  test('shows revoked grant for Meadowbrook Properties', async ({ page }) => {
    await expect(page.getByText('Meadowbrook Properties')).toBeVisible()
    await expect(page.getByText('Revoked')).toBeVisible()
  })

  test('revoke button is present but disabled in demo mode', async ({ page }) => {
    const revokeBtn = page.getByRole('button', { name: 'Revoke access' })
    await expect(revokeBtn).toBeVisible()
    await expect(revokeBtn).toBeDisabled()
  })

  test('shows "what agencies see" section', async ({ page }) => {
    await expect(page.getByText('What agencies see')).toBeVisible()
    await expect(page.getByText(/The profile version you approved/)).toBeVisible()
  })

  test('shows "what agencies cannot see" section', async ({ page }) => {
    await expect(page.getByText('What agencies cannot see')).toBeVisible()
    await expect(page.getByText(/Notes from other agencies/)).toBeVisible()
  })

  test('Somewhere integration section explains independence', async ({ page }) => {
    await expect(page.getByText('Somewhere integration')).toBeVisible()
    await expect(page.getByText(/separate consent decision/)).toBeVisible()
  })

  test('no raw profile data or scores visible', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('private_notes')
    expect(bodyText).not.toContain('agency_buyer_id')
    expect(bodyText).not.toContain('score')
  })
})

test.describe('Demo buyer claim — Screen K (claim flow)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLAIM_URL)
  })

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Claim your profile' })).toBeVisible()
  })

  test('demo banner shows the demo code', async ({ page }) => {
    await expect(page.getByText(/Demo mode/)).toBeVisible()
    await expect(page.getByText('123456')).toBeVisible()
  })

  test('explains why email alone is not used for verification', async ({ page }) => {
    await expect(page.getByText('Why we ask for a code')).toBeVisible()
    await expect(page.getByText(/Matching based solely on email/)).toBeVisible()
  })

  test('claim code input is present', async ({ page }) => {
    const input = page.getByLabel('6-digit claim code')
    await expect(input).toBeVisible()
    expect(await input.getAttribute('inputmode')).toBe('numeric')
    expect(await input.getAttribute('maxlength')).toBe('6')
  })

  test('submit button is disabled in demo mode', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Claim profile' })
    await expect(btn).toBeDisabled()
  })

  test('provides fallback guidance for buyers without a code', async ({ page }) => {
    await expect(page.getByText(/Ask your agent to generate one/)).toBeVisible()
  })
})

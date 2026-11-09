import { test, expect } from '@playwright/test'

const BRIEF_URL = '/viewing-briefs/demo-brief-larkfield'

test.describe('Demo viewing brief — Screen G', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BRIEF_URL)
  })

  test('page loads and shows property name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Larkfield House' })).toBeVisible()
  })

  test('buyer snapshot section is visible', async ({ page }) => {
    await expect(page.getByText('BUYER SNAPSHOT')).toBeVisible()
    await expect(page.getByText('Maya and James Reid')).toBeVisible()
  })

  test('"why it may suit them" apricot panel is visible', async ({ page }) => {
    await expect(page.getByText('WHY IT MAY SUIT THEM')).toBeVisible()
  })

  test('"three things to show" section is visible', async ({ page }) => {
    await expect(page.getByText('THREE THINGS TO SHOW THEM')).toBeVisible()
  })

  test('local evidence section with unknown badges is visible', async ({ page }) => {
    await expect(page.getByText('LOCAL LIFE, WITH EVIDENCE')).toBeVisible()
  })

  test('questions section is visible', async ({ page }) => {
    await expect(page.getByText('GOOD QUESTIONS TO ASK')).toBeVisible()
  })

  test('private notes textarea is present and disabled in demo', async ({ page }) => {
    const textarea = page.getByPlaceholder('Private agent notes (not available in demo)')
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeDisabled()
  })

  test('copy and print buttons are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Print' })).toBeVisible()
  })

  test('PDF and share buttons are disabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'PDF' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Share' })).toBeDisabled()
  })
})

import { expect, test } from '@playwright/test';

const STUDENT = { email: 'student@talea.test', password: 'student12345' };

test('a student saves a listing and moves it to applied', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(STUDENT.email);
  await page.getByLabel('Password').fill(STUDENT.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  await expect(page.getByRole('heading', { name: /every opportunity/i })).toBeVisible();

  const firstListing = page.locator('a[href^="/listings/"]').first();
  await firstListing.click();

  const save = page.getByRole('button', { name: 'Save to tracker' });
  await save.click();
  await expect(page.getByRole('link', { name: /in your tracker/i })).toBeVisible();

  await page.getByRole('link', { name: /in your tracker/i }).click();
  await expect(page.getByRole('heading', { name: /where each application stands/i })).toBeVisible();

  await page.getByRole('button', { name: 'Move to Applied' }).first().click();

  await expect(page.getByRole('button', { name: 'Move to Interview' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rejected' }).first()).toBeVisible();
});

test('a student cannot skip a stage by editing the request', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(STUDENT.email);
  await page.getByLabel('Password').fill(STUDENT.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  const tracker = await page.request.get('/api/tracker');
  expect(tracker.ok()).toBeTruthy();
  const { items } = (await tracker.json()) as { items: { id: string; status: string }[] };
  const saved = items.find((entry) => entry.status === 'saved');
  test.skip(!saved, 'no entry left in saved; the first test already advanced it');

  const response = await page.request.patch(`/api/tracker/${saved!.id}`, { data: { to: 'offer' } });
  expect(response.status()).toBe(409);
  const body = (await response.json()) as { error: { code: string; message: string } };
  expect(body.error.code).toBe('INVALID_TRANSITION');
  expect(body.error.message).toContain('applied');
});

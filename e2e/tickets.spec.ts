import { expect, test, type Page } from '@playwright/test';

const NEWEST_SEEDED_TITLE = 'Piano tuning quote for a Yamaha U1';

test.describe.configure({ mode: 'serial' });

async function deleteTicket(page: Page, title: string) {
  await page.goto('/');
  const row = page.getByRole('listitem').filter({ hasText: title });
  await row.hover();
  await row.getByRole('button', { name: `Delete ${title}` }).click();
  await page.getByRole('button', { name: 'Delete ticket' }).click();
  await expect(page.getByText('Ticket deleted.')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: title })).toHaveCount(0);
}

test('the first page is rendered on the server', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('listitem').filter({ hasText: NEWEST_SEEDED_TITLE })).toBeVisible();
  await context.close();
});

test('hydration reuses the server page instead of fetching it again', async ({ page }) => {
  const firstPageFetches: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!url.pathname.startsWith('/api/trpc/') || !url.pathname.includes('ticket.list')) return;
    if (!decodeURIComponent(url.search).includes('cursor')) firstPageFetches.push(req.url());
  });
  await page.goto('/');
  await expect(page.getByRole('listitem').first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(firstPageFetches).toEqual([]);
});

test('scrolling reaches the end of the list', async ({ page }) => {
  await page.goto('/');
  const end = page.getByText("That's every ticket. The agent is still on shift.");
  for (let i = 0; i < 10 && !(await end.isVisible()); i += 1) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(300);
  }
  await expect(end).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Showing 25 of 25 tickets');
});

test('a ticket can be created, edited and deleted', async ({ page }) => {
  const title = `E2E ${Date.now()}`;
  await page.goto('/');
  await page.getByRole('link', { name: /new ticket/i }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create ticket' }).click();
  await expect(page.getByText('Ticket created.')).toBeVisible();
  await expect(page.getByRole('listitem').first()).toContainText(title);

  await page.getByRole('listitem').first().getByRole('link', { name: title, exact: true }).click();
  const edited = `${title} edited`;
  await page.getByLabel('Title').fill(edited);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Ticket updated.')).toBeVisible();
  await expect(page.getByRole('listitem').first()).toContainText(edited);

  await deleteTicket(page, edited);
});

test('a long title without spaces wraps instead of overflowing', async ({ page }) => {
  const title = `SKU-${'X'.repeat(116)}`;
  await page.goto('/tickets/new');
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create ticket' }).click();
  await expect(page.getByRole('listitem').first()).toContainText(title.slice(0, 20));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const row = page.getByRole('listitem').first().locator('a').first();
  expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  // The delete confirm quotes the title: it must wrap inside the dialog too.
  await page.getByRole('listitem').first().hover();
  await page.getByRole('button', { name: `Delete ${title}` }).click();
  const dialog = page.getByRole('alertdialog');
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Keep it' }).click();
  await deleteTicket(page, title);
});

test('focus stays in the list after deleting with the keyboard', async ({ page }) => {
  const title = `Focus ${Date.now()}`;
  await page.goto('/tickets/new');
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create ticket' }).click();
  await expect(page.getByRole('listitem').first()).toContainText(title);
  await page.getByRole('button', { name: `Delete ${title}` }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Delete ticket' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listitem').filter({ hasText: title })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? '')).toMatch(/^ticket-/);
});

test('the header counts open tickets and follows deletes', async ({ page }) => {
  const title = `Count ${Date.now()}`;
  await page.goto('/tickets/new');
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create ticket' }).click();
  await expect(page.getByText('26 open tickets')).toBeVisible();
  await deleteTicket(page, title);
  await expect(page.getByText('25 open tickets')).toBeVisible();
});

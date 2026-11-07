import { expect, test } from '@playwright/test';

test('an unknown address is a real 404 with the root page', async ({ request }) => {
  const res = await request.get('/does-not-exist');
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain('Page not found');
});

test('an unknown ticket is a real 404 with the ticket page', async ({ request }) => {
  const res = await request.get('/tickets/unknown-id/edit');
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain('Ticket not found');
});

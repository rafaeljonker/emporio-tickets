import { expect, test } from '@playwright/test';

test('pages ship the security headers and hide the framework', async ({ request }) => {
  const res = await request.get('/');
  const headers = res.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['content-security-policy']).toBe("frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  expect(headers['x-powered-by']).toBeUndefined();
});

test('API errors carry no stack trace in production', async ({ request }) => {
  const res = await request.get(`/api/trpc/ticket.byId?input=${encodeURIComponent(JSON.stringify({ id: 'nope' }))}`);
  expect(res.status()).toBe(404);
  expect(await res.text()).not.toContain('"stack"');
});

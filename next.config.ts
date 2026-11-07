import type { NextConfig } from 'next';

// Static security headers only. A nonce-based script-src needs middleware and
// dynamic rendering everywhere, so it stays the production step (see README).
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  headers() {
    return Promise.resolve([{ source: '/(.*)', headers: securityHeaders }]);
  },
};

export default nextConfig;

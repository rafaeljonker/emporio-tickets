import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppRail } from '@/client/shared/components/AppRail';
import { Toaster } from '@/client/shared/components/ui/sonner';
import { TRPCReactProvider } from '@/trpc/client';
import './globals.css';

// next/font self-hosts both families at build time (same intent as the brand's Fontsource rule).
// Latin covers every string in the app (English copy, Portuguese names). WONK stays at its default 0.
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans' });

export const metadata: Metadata = {
  title: { default: 'Tickets · Empório', template: '%s · Empório' },
  description: 'The Empório da Música team desk: tickets handed over by the store agent.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body className="surface-paper min-h-dvh">
        <AppRail />
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}

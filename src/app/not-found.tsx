import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found' };

// GOV.UK "Page not found" pattern: plain title, blame-free steps, one way forward.
export default function NotFound() {
  return (
    <main className="mx-auto max-w-[42rem] px-6 pt-14 pb-16">
      <h1 className="font-display text-4xl leading-tight">Page not found</h1>
      <p className="mt-3 max-w-[52ch]">If you typed the web address, check it is correct.</p>
      <p className="mt-3 max-w-[52ch]">If you pasted the web address, check you copied the entire address.</p>
      <p className="mt-6">
        <Link href="/" className="font-semibold underline underline-offset-3 hover:decoration-2">
          Go to tickets
        </Link>
      </p>
    </main>
  );
}

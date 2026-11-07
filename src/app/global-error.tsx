'use client';

// Replaces the root layout when it fails, so it brings its own document and minimal styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#FAF4EA', color: '#3B2A1E', font: '16px/1.5 system-ui, sans-serif' }}>
        <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '56px 24px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: 0 }}>Something went wrong</h1>
          <p style={{ marginTop: 12 }}>The tickets couldn&apos;t load. Try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, height: 44, padding: '0 24px', borderRadius: 999, border: 0, background: '#A54A29', color: '#FAF4EA', font: '600 16px system-ui, sans-serif', cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { markCameFromBoard } from '../returnToBoard';

const TYPING_TARGETS = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/** `N` opens a new ticket, unless the user is typing or holding a modifier. */
export function useNewTicketButton() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'n' || event.repeat || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest(TYPING_TARGETS)) return;
      markCameFromBoard();
      router.push('/tickets/new');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return { href: '/tickets/new' as const };
}

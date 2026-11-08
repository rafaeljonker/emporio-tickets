import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

// Set when a ticket page is opened from the board. A full page load resets it, so a
// ticket opened from a pasted link still goes to "/" instead of leaving the app.
let cameFromBoard = false;

export function markCameFromBoard() {
  cameFromBoard = true;
}

/**
 * Going "back" after a visit from the board is a history step, so the loaded pages
 * and the scroll position come back as they were. A fresh visit to "/" would hydrate a
 * newer first page over them and start again at the top.
 */
export function useReturnToBoard() {
  const router = useRouter();

  function returnToBoard() {
    if (cameFromBoard) {
      cameFromBoard = false;
      router.back();
    } else {
      router.push('/');
    }
  }

  return {
    returnToBoard,
    /** Link handler: keeps the real href for new tabs, steps back in history otherwise. */
    handleBackClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (!cameFromBoard || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      returnToBoard();
    },
    /** After a create the new ticket is first, so the board starts again from the top. */
    startOver: () => {
      cameFromBoard = false;
      router.push('/');
    },
  };
}

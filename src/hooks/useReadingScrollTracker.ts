import { useEffect, RefObject } from 'react';

/**
 * Custom hook to track scroll position of the reading modal.
 * Automatically saves scroll position to localStorage when the user scrolls.
 * Automatically restores scroll position when the user opens the same article.
 * 
 * @param ref Ref object pointing to the scrollable container
 * @param articleId The ID of the currently reading article
 */
export function useReadingScrollTracker(
  ref: RefObject<HTMLDivElement | null>,
  articleId: string | undefined
) {
  useEffect(() => {
    if (!articleId || !ref.current) return;

    const container = ref.current;
    
    // Key used to store the pixel scroll position
    const storageKey = `reading_scroll_pos_${articleId}`;

    let rafId: number | null = null;
    let timerId: any = null;
    let longTimerId: any = null;

    const savedPos = localStorage.getItem(storageKey);
    if (savedPos) {
      const parsedPos = parseInt(savedPos, 10);
      if (!isNaN(parsedPos) && parsedPos > 0) {
        // Execute the restore
        const restoreScroll = () => {
          if (container) {
            container.scrollTop = parsedPos;
          }
        };

        // Try restoring immediately after render queue
        restoreScroll();

        // Also do a slight delay and animation frame to ensure layout, images, and content are fully calculated
        rafId = requestAnimationFrame(restoreScroll);
        timerId = setTimeout(restoreScroll, 100);
        longTimerId = setTimeout(restoreScroll, 300);
      }
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
      if (longTimerId !== null) clearTimeout(longTimerId);
    };
  }, [articleId, ref]);

  useEffect(() => {
    if (!articleId || !ref.current) return;

    const container = ref.current;
    const storageKey = `reading_scroll_pos_${articleId}`;

    // Throttle or use passive scroll event to track scroll position
    let ticked = false;

    const handleScroll = () => {
      if (!ticked) {
        requestAnimationFrame(() => {
          if (container) {
            // Save current scroll top
            localStorage.setItem(storageKey, Math.floor(container.scrollTop).toString());
          }
          ticked = false;
        });
        ticked = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [articleId, ref]);
}

import React, { useRef, useState, useCallback, useEffect } from 'react';

export function useSwipeToClose(onClose: () => void, threshold = 100) {
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const scrollYRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const touchStartedOnHandle = useRef(false);

  // Lock body scroll when modal is mounted (robust mobile fix)
  useEffect(() => {
    scrollYRef.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;

    // Check if touch started on the drag handle (has class 'drag-handle' or is a child of it)
    let el = e.target as HTMLElement | null;
    touchStartedOnHandle.current = false;
    while (el) {
      if (el.classList?.contains('drag-handle')) {
        touchStartedOnHandle.current = true;
        break;
      }
      el = el.parentElement;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.touches[0].clientY - touchStartY.current;

    if (diff > 0) {
      // User is swiping down — decide whether to drag or scroll
      const container = scrollContainerRef.current;

      // Allow swipe-to-close if:
      // 1. Touch started on the drag handle, OR
      // 2. Content doesn't overflow (no scrolling needed), OR
      // 3. Content is scrolled to the very top (scrollTop === 0)
      const contentOverflows = container
        ? container.scrollHeight > container.clientHeight + 1
        : false;
      const isAtScrollTop = container ? container.scrollTop <= 0 : true;
      const shouldDrag = touchStartedOnHandle.current || !contentOverflows || isAtScrollTop;

      if (shouldDrag) {
        e.preventDefault();
        isDragging.current = true;
        setDragOffset(diff);
      }
      // Otherwise: let the browser handle normal scrolling
    } else {
      // Swiping up — always allow normal scroll, cancel any drag
      if (isDragging.current) {
        isDragging.current = false;
        setDragOffset(0);
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (isDragging.current && dragOffset > threshold) {
      onClose();
    }
    setDragOffset(0);
    touchStartY.current = null;
    isDragging.current = false;
    touchStartedOnHandle.current = false;
  }, [dragOffset, threshold, onClose]);

  const style: React.CSSProperties = dragOffset > 0
    ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
    : { transition: 'transform 0.3s ease-out' };

  return { onTouchStart, onTouchMove, onTouchEnd, style, dragOffset, scrollContainerRef };
}

import React, { useRef, useState, useCallback, useEffect } from 'react';

export function useSwipeToClose(onClose: () => void, threshold = 100) {
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const scrollYRef = useRef(0);

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
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      // Prevent background scroll during swipe-down
      e.preventDefault();
      setDragOffset(diff);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (dragOffset > threshold) {
      onClose();
    }
    setDragOffset(0);
    touchStartY.current = null;
  }, [dragOffset, threshold, onClose]);

  const style: React.CSSProperties = dragOffset > 0
    ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
    : { transition: 'transform 0.3s ease-out' };

  return { onTouchStart, onTouchMove, onTouchEnd, style, dragOffset };
}

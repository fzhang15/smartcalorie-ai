import React, { useRef, useState, useCallback } from 'react';

export function useSwipeToClose(onClose: () => void, threshold = 100) {
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
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
    ? { transform: `translateY(${dragOffset}px)`, transition: dragOffset > 0 ? 'none' : 'transform 0.3s ease-out' }
    : { transition: 'transform 0.3s ease-out' };

  return { onTouchStart, onTouchMove, onTouchEnd, style, dragOffset };
}

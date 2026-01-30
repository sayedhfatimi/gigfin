'use client';

import {
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

type SwipeableCardProps = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: string;
    label: string;
    className?: string;
  };
  rightAction?: {
    icon: string;
    label: string;
    className?: string;
  };
  threshold?: number;
  className?: string;
};

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
  className = '',
}: SwipeableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Determine if this is a horizontal or vertical swipe
      if (isHorizontalSwipeRef.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // Only handle horizontal swipes
      if (isHorizontalSwipeRef.current) {
        e.preventDefault();
        // Limit the swipe distance
        const maxSwipe = 120;
        const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
        setTranslateX(clampedDelta);
      }
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setTranslateX(0);
    isHorizontalSwipeRef.current = null;
  }, [isDragging, translateX, threshold, onSwipeLeft, onSwipeRight]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Left action background */}
      {leftAction && (
        <div
          className={`absolute inset-y-0 left-0 flex w-24 items-center justify-center ${
            leftAction.className ?? 'bg-primary'
          }`}
          style={{ opacity: Math.min(1, translateX / threshold) }}
        >
          <div className='flex flex-col items-center gap-1 text-primary-content'>
            <span
              className={`fa-solid ${leftAction.icon}`}
              aria-hidden='true'
            />
            <span className='text-xs'>{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div
          className={`absolute inset-y-0 right-0 flex w-24 items-center justify-center ${
            rightAction.className ?? 'bg-error'
          }`}
          style={{ opacity: Math.min(1, -translateX / threshold) }}
        >
          <div className='flex flex-col items-center gap-1 text-error-content'>
            <span
              className={`fa-solid ${rightAction.icon}`}
              aria-hidden='true'
            />
            <span className='text-xs'>{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className='relative bg-base-100 transition-transform duration-150 ease-out'
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isDragging ? '0ms' : '150ms',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
}

interface UseScrollPositionOptions {
  key?: string;
  restoreOnMount?: boolean;
  saveOnUnmount?: boolean;
  throttleMs?: number;
}

export function useScrollPosition(options: UseScrollPositionOptions = {}) {
  const {
    key = 'default',
    restoreOnMount = true,
    saveOnUnmount = true,
    throttleMs = 100
  } = options;

  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  const elementRef = useRef<HTMLElement | null>(null);

  // Save scroll position to sessionStorage
  const saveScrollPosition = (position: ScrollPosition) => {
    try {
      sessionStorage.setItem(`scroll-${key}`, JSON.stringify(position));
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  };

  // Load scroll position from sessionStorage
  const loadScrollPosition = (): ScrollPosition => {
    try {
      const saved = sessionStorage.getItem(`scroll-${key}`);
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch (error) {
      console.warn('Failed to load scroll position:', error);
      return { x: 0, y: 0 };
    }
  };

  // Throttled scroll handler
  const handleScroll = () => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }

    throttleTimeoutRef.current = setTimeout(() => {
      const element = elementRef.current || window;
      const x = element === window ? window.scrollX : (element as HTMLElement).scrollLeft;
      const y = element === window ? window.scrollY : (element as HTMLElement).scrollTop;
      
      const newPosition = { x, y };
      setScrollPosition(newPosition);
      saveScrollPosition(newPosition);
    }, throttleMs);
  };

  // Restore scroll position
  const restoreScrollPosition = (position?: ScrollPosition) => {
    const targetPosition = position || loadScrollPosition();
    const element = elementRef.current || window;
    
    if (element === window) {
      window.scrollTo({
        left: targetPosition.x,
        top: targetPosition.y,
        behavior: 'auto'
      });
    } else {
      (element as HTMLElement).scrollLeft = targetPosition.x;
      (element as HTMLElement).scrollTop = targetPosition.y;
    }
    
    setScrollPosition(targetPosition);
  };

  // Smooth scroll to position
  const smoothScrollTo = (position: ScrollPosition) => {
    const element = elementRef.current || window;
    
    if (element === window) {
      window.scrollTo({
        left: position.x,
        top: position.y,
        behavior: 'smooth'
      });
    } else {
      (element as HTMLElement).scrollTo({
        left: position.x,
        top: position.y,
        behavior: 'smooth'
      });
    }
  };

  // Clear saved scroll position
  const clearScrollPosition = () => {
    try {
      sessionStorage.removeItem(`scroll-${key}`);
    } catch (error) {
      console.warn('Failed to clear scroll position:', error);
    }
  };

  useEffect(() => {
    const element = elementRef.current || window;
    
    // Restore scroll position on mount
    if (restoreOnMount) {
      // Delay restoration to ensure content is rendered
      const timer = setTimeout(() => {
        restoreScrollPosition();
      }, 100);
      
      return () => clearTimeout(timer);
    }

    // Add scroll listener
    element.addEventListener('scroll', handleScroll, { passive: true });

    // Save position on unmount
    return () => {
      element.removeEventListener('scroll', handleScroll);
      
      if (saveOnUnmount) {
        const x = element === window ? window.scrollX : (element as HTMLElement).scrollLeft;
        const y = element === window ? window.scrollY : (element as HTMLElement).scrollTop;
        saveScrollPosition({ x, y });
      }
      
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [key, restoreOnMount, saveOnUnmount, throttleMs]);

  return {
    scrollPosition,
    elementRef,
    restoreScrollPosition,
    smoothScrollTo,
    clearScrollPosition,
    saveScrollPosition: () => saveScrollPosition(scrollPosition)
  };
}

// Hook for managing scroll lock (useful for modals)
export function useScrollLock() {
  const [isLocked, setIsLocked] = useState(false);
  const originalStyleRef = useRef<string>('');

  const lockScroll = () => {
    if (typeof window === 'undefined') return;
    
    const body = document.body;
    originalStyleRef.current = body.style.overflow;
    body.style.overflow = 'hidden';
    setIsLocked(true);
  };

  const unlockScroll = () => {
    if (typeof window === 'undefined') return;
    
    const body = document.body;
    body.style.overflow = originalStyleRef.current;
    setIsLocked(false);
  };

  useEffect(() => {
    return () => {
      if (isLocked) {
        unlockScroll();
      }
    };
  }, [isLocked]);

  return { isLocked, lockScroll, unlockScroll };
}

// Hook for smooth scrolling to elements
export function useSmoothScroll() {
  const scrollToElement = (
    elementId: string, 
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }
  ) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView(options);
    }
  };

  const scrollToTop = (smooth = true) => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  const scrollToBottom = (smooth = true) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  return {
    scrollToElement,
    scrollToTop,
    scrollToBottom
  };
}
import { useState, useEffect, useRef } from 'react';

interface UseMapIdleOptions {
  idleDelay?: number; // Time in ms before considering map idle
  resetOnInteraction?: boolean; // Whether to reset idle state on any interaction
}

export function useMapIdle(options: UseMapIdleOptions = {}) {
  const { idleDelay = 10000, resetOnInteraction = true } = options;
  
  const [isIdle, setIsIdle] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Reset idle timer
  const resetIdleTimer = () => {
    if (!mountedRef.current) return;
    
    setLastInteraction(Date.now());
    setIsIdle(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsIdle(true);
      }
    }, idleDelay);
  };

  // Track user interactions
  const trackInteraction = () => {
    if (resetOnInteraction) {
      resetIdleTimer();
    }
  };

  // Initialize idle timer
  useEffect(() => {
    resetIdleTimer();
    
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [idleDelay]);

  // Add global interaction listeners for web
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleInteraction = () => {
        trackInteraction();
      };

      events.forEach(event => {
        window.addEventListener(event, handleInteraction, { passive: true });
      });

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleInteraction);
        });
      };
    }
  }, [resetOnInteraction]);

  return {
    isIdle,
    lastInteraction,
    trackInteraction,
    resetIdleTimer,
  };
}
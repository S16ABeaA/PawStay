import { useEffect, useRef, useState } from "react";

/**
 * Blocks page rendering while `loading` is true and keeps loader visible
 * for at least `minDurationMs` to avoid quick flash.
 */
export const useBlockingPageLoad = (
  loading: boolean,
  minDurationMs = 800,
): [boolean, () => void] => {
  const [isBlocking, setIsBlocking] = useState(loading);
  const cycleStartRef = useRef<number>(Date.now());
  const loaderDoneRef = useRef(false);
  const waitingForLoaderRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const hasStartedCycleRef = useRef(loading);

  const tryRelease = () => {
    // Only release if loader signaled completion
    if (loaderDoneRef.current) {
      setIsBlocking(false);
      waitingForLoaderRef.current = false;
    } else {
      // mark that we're waiting for the loader to finish
      waitingForLoaderRef.current = true;
    }
  };

  useEffect(() => {
    if (loading) {
      // new loading cycle: reset state and show loader
      hasStartedCycleRef.current = true;
      cycleStartRef.current = Date.now();
      loaderDoneRef.current = false;
      waitingForLoaderRef.current = false;
      setIsBlocking(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (hasStartedCycleRef.current) {
      // loading finished after a real cycle: wait out the minimum duration
      const elapsed = Date.now() - cycleStartRef.current;
      const remaining = Math.max(0, minDurationMs - elapsed);

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        tryRelease();
      }, remaining);

      return () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
    // loading is false and no cycle ever started: nothing to release
  }, [loading, minDurationMs]);

  const notifyLoaderFinished = () => {
    loaderDoneRef.current = true;
    // if we were already waiting for loader, release now
    if (waitingForLoaderRef.current) {
      setIsBlocking(false);
      waitingForLoaderRef.current = false;
    }
  };

  return [isBlocking, notifyLoaderFinished];
};

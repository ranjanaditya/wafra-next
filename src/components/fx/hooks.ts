import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

type Sub = (x: number, y: number) => void;
const subs = new Set<Sub>();
let px = -9999;
let py = -9999;
let raf = 0;
let bound = false;

function onMove(e: PointerEvent) {
  px = e.clientX;
  py = e.clientY;
  if (!raf)
    raf = requestAnimationFrame(() => {
      raf = 0;
      subs.forEach((s) => s(px, py));
    });
}

/** One shared, rAF-batched pointer listener for every magnetic / parallax effect. */
export function subscribePointer(cb: Sub) {
  if (!bound && typeof window !== 'undefined') {
    window.addEventListener('pointermove', onMove, { passive: true });
    bound = true;
  }
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

export const lastPointer = () => ({ x: px, y: py });

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const h = () => setMatch(mq.matches);
    h();
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [query]);
  return match;
}

export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)');

/** Cursor, magnetism, tilt, particles and parallax run only with a fine pointer and no reduced-motion preference. */
export function useFxEnabled() {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  return !reduce && fine;
}

export function usePageVisible() {
  const [vis, setVis] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const h = () => setVis(!document.hidden);
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);
  return vis;
}

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface Props {
  value: number;
  format: (v: number) => string;
  duration?: number;
  /** Start from this value on first reveal (default 0). */
  from?: number;
  className?: string;
  /** Animate only once the number scrolls into view. */
  inView?: boolean;
}

/**
 * Count-up number. On first reveal it counts from `from`; afterwards it rolls
 * from the previous value to the new one (rolling ticker for sliders).
 * The final frame always renders the exact formatted target value.
 */
export function CountUp({ value, format, duration = 1.1, from = 0, className, inView = true }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState<number>(reduce ? value : from);
  const prev = useRef<number>(from);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    if (inView && !seen) return;
    const start = started.current ? prev.current : from;
    started.current = true;
    const ctl = animate(start, value, {
      duration: start === value ? 0 : duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => setDisplay(value),
    });
    prev.current = value;
    return () => ctl.stop();
  }, [value, seen, reduce, inView, duration, from]);

  return (
    <span ref={ref} className={'num ' + (className ?? '')}>
      {format(display === value ? value : display)}
    </span>
  );
}

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { subscribePointer, useFxEnabled } from './hooks';
import { cn } from '../../lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  radius?: number;
  strength?: number;
  /** Inner label moves 1.5x the outer offset for parallax. */
  inner?: boolean;
}

/**
 * Pulls its child toward the cursor within `radius` px of its edges, up to
 * `strength` px, and springs back on leave (stiffness 150, damping 15).
 */
export function Magnetic({ children, className, innerClassName, radius = 90, strength = 12, inner = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useFxEnabled();
  const x = useSpring(0, { stiffness: 150, damping: 15, mass: 0.5 });
  const y = useSpring(0, { stiffness: 150, damping: 15, mass: 0.5 });
  const ix = useTransform(x, (v) => v * 0.5);
  const iy = useTransform(y, (v) => v * 0.5);

  useEffect(() => {
    if (!enabled) {
      x.set(0);
      y.set(0);
      return;
    }
    return subscribePointer((px, py) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - x.get();
      const cy = r.top + r.height / 2 - y.get();
      const dx = px - cx;
      const dy = py - cy;
      const rx = r.width / 2 + radius;
      const ry = r.height / 2 + radius;
      if (Math.abs(dx) < rx && Math.abs(dy) < ry) {
        const fx = Math.max(-1, Math.min(1, dx / rx));
        const fy = Math.max(-1, Math.min(1, dy / ry));
        x.set(fx * strength);
        y.set(fy * strength);
      } else if (x.get() !== 0 || y.get() !== 0) {
        x.set(0);
        y.set(0);
      }
    });
  }, [enabled, radius, strength, x, y]);

  return (
    <motion.div ref={ref} style={{ x, y }} className={cn('inline-flex', className)}>
      {inner ? (
        <motion.div style={{ x: ix, y: iy }} className={cn('inline-flex w-full', innerClassName)}>
          {children}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}

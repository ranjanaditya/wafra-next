import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { subscribePointer, useFxEnabled } from './hooks';
import { cn } from '../../lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Maximum tilt in degrees (spec: up to 8). */
  max?: number;
  glare?: boolean;
  glareClassName?: string;
  /** 'hover' tilts while the pointer is over the element; 'window' always leans toward the cursor. */
  track?: 'hover' | 'window';
}

/** 3D tilt with a moving glare (perspective 1000px). */
export function Tilt({ children, className, innerClassName, max = 8, glare = true, glareClassName, track = 'hover' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useFxEnabled();
  const rx = useSpring(0, { stiffness: 150, damping: 18 });
  const ry = useSpring(0, { stiffness: 150, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(30);
  const go = useSpring(0, { stiffness: 120, damping: 20 });
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.20), rgba(255,255,255,0.04) 35%, transparent 60%)`;

  const apply = (clientX: number, clientY: number, within: boolean) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let px = (clientX - r.left) / r.width;
    let py = (clientY - r.top) / r.height;
    if (track === 'window' && !within) {
      // Lean gently toward a cursor that is outside the element.
      px = 0.5 + Math.max(-0.5, Math.min(0.5, (px - 0.5) / 3));
      py = 0.5 + Math.max(-0.5, Math.min(0.5, (py - 0.5) / 3));
    }
    px = Math.max(0, Math.min(1, px));
    py = Math.max(0, Math.min(1, py));
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
    go.set(within ? 1 : 0.4);
  };

  useEffect(() => {
    if (!enabled || track !== 'window') return;
    return subscribePointer((x, y) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const within = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      apply(x, y, within);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, track, max]);

  return (
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={(e) => enabled && track === 'hover' && apply(e.clientX, e.clientY, true)}
        onPointerLeave={() => {
          if (track === 'hover') {
            rx.set(0);
            ry.set(0);
            go.set(0);
          }
        }}
        style={enabled ? { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' } : undefined}
        className={cn('relative will-change-transform', innerClassName)}
      >
        {children}
        {glare && enabled && (
          <motion.div
            aria-hidden
            className={cn('pointer-events-none absolute inset-0 z-20 mix-blend-soft-light', glareClassName)}
            style={{ background: glareBg, opacity: go }}
          />
        )}
      </motion.div>
    </div>
  );
}

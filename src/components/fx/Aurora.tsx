import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { subscribePointer, useFxEnabled } from './hooks';

/**
 * Aurora gradient mesh: deep crimson, crimson, violet and gold blobs at low
 * opacity, drifting slowly and leaning 3 to 5% toward the cursor on separate
 * depth layers. Plus eight-point-star geometry and film grain.
 */
export function Aurora() {
  const enabled = useFxEnabled();
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const sx = useSpring(nx, { stiffness: 25, damping: 18 });
  const sy = useSpring(ny, { stiffness: 25, damping: 18 });

  useEffect(() => {
    if (!enabled) {
      nx.set(0);
      ny.set(0);
      return;
    }
    return subscribePointer((x, y) => {
      nx.set(x / window.innerWidth - 0.5);
      ny.set(y / window.innerHeight - 0.5);
    });
  }, [enabled, nx, ny]);

  // Separate depth layers lean 3%, 4% and 5% of the viewport toward the cursor.
  const l1x = useTransform(sx, (v) => `${v * 6}vw`);
  const l1y = useTransform(sy, (v) => `${v * 6}vh`);
  const l2x = useTransform(sx, (v) => `${v * 8}vw`);
  const l2y = useTransform(sy, (v) => `${v * 8}vh`);
  const l3x = useTransform(sx, (v) => `${v * 10}vw`);
  const l3y = useTransform(sy, (v) => `${v * 10}vh`);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgb(var(--elev)) 0%, rgb(var(--bg)) 60%)' }} />
      <motion.div style={{ x: l1x, y: l1y }} className="absolute -left-[15%] -top-[25%] h-[70vmax] w-[70vmax]">
        <div
          className="h-full w-full animate-drift rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--brand-deep) / 0.55), transparent 70%)' }}
        />
      </motion.div>
      <motion.div style={{ x: l2x, y: l2y }} className="absolute -right-[20%] top-[5%] h-[60vmax] w-[60vmax]">
        <div
          className="h-full w-full animate-drift2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--brand) / 0.16), transparent 70%)' }}
        />
      </motion.div>
      <motion.div style={{ x: l3x, y: l3y }} className="absolute left-[25%] top-[45%] h-[55vmax] w-[55vmax]">
        <div
          className="h-full w-full animate-drift rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--ai) / 0.13), transparent 70%)', animationDelay: '-9s' }}
        />
      </motion.div>
      <motion.div style={{ x: l2x, y: l3y }} className="absolute -bottom-[25%] -left-[10%] h-[50vmax] w-[50vmax]">
        <div
          className="h-full w-full animate-drift2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--gold) / 0.09), transparent 70%)', animationDelay: '-14s' }}
        />
      </motion.div>
      <div className="stars absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}

export function Grain() {
  return <div aria-hidden className="grain" />;
}

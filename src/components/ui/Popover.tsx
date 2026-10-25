import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  anchor: RefObject<HTMLElement>;
  open: boolean;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  className?: string;
}

/** Fixed-position floating panel rendered in a portal, so cards with overflow never clip it. */
export function Popover({ anchor, open, children, placement = 'top', className }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number; place: 'top' | 'bottom' } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const update = () => {
      const r = anchor.current!.getBoundingClientRect();
      const place = placement === 'top' && r.top < 120 ? 'bottom' : placement;
      setPos({ x: r.left + r.width / 2, y: place === 'top' ? r.top - 8 : r.bottom + 8, place });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchor, placement]);

  // Keep the panel inside the viewport horizontally.
  const [shift, setShift] = useState(0);
  useEffect(() => {
    if (!open || !panel.current || !pos) return;
    const w = panel.current.offsetWidth;
    const left = pos.x - w / 2;
    const right = pos.x + w / 2;
    setShift(left < 8 ? 8 - left : right > window.innerWidth - 8 ? window.innerWidth - 8 - right : 0);
  }, [open, pos]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={panel}
          role="tooltip"
          initial={{ opacity: 0, y: pos.place === 'top' ? 4 : -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={
            'pointer-events-none fixed z-[150] max-w-[300px] rounded-xl border border-line/15 bg-elev/95 px-3 py-2 text-caption text-ink shadow-soft backdrop-blur-md ' +
            (className ?? '')
          }
          style={{
            left: pos.x + shift,
            top: pos.y,
            translate: pos.place === 'top' ? '-50% -100%' : '-50% 0',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Hover / focus / tap state helper for popovers. */
export function useHoverOpen() {
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    handlers: {
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
      onClick: () => setOpen((v) => !v),
    },
  };
}

import { forwardRef, useCallback, useRef, type HTMLAttributes, type PointerEvent } from 'react';
import { cn } from '../../lib/cn';

type Border = 'gold' | 'ai' | 'none';

interface Props extends HTMLAttributes<HTMLDivElement> {
  border?: Border;
  /** Disable the frosted card surface (spotlight only). */
  bare?: boolean;
}

/**
 * Card with a 280px radial light that follows the cursor (CSS variables
 * --mx/--my) and a 1px crimson-to-gold border that brightens nearest the cursor.
 */
export const SpotlightCard = forwardRef<HTMLDivElement, Props>(function SpotlightCard(
  { className, border = 'none', bare, children, onPointerMove, onPointerEnter, onPointerLeave, ...rest },
  fwd,
) {
  const local = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      local.current = el;
      if (typeof fwd === 'function') fwd(el);
      else if (fwd) fwd.current = el;
    },
    [fwd],
  );
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = local.current;
    if (el) {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
    onPointerMove?.(e);
  };
  return (
    <div
      ref={setRef}
      onPointerMove={move}
      onPointerEnter={(e) => {
        local.current?.style.setProperty('--spot-o', '1');
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        local.current?.style.setProperty('--spot-o', '0');
        onPointerLeave?.(e);
      }}
      className={cn(
        bare ? 'relative rounded-card' : 'card',
        'spotlight',
        border === 'gold' && 'grad-border',
        border === 'ai' && 'grad-border grad-border-ai',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

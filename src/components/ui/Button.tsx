import { forwardRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Magnetic } from '../fx/Magnetic';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'ai' | 'outline' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-[0_8px_24px_-10px_rgb(var(--brand)/0.8)]',
  secondary: 'bg-line/10 text-ink hover:bg-line/15 border border-line/10',
  ghost: 'text-ink hover:bg-line/10',
  gold: 'bg-gold text-[#1a1408] hover:brightness-110 shadow-[0_8px_24px_-12px_rgb(var(--gold)/0.9)]',
  ai: 'bg-ai text-white hover:brightness-110 shadow-[0_8px_24px_-10px_rgb(var(--ai)/0.8)]',
  outline: 'border border-line/20 text-ink hover:border-line/40 hover:bg-line/5',
  danger: 'bg-stop text-white hover:brightness-110',
};
const SIZE: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  magnetic?: boolean;
  cursor?: 'open' | 'drag' | 'explain' | 'freeze' | 'play';
  full?: boolean;
}

/** Pill button with ripple on press; optional magnetic pull. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, iconEnd, magnetic, cursor, full, className, children, onClick, type = 'button', ...rest },
  ref,
) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const press = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 600);
    onClick?.(e);
  };
  const btn = (
    <button
      ref={ref}
      type={type}
      data-cursor={cursor}
      onClick={press}
      className={cn(
        'relative inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full font-medium transition-[background-color,filter,border-color,box-shadow,opacity] duration-200 ease-out disabled:pointer-events-none disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children !== undefined && children !== null && <span className="relative">{children}</span>}
      {iconEnd && <span className="inline-flex shrink-0 rtl:-scale-x-100">{iconEnd}</span>}
      <AnimatePresence>
        {ripples.map((p) => (
          <motion.span
            key={p.id}
            aria-hidden
            initial={{ opacity: 0.35, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute h-48 w-48 rounded-full bg-white"
            style={{ left: p.x - 96, top: p.y - 96 }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
  return magnetic ? <Magnetic className={full ? 'w-full' : undefined}>{btn}</Magnetic> : btn;
});

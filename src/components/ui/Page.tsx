import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Standard page container: 12-column grid area, 1280px max width, room for the floating nav. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-shell px-4 pb-28 pt-24 sm:px-6', className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="font-display text-h3 font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

import { useRef, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { SOURCES, type Prov, type SourceId } from '../../data/deck';
import { useT } from '../../i18n';
import { cn } from '../../lib/cn';
import { Popover, useHoverOpen } from './Popover';

export const PROV_STYLE: Record<Prov, string> = {
  CASE: 'text-ink border-line/20 bg-line/5',
  TEAM: 'text-brand border-brand/35 bg-brand/10',
  REPORT: 'text-watch border-watch/35 bg-watch/10',
  GASTAT: 'text-pass border-pass/35 bg-pass/10',
  SAMA: 'text-pass border-pass/35 bg-pass/10',
  FSDP: 'text-pass border-pass/35 bg-pass/10',
  PUBLIC: 'text-ink border-line/25 bg-line/5',
  ILLUS: 'text-ai-glow border-ai/40 bg-ai/10',
};

export function ProvTag({ prov, className }: { prov: Prov; className?: string }) {
  const t = useT();
  return (
    <span className={cn('inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase leading-4 tracking-wide', PROV_STYLE[prov], className)}>
      {t.common.prov[prov]}
    </span>
  );
}

function SourceBody({ src, note }: { src: SourceId; note?: ReactNode }) {
  const t = useT();
  const prov = SOURCES[src].prov;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted">{t.common.provenance}</span>
        <ProvTag prov={prov} />
      </div>
      <div className="font-medium leading-snug">{t.common.sources[src]}</div>
      <div className="text-[11px] leading-snug text-muted">{t.common.provHint[prov]}</div>
      {note && <div className="border-t border-line/10 pt-1.5 text-[11px] leading-snug text-muted">{note}</div>}
    </div>
  );
}

/**
 * A DECK DATA figure: hovering (or focusing / tapping) reveals its source and
 * provenance tag. Use for every business number on screen.
 */
export function Fig({
  children,
  src,
  note,
  className,
  as = 'span',
}: {
  children: ReactNode;
  src: SourceId;
  note?: ReactNode;
  className?: string;
  as?: 'span' | 'div';
}) {
  const ref = useRef<HTMLElement>(null);
  const { open, handlers } = useHoverOpen();
  const Tag = as as 'span';
  return (
    <>
      <Tag
        ref={ref as React.RefObject<HTMLSpanElement>}
        tabIndex={0}
        data-cursor="explain"
        {...handlers}
        className={cn(
          'num cursor-help rounded-md underline decoration-line/25 decoration-dotted underline-offset-[5px] outline-none transition-colors hover:decoration-gold focus-visible:decoration-gold',
          className,
        )}
      >
        {children}
      </Tag>
      <Popover anchor={ref} open={open}>
        <SourceBody src={src} note={note} />
      </Popover>
    </>
  );
}

/** Small source chip (shows provenance tag; hover for the source). */
export function SourceChip({ src, className, note }: { src: SourceId; className?: string; note?: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { open, handlers } = useHoverOpen();
  const prov = SOURCES[src].prov;
  const t = useT();
  return (
    <>
      <button
        ref={ref}
        type="button"
        data-cursor="explain"
        aria-label={`${t.common.source}: ${t.common.sources[src]}`}
        {...handlers}
        className={cn('inline-flex items-center gap-1 align-middle', className)}
      >
        <ProvTag prov={prov} />
      </button>
      <Popover anchor={ref} open={open}>
        <SourceBody src={src} note={note} />
      </Popover>
    </>
  );
}

/** "Illustrative" tag for prototype settings, personas, pricing, goals and pilot inputs. */
export function Illus({ className, note }: { className?: string; note?: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { open, handlers } = useHoverOpen();
  const t = useT();
  return (
    <>
      <span
        ref={ref}
        tabIndex={0}
        data-cursor="explain"
        {...handlers}
        className={cn(
          'inline-flex shrink-0 items-center gap-0.5 rounded-full border border-ai/35 bg-ai/10 px-1.5 py-px align-middle text-[10px] font-semibold uppercase leading-4 tracking-wide text-ai-glow outline-none',
          className,
        )}
      >
        <Info className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
        {t.common.illustrative}
      </span>
      <Popover anchor={ref} open={open}>
        <div className="space-y-1">
          <div className="font-medium">{t.common.illustrative}</div>
          <div className="text-[11px] text-muted">{note ?? t.common.illustrativeHint}</div>
        </div>
      </Popover>
    </>
  );
}

/** Generic hover tooltip. */
export function Tip({ children, content, className }: { children: ReactNode; content: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { open, handlers } = useHoverOpen();
  return (
    <>
      <span ref={ref} tabIndex={0} {...handlers} className={cn('outline-none', className)}>
        {children}
      </span>
      <Popover anchor={ref} open={open}>
        {content}
      </Popover>
    </>
  );
}

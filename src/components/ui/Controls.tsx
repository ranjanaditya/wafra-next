import { useId, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Ban, Check, CheckCircle2, CircleAlert, Lock, OctagonX } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n';
import type { GateStatus } from '../../logic/gates';
import type { LogTag } from '../../store';

// ───────────── Segmented control with an animated pill ─────────────
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
  layoutId,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  size?: 'sm' | 'md';
  layoutId?: string;
  ariaLabel?: string;
}) {
  const auto = useId();
  const lid = layoutId ?? `seg-${auto}`;
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex rounded-full border border-line/10 bg-line/5 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative rounded-full font-medium transition-colors',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-[13px]',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={lid}
                className="absolute inset-0 rounded-full bg-line/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ───────────── Toggle switch ─────────────
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  tone = 'brand',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  tone?: 'brand' | 'pass' | 'gold';
}) {
  const id = useId();
  const on = tone === 'pass' ? 'bg-pass' : tone === 'gold' ? 'bg-gold' : 'bg-brand';
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <div className="text-[13px] font-medium leading-snug">{label}</div>
        {description && <div className="mt-0.5 text-[11px] leading-snug text-muted">{description}</div>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', checked ? on : 'bg-line/20', disabled && 'opacity-50')}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn('absolute h-5 w-5 rounded-full bg-white shadow', checked ? 'end-0.5' : 'start-0.5')}
        />
      </button>
    </div>
  );
}

// ───────────── Slider with a rolling value and spring bounce ─────────────
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  accent = 'brand',
  hint,
  right,
  ariaValueText,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  accent?: 'brand' | 'gold' | 'ai' | 'pass' | 'watch' | 'stop';
  hint?: ReactNode;
  right?: ReactNode;
  ariaValueText?: string;
}) {
  const id = useId();
  const [bump, setBump] = useState(0);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-ink/90">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {right}
          <motion.span
            key={bump}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className="num text-[13px] font-semibold"
          >
            {format(value)}
          </motion.span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        data-cursor="drag"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={ariaValueText ?? format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={() => setBump((b) => b + 1)}
        onKeyUp={() => setBump((b) => b + 1)}
        style={{ ['--pct' as string]: `${pct}%`, ['--accent' as string]: `var(--${accent === 'ai' ? 'ai' : accent})` }}
      />
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

// ───────────── Gate status badge (icon + label, never colour alone) ─────────────
export function StatusBadge({ status, size = 'md', className }: { status: GateStatus; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const t = useT();
  const map = {
    PASS: { cls: 'text-pass border-pass/40 bg-pass/10', Icon: CheckCircle2 },
    WATCH: { cls: 'text-watch border-watch/40 bg-watch/10', Icon: CircleAlert },
    STOP: { cls: 'text-stop border-stop/45 bg-stop/10', Icon: OctagonX },
    LOCKED: { cls: 'text-muted border-line/15 bg-line/5', Icon: Lock },
  }[status];
  const sz = size === 'lg' ? 'px-3 py-1 text-sm gap-1.5' : size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-0.5 text-xs gap-1';
  return (
    <span className={cn('inline-flex items-center rounded-full border font-semibold uppercase tracking-wide', map.cls, sz, className)}>
      <map.Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={2} aria-hidden />
      {t.common.status[status]}
    </span>
  );
}

/** Met / missed metric marker. */
export function MetMark({ met, label }: { met: boolean; label?: string }) {
  return met ? (
    <span className="inline-flex items-center gap-1 text-pass" aria-label={label}>
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-stop" aria-label={label}>
      <Ban className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
    </span>
  );
}

// ───────────── Engine-room tag ─────────────
export const TAG_STYLE: Record<LogTag, string> = {
  AI: 'bg-ai/15 text-ai-glow border-ai/40',
  Rule: 'bg-line/10 text-muted border-line/20',
  Human: 'bg-gold/15 text-gold border-gold/40',
  Partner: 'bg-brand/15 text-brand border-brand/40',
  Simulated: 'bg-transparent text-ink/80 border-line/35 border-dashed',
};
export function TagPill({ tag, className }: { tag: LogTag; className?: string }) {
  const t = useT();
  return (
    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-semibold leading-4', TAG_STYLE[tag], className)}>
      {t.common.tags[tag]}
    </span>
  );
}

// ───────────── Avatar (initials on an abstract gradient, never a face) ─────────────
export function Avatar({ initials, gradient, size = 36, className }: { initials: string; gradient: [string, string]; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `conic-gradient(from 210deg, ${gradient[0]}, ${gradient[1]}, ${gradient[0]})` }}
    >
      <span className="absolute inset-[2px] rounded-full bg-black/25" />
      <span className="relative">{initials}</span>
    </span>
  );
}

// ───────────── Section header ─────────────
export function SectionHeader({
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
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="font-display text-h4 font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

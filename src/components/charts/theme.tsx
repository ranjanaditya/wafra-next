import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../../store';
import { SOURCES, type SourceId } from '../../data/deck';
import { useT } from '../../i18n';
import { ProvTag } from '../ui/Provenance';

const TOKENS = ['brand', 'brand-deep', 'gold', 'ai', 'ai-glow', 'pass', 'watch', 'stop', 'text', 'muted', 'line', 'bg', 'elev'] as const;
type Token = (typeof TOKENS)[number];
export type ChartColors = Record<Token, string> & { grid: string; alpha: (token: Token, a: number) => string };

function read(): ChartColors {
  const cs = getComputedStyle(document.documentElement);
  const raw = {} as Record<Token, string>;
  for (const k of TOKENS) raw[k] = cs.getPropertyValue(`--${k}`).trim() || '128 128 128';
  const out = {} as Record<Token, string>;
  for (const k of TOKENS) out[k] = `rgb(${raw[k]})`;
  return {
    ...out,
    grid: `rgb(${raw.line} / 0.08)`,
    alpha: (token: Token, a: number) => `rgb(${raw[token]} / ${a})`,
  };
}

/**
 * Resolved colour strings for chart libraries (Recharts needs concrete colours).
 * Re-reads the CSS tokens whenever the theme or presenter mode changes.
 */
export function useChartColors(): ChartColors {
  const theme = useApp((s) => s.theme);
  const presenter = useApp((s) => s.presenter);
  const [c, setC] = useState<ChartColors>(() => read());
  useEffect(() => {
    // Wait a frame so <html data-theme> has been updated.
    const id = requestAnimationFrame(() => setC(read()));
    return () => cancelAnimationFrame(id);
  }, [theme, presenter]);
  return c;
}

/** Custom chart tooltip: value rows plus a source chip. Pass to Recharts as <Tooltip content={...} />. */
export function ChartTooltipCard({
  title,
  rows,
  src,
  footer,
}: {
  title?: ReactNode;
  rows: { label: ReactNode; value: ReactNode; color?: string }[];
  src?: SourceId;
  footer?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="min-w-[180px] rounded-xl border border-line/15 bg-elev/95 px-3 py-2.5 text-caption shadow-soft backdrop-blur-md">
      {title && <div className="mb-1.5 font-semibold">{title}</div>}
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              {r.color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="num font-semibold text-ink">{r.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-1.5 text-[11px] text-muted">{footer}</div>}
      {src && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-line/10 pt-1.5">
          <ProvTag prov={SOURCES[src].prov} />
          <span className="truncate text-[10px] text-muted">{t.common.sources[src]}</span>
        </div>
      )}
    </div>
  );
}

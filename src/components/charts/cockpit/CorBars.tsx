import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { QUARTERS, STOP_RULE } from '../../../data/deck';
import { GATE_RANGES } from '../../../config/illustrative';
import { useFmt } from '../../ui/useFmt';
import { useT, useTpl } from '../../../i18n';

const W = 620;
const H = 220;
const PAD = { l: 40, r: 12, t: 30, b: 46 };

interface Props {
  values: number[];
  onChange: (i: number, v: number) => void;
  /** Index of the second quarter of the first breach pair (from the gate logic). */
  breachIndex: number | null;
}

/**
 * Eight draggable quarterly cost-of-risk bars (FY27 Q1 to FY28 Q4) with the
 * 3.5% stop line. Drag with the pointer or use arrow keys / Page Up / Page Down.
 */
export function CorBars({ values, onChange, breachIndex }: Props) {
  const f = useFmt();
  const t = useT();
  const tp = useTpl();
  const g = t.cockpit.gates;
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const { min, max, step } = GATE_RANGES.quarterly;
  const innerH = H - PAD.t - PAD.b;
  const colW = (W - PAD.l - PAD.r) / values.length;
  const barW = colW * 0.56;
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * innerH;
  const thr = STOP_RULE.corThreshold;
  const breach = breachIndex === null ? null : [breachIndex - 1, breachIndex];

  const valueAt = (clientY: number) => {
    const el = svg.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const vy = ((clientY - r.top) / r.height) * H;
    const v = min + (1 - (vy - PAD.t) / innerH) * (max - min);
    return Math.round(Math.min(max, Math.max(min, v)) / step) * step;
  };

  const down = (i: number) => (e: PointerEvent<SVGGElement>) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setDrag(i);
    const v = valueAt(e.clientY);
    if (v !== null) onChange(i, v);
  };
  const move = (i: number) => (e: PointerEvent<SVGGElement>) => {
    if (drag !== i) return;
    const v = valueAt(e.clientY);
    if (v !== null) onChange(i, v);
  };
  const up = () => setDrag(null);

  const key = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    const v = values[i];
    let next: number | null = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = v + step;
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = v - step;
    if (e.key === 'PageUp') next = v + 0.5;
    if (e.key === 'PageDown') next = v - 0.5;
    if (e.key === 'Home') next = min;
    if (e.key === 'End') next = max;
    if (next !== null) {
      e.preventDefault();
      e.stopPropagation();
      onChange(i, Math.round(Math.min(max, Math.max(min, next)) * 10) / 10);
    }
  };

  const ticks = [1, 2, 3, 4, 5];

  return (
    <div dir="ltr" className="w-full select-none">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none overflow-visible" role="group" aria-label={g.quarterlyTitle}>
        {/* Gate year bands */}
        {[0, 1].map((band) => (
          <g key={band}>
            <rect
              x={PAD.l + band * 4 * colW + 2}
              y={PAD.t - 26}
              width={4 * colW - 4}
              height={innerH + 26 + 40}
              rx={10}
              fill={band === 0 ? 'rgb(var(--line) / 0.025)' : 'rgb(var(--line) / 0.045)'}
            />
            <text x={PAD.l + band * 4 * colW + 2 * colW} y={H - 6} fontSize="10" textAnchor="middle" fill="rgb(var(--muted))" fontWeight={700} letterSpacing="0.08em">
              {band === 0 ? 'FY27 · G1' : 'FY28 · G2'}
            </text>
          </g>
        ))}
        {/* Grid */}
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(tk)} y2={y(tk)} stroke="rgb(var(--line) / 0.07)" />
            <text x={PAD.l - 8} y={y(tk) + 3.5} fontSize="10" textAnchor="end" fill="rgb(var(--muted))">
              {tk}%
            </text>
          </g>
        ))}
        {/* Bars */}
        {values.map((v, i) => {
          const x = PAD.l + i * colW + (colW - barW) / 2;
          const over = Math.round(v * 100) / 100 > thr;
          const inBreach = breach?.includes(i);
          const fill = over ? 'rgb(var(--stop))' : 'rgb(var(--pass))';
          return (
            <g
              key={i}
              role="slider"
              tabIndex={0}
              aria-label={tp(g.barAria, { q: QUARTERS[i] })}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={v}
              aria-valuetext={f.pct(v, 1)}
              data-cursor="drag"
              onPointerDown={down(i)}
              onPointerMove={move(i)}
              onPointerUp={up}
              onPointerCancel={up}
              onKeyDown={key(i)}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus((fi) => (fi === i ? null : fi))}
              style={{ outline: 'none', cursor: 'ns-resize' }}
            >
              {/* generous hit area */}
              <rect x={PAD.l + i * colW} y={PAD.t - 10} width={colW} height={innerH + 10} fill="transparent" />
              <motion.rect
                x={x}
                width={barW}
                rx={6}
                initial={false}
                animate={{ y: y(v), height: Math.max(2, PAD.t + innerH - y(v)) }}
                transition={drag === i ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
                fill={fill}
                fillOpacity={inBreach ? 0.95 : over ? 0.8 : 0.55}
              />
              <motion.rect
                x={x}
                width={barW}
                height={4}
                rx={2}
                initial={false}
                animate={{ y: y(v) - 2 }}
                transition={drag === i ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
                fill="#fff"
                fillOpacity={drag === i || focus === i ? 0.95 : 0.55}
              />
              {(focus === i || drag === i) && (
                <rect x={x - 4} y={y(v) - 6} width={barW + 8} height={PAD.t + innerH - y(v) + 10} rx={9} fill="none" stroke="rgb(var(--gold))" strokeWidth={2} />
              )}
              <text x={x + barW / 2} y={y(v) - 9} fontSize="11" fontWeight={700} textAnchor="middle" fill={over ? 'rgb(var(--stop))' : 'rgb(var(--text))'}>
                {f.pct(v, 1)}
              </text>
              <text x={PAD.l + i * colW + colW / 2} y={H - PAD.b + 17} fontSize="10.5" fontWeight={600} textAnchor="middle" fill="rgb(var(--muted))">
                {QUARTERS[i].slice(5)}
              </text>
            </g>
          );
        })}
        {/* Threshold line */}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(thr)} y2={y(thr)} stroke="rgb(var(--stop))" strokeWidth={1.5} strokeDasharray="6 5" />
        <g transform={`translate(${W - PAD.r - 4}, ${y(thr) - 6})`}>
          <text fontSize="10" fontWeight={700} textAnchor="end" fill="rgb(var(--stop))">
            {g.threshold} {f.pct(thr, 1)}
          </text>
        </g>
        {/* Breach bracket */}
        {breach && (
          <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <path
              d={`M ${PAD.l + breach[0] * colW + 8} ${PAD.t - 2} v -6 H ${PAD.l + (breach[1] + 1) * colW - 8} v 6`}
              fill="none"
              stroke="rgb(var(--stop))"
              strokeWidth={2}
            />
            <rect x={PAD.l + (breach[0] + 1) * colW - 24} y={PAD.t - 24} width={48} height={15} rx={7.5} fill="rgb(var(--stop))" />
            <text x={PAD.l + (breach[0] + 1) * colW} y={PAD.t - 13} fontSize="9.5" fontWeight={800} textAnchor="middle" fill="#fff" letterSpacing="0.06em">
              STOP
            </text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../../i18n';
import { useFmt } from '../../components/ui/useFmt';
import { AUTOPILOT_SNAP } from '../../config/illustrative';

export interface Split {
  bills: number;
  spending: number;
  goals: number;
}

export const SPLIT_COLORS = {
  bills: 'rgb(var(--brand))',
  spending: 'rgb(var(--gold))',
  goals: 'rgb(var(--pass))',
};

const SIZE = 200;
const R = 74;
const SW = 26;
const C = SIZE / 2;

function polar(angleDeg: number, r = R) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

/**
 * Draggable autopilot donut: drag the two boundary handles (pointer or arrow
 * keys) to move SAR between Bills, Spending and Goals; snaps to SAR 50.
 */
export function Donut({ salary, split, onChange }: { salary: number; split: Split; onChange: (s: Split) => void }) {
  const t = useT();
  const f = useFmt();
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<'a' | 'b' | null>(null);
  const min = Math.max(AUTOPILOT_SNAP * 4, Math.round(salary * 0.05 / AUTOPILOT_SNAP) * AUTOPILOT_SNAP);
  const snap = (v: number) => Math.round(v / AUTOPILOT_SNAP) * AUTOPILOT_SNAP;

  const aAngle = (split.bills / salary) * 360;
  const bAngle = ((split.bills + split.spending) / salary) * 360;
  const circ = 2 * Math.PI * R;
  const seg = (from: number, to: number) => ({ dash: `${(circ * (to - from)) / 360} ${circ}`, offset: -(circ * from) / 360 });

  const setBoundary = (which: 'a' | 'b', value: number) => {
    if (which === 'a') {
      const total = split.bills + split.spending;
      const bills = Math.min(Math.max(snap(value), min), total - min);
      onChange({ bills, spending: total - bills, goals: split.goals });
    } else {
      const cum = Math.min(Math.max(snap(value), split.bills + min), salary - min);
      onChange({ bills: split.bills, spending: cum - split.bills, goals: salary - cum });
    }
  };

  const fromPointer = (e: PointerEvent) => {
    const el = svg.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SIZE - C;
    const y = ((e.clientY - r.top) / r.height) * SIZE - C;
    const deg = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
    return (deg / 360) * salary;
  };

  const onKey = (which: 'a' | 'b') => (e: KeyboardEvent) => {
    const step = e.shiftKey ? AUTOPILOT_SNAP * 10 : AUTOPILOT_SNAP;
    const cur = which === 'a' ? split.bills : split.bills + split.spending;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setBoundary(which, cur + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setBoundary(which, cur - step);
    }
  };

  const handle = (which: 'a' | 'b', angle: number, label: string, value: number) => {
    const p = polar(angle);
    return (
      <g
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={salary}
        aria-valuenow={value}
        aria-valuetext={f.sar(value)}
        data-cursor="drag"
        onKeyDown={onKey(which)}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDrag(which);
        }}
        className="cursor-grab outline-none [&:focus-visible>circle:first-child]:stroke-gold"
      >
        <circle cx={p.x} cy={p.y} r={15} fill="transparent" stroke="transparent" strokeWidth={3} />
        <motion.circle
          cx={p.x}
          cy={p.y}
          r={drag === which ? 11 : 9}
          fill="#fff"
          stroke="rgb(var(--bg))"
          strokeWidth={3}
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.5))' }}
        />
      </g>
    );
  };

  const sBills = seg(0, aAngle);
  const sSpend = seg(aAngle, bAngle);
  const sGoals = seg(bAngle, 360);

  return (
    <div className="relative mx-auto w-[200px]" dir="ltr">
      <svg
        ref={svg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-[200px] w-[200px] touch-none select-none"
        aria-label={t.app.salary.donutAria}
        onPointerMove={(e) => drag && setBoundary(drag, fromPointer(e))}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgb(var(--line) / 0.08)" strokeWidth={SW} />
        <g transform={`rotate(-90 ${C} ${C})`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke={SPLIT_COLORS.bills} strokeWidth={SW} strokeDasharray={sBills.dash} strokeDashoffset={sBills.offset} />
          <circle cx={C} cy={C} r={R} fill="none" stroke={SPLIT_COLORS.spending} strokeWidth={SW} strokeDasharray={sSpend.dash} strokeDashoffset={sSpend.offset} />
          <circle cx={C} cy={C} r={R} fill="none" stroke={SPLIT_COLORS.goals} strokeWidth={SW} strokeDasharray={sGoals.dash} strokeDashoffset={sGoals.offset} />
        </g>
        {handle('a', aAngle, t.app.salary.handleBills, split.bills)}
        {handle('b', bAngle, t.app.salary.handleSpending, split.bills + split.spending)}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-display text-[19px] font-semibold">{f.sar(salary)}</span>
        <span className="text-[11px] text-muted">{t.app.salary.goals}: <span className="num font-semibold text-pass">{f.sar(split.goals)}</span></span>
      </div>
    </div>
  );
}

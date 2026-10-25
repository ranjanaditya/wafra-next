import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type AnimationPlaybackControls } from 'framer-motion';
import { Crosshair, RotateCcw, Sparkles } from 'lucide-react';
import { COMPETITORS, POSITIONING, type CompetitorId } from '../../../data/deck';
import { useChartColors } from '../theme';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/cn';

export type MapHighlight = CompetitorId | null;

export interface MapLabels {
  title: string;
  axisX0: string;
  axisX1: string;
  axisY0: string;
  axisY1: string;
  whiteSpace: string;
  whiteSpaceLabel: string;
  today: string;
  target: string;
  showMove: string;
  reset: string;
  dragHint: string;
  inside: string;
  outside: string;
  markerAria: (x: number, y: number) => string;
  names: Record<CompetitorId, string>;
}

const EASE = [0.22, 1, 0.36, 1] as const;
// viewBox geometry (user units). Data space is 0..100 on both axes.
const VB = { w: 640, h: 440, l: 50, r: 14, t: 14, b: 48 };
const PW = VB.w - VB.l - VB.r;
const PH = VB.h - VB.t - VB.b;
const sx = (x: number) => VB.l + (x / 100) * PW;
const sy = (y: number) => VB.t + (1 - y / 100) * PH;
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
const ctrlFor = (from: { x: number; y: number }, to: { x: number; y: number }) => ({
  x: (from.x + to.x) / 2 - 4,
  y: Math.min(100, Math.max(from.y, to.y) + 18),
});
const WS = POSITIONING.whiteSpace;
const inZone = (x: number, y: number) => x >= WS.x0 && x <= WS.x1 && y >= WS.y0 && y <= WS.y1;

const PEER_POS: Record<CompetitorId, { x: number; y: number }> = {
  alRajhi: POSITIONING.alRajhi,
  stc: POSITIONING.stc,
  d360: POSITIONING.d360,
  vision: POSITIONING.vision,
};

/**
 * Indicative positioning map. "Wafra today" can be dragged (pointer or arrow
 * keys); "Show the move" animates it along a curved path to "Wafra target".
 * Geometry always runs left-to-right (x = app-led), even in Arabic.
 */
export function PositioningMap({
  labels,
  highlight,
  onHighlight,
}: {
  labels: MapLabels;
  highlight: MapHighlight;
  onHighlight: (id: MapHighlight) => void;
}) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const today = POSITIONING.wafraToday;
  const target = POSITIONING.wafraTarget;

  const mx = useMotionValue<number>(today.x);
  const my = useMotionValue<number>(today.y);
  const px = useTransform(mx, sx);
  const py = useTransform(my, sy);
  const trailLen = useMotionValue(0);
  const run = useRef<AnimationPlaybackControls[]>([]);
  const dragging = useRef(false);

  const [pos, setPos] = useState<{ x: number; y: number }>({ x: today.x, y: today.y });
  const [trail, setTrail] = useState<{ from: { x: number; y: number }; ctrl: { x: number; y: number } } | null>(null);
  const [focused, setFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useMotionValueEvent(mx, 'change', (v) => setPos((p) => (Math.round(p.x) === Math.round(v) ? p : { ...p, x: v })));
  useMotionValueEvent(my, 'change', (v) => setPos((p) => (Math.round(p.y) === Math.round(v) ? p : { ...p, y: v })));
  useEffect(() => () => run.current.forEach((a) => a.stop()), []);

  const inside = inZone(mx.get(), my.get()) || inZone(pos.x, pos.y);
  const atTarget = Math.abs(pos.x - target.x) < 1.5 && Math.abs(pos.y - target.y) < 1.5;

  const stopAll = () => {
    run.current.forEach((a) => a.stop());
    run.current = [];
  };

  const showMove = () => {
    stopAll();
    const from = { x: mx.get(), y: my.get() };
    const ctrl = ctrlFor(from, target);
    setTrail({ from, ctrl });
    if (reduce) {
      mx.set(target.x);
      my.set(target.y);
      trailLen.set(1);
      return;
    }
    trailLen.set(0);
    run.current = [
      animate(0, 1, {
        duration: 1.6,
        ease: EASE,
        onUpdate: (t) => {
          mx.set(quad(from.x, ctrl.x, target.x, t));
          my.set(quad(from.y, ctrl.y, target.y, t));
          trailLen.set(t);
        },
      }),
    ];
  };

  const reset = () => {
    stopAll();
    setTrail(null);
    trailLen.set(0);
    if (reduce) {
      mx.set(today.x);
      my.set(today.y);
      return;
    }
    run.current = [
      animate(mx, today.x, { type: 'spring', stiffness: 160, damping: 20 }),
      animate(my, today.y, { type: 'spring', stiffness: 160, damping: 20 }),
    ];
  };

  const toData = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const ux = ((clientX - r.left) / r.width) * VB.w;
    const uy = ((clientY - r.top) / r.height) * VB.h;
    return { x: clamp(((ux - VB.l) / PW) * 100), y: clamp((1 - (uy - VB.t) / PH) * 100) };
  };

  const onMarkerDown = (e: PointerEvent<SVGGElement>) => {
    e.preventDefault();
    stopAll();
    setTrail(null);
    dragging.current = true;
    setIsDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const d = toData(e.clientX, e.clientY);
    mx.set(d.x);
    my.set(d.y);
  };
  const endDrag = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
  };
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowRight: [step, 0],
      ArrowLeft: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      stopAll();
      setTrail(null);
      mx.set(clamp(mx.get() + moves[e.key][0]));
      my.set(clamp(my.get() + moves[e.key][1]));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showMove();
    }
  };

  const hintCtrl = ctrlFor(today, target);
  const hintPath = `M ${sx(today.x)} ${sy(today.y)} Q ${sx(hintCtrl.x)} ${sy(hintCtrl.y)} ${sx(target.x)} ${sy(target.y)}`;
  const trailPath = trail
    ? `M ${sx(trail.from.x)} ${sy(trail.from.y)} Q ${sx(trail.ctrl.x)} ${sy(trail.ctrl.y)} ${sx(target.x)} ${sy(target.y)}`
    : '';

  const zone = { x: sx(WS.x0), y: sy(WS.y1), w: sx(WS.x1) - sx(WS.x0), h: sy(WS.y0) - sy(WS.y1) };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />} onClick={showMove} magnetic cursor="play">
          {labels.showMove}
        </Button>
        <Button size="sm" variant="outline" icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />} onClick={reset}>
          {labels.reset}
        </Button>
        <span
          className={cn(
            'chip ms-auto transition-colors',
            inside ? 'border-pass/40 bg-pass/10 text-pass' : 'text-muted',
          )}
          aria-live="polite"
        >
          <Crosshair className="h-3 w-3" strokeWidth={1.75} aria-hidden />
          {inside ? labels.inside : labels.outside}
        </span>
      </div>

      <div dir="ltr" className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="h-auto w-full touch-none select-none"
          role="group"
          aria-label={labels.title}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ fontFamily: 'inherit' }}
        >
          <defs>
            <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <linearGradient id={`${uid}-zone`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={c.gold} stopOpacity="0.16" />
              <stop offset="1" stopColor={c.brand} stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id={`${uid}-wafra`} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor={c.alpha('gold', 1)} />
              <stop offset="0.45" stopColor={c.brand} />
              <stop offset="1" stopColor={c['brand-deep']} />
            </radialGradient>
            <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={c.gold} opacity="0.55" />
            </marker>
          </defs>

          {/* Plot frame and grid */}
          <rect x={VB.l} y={VB.t} width={PW} height={PH} rx="16" fill={c.alpha('line', 0.02)} stroke={c.alpha('line', 0.1)} />
          {[25, 50, 75].map((v) => (
            <g key={v}>
              <line x1={sx(v)} x2={sx(v)} y1={VB.t + 6} y2={VB.t + PH - 6} stroke={c.alpha('line', 0.07)} strokeDasharray="3 6" />
              <line x1={VB.l + 6} x2={VB.l + PW - 6} y1={sy(v)} y2={sy(v)} stroke={c.alpha('line', 0.07)} strokeDasharray="3 6" />
            </g>
          ))}

          {/* White-space zone */}
          <motion.rect
            x={zone.x}
            y={zone.y}
            width={zone.w}
            height={zone.h}
            rx="18"
            fill={c.gold}
            filter={`url(#${uid}-glow)`}
            initial={{ opacity: 0.12 }}
            animate={{ opacity: inside ? [0.3, 0.42, 0.3] : [0.1, 0.2, 0.1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <rect
            x={zone.x}
            y={zone.y}
            width={zone.w}
            height={zone.h}
            rx="18"
            fill={`url(#${uid}-zone)`}
            stroke={c.gold}
            strokeOpacity={inside ? 0.9 : 0.5}
            strokeWidth={inside ? 1.6 : 1.2}
            strokeDasharray={inside ? undefined : '6 6'}
          />
          <text x={zone.x + 14} y={zone.y + 22} fontSize="10.5" fontWeight="700" letterSpacing="1.5" fill={c.gold}>
            {labels.whiteSpace.toUpperCase()}
          </text>
          <text x={zone.x + 14} y={zone.y + 39} fontSize="12" fontWeight="500" fill={c.text}>
            {labels.whiteSpaceLabel}
          </text>

          {/* Intended move (faint) and animated trail */}
          <path d={hintPath} fill="none" stroke={c.gold} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 6" markerEnd={`url(#${uid}-arrow)`} />
          {trail && (
            <motion.path
              d={trailPath}
              fill="none"
              stroke={c.gold}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ pathLength: trailLen }}
            />
          )}

          {/* Wafra target (ghost) */}
          <g transform={`translate(${sx(target.x)} ${sy(target.y)})`}>
            {atTarget && !reduce && (
              <motion.circle
                r="22"
                fill="none"
                stroke={c.gold}
                strokeWidth="2"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
            <circle r="21" fill={c.alpha('gold', 0.1)} stroke={c.gold} strokeWidth="1.5" strokeDasharray="4 4" />
            <text textAnchor="middle" dy="0.35em" fontSize="12" fontWeight="700" fill={c.gold}>
              W
            </text>
            <text textAnchor="middle" y="-30" fontSize="11.5" fontWeight="600" fill={c.gold}>
              {labels.target}
            </text>
          </g>

          {/* Peers (initials, never logos) */}
          {COMPETITORS.map((p, i) => {
            const at = PEER_POS[p.id];
            const on = highlight === p.id;
            const labelAbove = at.y < 20;
            return (
              <g
                key={p.id}
                transform={`translate(${sx(at.x)} ${sy(at.y)})`}
                onPointerEnter={() => onHighlight(p.id)}
                onPointerLeave={() => onHighlight(null)}
              >
                <motion.g
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  <motion.circle
                    initial={false}
                    animate={{ r: on ? 22 : 18 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    fill={c.elev}
                    stroke={on ? c.gold : c.alpha('line', 0.35)}
                    strokeWidth="1.5"
                  />
                  <text textAnchor="middle" dy="0.35em" fontSize="11" fontWeight="700" fill={c.text}>
                    {p.initials}
                  </text>
                </motion.g>
                <text textAnchor="middle" y={labelAbove ? -28 : 36} fontSize="11.5" fontWeight={on ? 700 : 500} fill={on ? c.text : c.muted}>
                  {labels.names[p.id]}
                </text>
              </g>
            );
          })}

          {/* Wafra today: draggable marker */}
          <motion.g style={{ x: px, y: py }}>
            <circle r="30" fill={c.brand} opacity="0.25" filter={`url(#${uid}-soft)`} />
            {focused && <circle r="28" fill="none" stroke={c.gold} strokeWidth="2" />}
            <g
              tabIndex={0}
              role="button"
              aria-roledescription="draggable marker"
              aria-label={labels.markerAria(Math.round(pos.x), Math.round(pos.y))}
              data-cursor="drag"
              onPointerDown={onMarkerDown}
              onKeyDown={onKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', outline: 'none' }}
            >
              <circle r="22" fill={`url(#${uid}-wafra)`} stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
              <text textAnchor="middle" dy="0.35em" fontSize="13" fontWeight="800" fill="#fff" pointerEvents="none">
                W
              </text>
            </g>
            <text textAnchor="middle" y="40" fontSize="11.5" fontWeight="700" fill={c.text} pointerEvents="none">
              {labels.today}
            </text>
          </motion.g>

          {/* Axes */}
          <line x1={VB.l} x2={VB.l + PW} y1={VB.t + PH + 16} y2={VB.t + PH + 16} stroke={c.alpha('line', 0.25)} markerEnd={`url(#${uid}-arrow)`} />
          <text x={VB.l} y={VB.t + PH + 36} fontSize="11.5" fill={c.muted}>
            {labels.axisX0}
          </text>
          <text x={VB.l + PW} y={VB.t + PH + 36} fontSize="11.5" fill={c.muted} textAnchor="end">
            {labels.axisX1}
          </text>
          <line x1={VB.l - 18} x2={VB.l - 18} y1={VB.t + PH} y2={VB.t} stroke={c.alpha('line', 0.25)} markerEnd={`url(#${uid}-arrow)`} />
          <text transform={`translate(${VB.l - 26} ${VB.t + PH}) rotate(-90)`} fontSize="11.5" fill={c.muted}>
            {labels.axisY0}
          </text>
          <text transform={`translate(${VB.l - 26} ${VB.t}) rotate(-90)`} fontSize="11.5" fill={c.muted} textAnchor="end">
            {labels.axisY1}
          </text>
        </svg>
      </div>
      <p className="mt-2 text-[0.6875rem] text-muted">{labels.dragHint}</p>
    </div>
  );
}

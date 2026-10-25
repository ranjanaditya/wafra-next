import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { subscribePointer, useFxEnabled, usePageVisible } from './hooks';
import { useApp } from '../../store';
import { cn } from '../../lib/cn';

/**
 * Hero particle constellation forming the geometric "W" monogram (same
 * geometry as the Monogram SVG in the top nav: viewBox 64, W polyline inside a
 * rounded square). About 140 particles on desktop, 60% fewer in presenter mode.
 * Particles lean toward the cursor (160px radius, gentle gravity), burst on
 * click and re-form. Pauses off-screen and when the tab is hidden. With reduced
 * motion or a coarse pointer it renders a static SVG constellation instead.
 */

type Pt = [number, number];

const BASE_COUNT = 140;
const RADIUS = 160;
const W_PATH: Pt[] = [
  [14, 20],
  [23, 46],
  [32, 28],
  [41, 46],
  [50, 20],
];
const FRAME = { x: 2, y: 2, w: 60, h: 60, r: 18 };

// Deterministic pseudo-random so layouts are stable across renders.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePolyline(pts: Pt[], n: number): { p: Pt; nx: number; ny: number }[] {
  const segs: { x1: number; y1: number; x2: number; y2: number; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ x1, y1, x2, y2, len });
    total += len;
  }
  const out: { p: Pt; nx: number; ny: number }[] = [];
  for (let k = 0; k < n; k++) {
    let d = ((k + 0.5) / n) * total;
    for (const s of segs) {
      if (d <= s.len) {
        const t = d / s.len;
        // Unit normal for stroke thickness.
        const nx = -(s.y2 - s.y1) / s.len;
        const ny = (s.x2 - s.x1) / s.len;
        out.push({ p: [s.x1 + (s.x2 - s.x1) * t, s.y1 + (s.y2 - s.y1) * t], nx, ny });
        break;
      }
      d -= s.len;
    }
  }
  return out;
}

function sampleRoundedRect(n: number): Pt[] {
  const { x, y, w, h, r } = FRAME;
  const sw = w - 2 * r;
  const sh = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const total = 2 * sw + 2 * sh + 4 * arc;
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total;
    if (d < sw) { out.push([x + r + d, y]); continue; }
    d -= sw;
    if (d < arc) { const a = -Math.PI / 2 + d / r; out.push([x + w - r + r * Math.cos(a), y + r + r * Math.sin(a)]); continue; }
    d -= arc;
    if (d < sh) { out.push([x + w, y + r + d]); continue; }
    d -= sh;
    if (d < arc) { const a = d / r; out.push([x + w - r + r * Math.cos(a), y + h - r + r * Math.sin(a)]); continue; }
    d -= arc;
    if (d < sw) { out.push([x + w - r - d, y + h]); continue; }
    d -= sw;
    if (d < arc) { const a = Math.PI / 2 + d / r; out.push([x + r + r * Math.cos(a), y + h - r + r * Math.sin(a)]); continue; }
    d -= arc;
    if (d < sh) { out.push([x, y + h - r - d]); continue; }
    d -= sh;
    const a = Math.PI + d / r;
    out.push([x + r + r * Math.cos(a), y + r + r * Math.sin(a)]);
  }
  return out;
}

type Kind = 0 | 1 | 2; // 0 W stroke · 1 frame · 2 W vertex
interface Home {
  ux: number;
  uy: number;
  r: number;
  color: 0 | 1 | 2; // 0 crimson · 1 gold · 2 violet
  ph: number;
  kind: Kind;
}

/** Home positions in viewBox units (0..64). */
function buildHomes(n: number): Home[] {
  const rand = rng(n * 7919 + 17);
  const nW = Math.round(n * 0.68);
  const nF = n - nW;
  const homes: Home[] = [];
  for (const [ux, uy] of W_PATH) homes.push({ ux, uy, r: 3, color: 1, ph: rand() * Math.PI * 2, kind: 2 });
  for (const s of samplePolyline(W_PATH, Math.max(0, nW - W_PATH.length))) {
    const off = (rand() - 0.5) * 3.4; // spread across the stroke width
    const c = rand();
    homes.push({
      ux: s.p[0] + s.nx * off,
      uy: s.p[1] + s.ny * off,
      r: 1.1 + rand() * 1.4,
      color: c < 0.6 ? 0 : c < 0.92 ? 1 : 2,
      ph: rand() * Math.PI * 2,
      kind: 0,
    });
  }
  for (const [ux, uy] of sampleRoundedRect(nF)) {
    homes.push({ ux, uy, r: 0.8 + rand() * 0.8, color: rand() < 0.75 ? 1 : 0, ph: rand() * Math.PI * 2, kind: 1 });
  }
  return homes;
}

export function Particles({ label, className }: { label: string; className?: string }) {
  const enabled = useFxEnabled();
  const presenter = useApp((s) => s.presenter);
  const count = presenter ? Math.round(BASE_COUNT * 0.4) : BASE_COUNT;
  return (
    <div role="img" aria-label={label} className={cn('relative', className)}>
      {enabled ? <ParticleCanvas count={count} /> : <StaticConstellation count={count} />}
    </div>
  );
}

// ───────────────────────── Static fallback ─────────────────────────
function StaticConstellation({ count }: { count: number }) {
  const homes = useMemo(() => buildHomes(count), [count]);
  const gid = useId().replace(/:/g, '');
  const fill = ['rgb(var(--brand))', 'rgb(var(--gold))', 'rgb(var(--ai))'];
  return (
    <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'rgb(var(--brand))' }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--gold))' }} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`}>
          <stop offset="0" style={{ stopColor: 'rgb(var(--brand))', stopOpacity: 0.22 }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--brand))', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="34" r="30" fill={`url(#${gid}-glow)`} />
      <rect x="2" y="2" width="60" height="60" rx="18" fill="none" style={{ stroke: 'rgb(var(--gold) / 0.16)' }} strokeWidth="0.25" />
      <path d="M14 20l9 26 9-18 9 18 9-26" fill="none" stroke={`url(#${gid}-w)`} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
      <path d="M14 20l9 26 9-18 9 18 9-26" fill="none" stroke={`url(#${gid}-w)`} strokeWidth="0.35" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      {homes.map((h, i) => (
        <circle key={i} cx={h.ux} cy={h.uy} r={h.kind === 2 ? 0.9 : h.r * 0.22} style={{ fill: fill[h.color] }} opacity={h.kind === 1 ? 0.6 : 0.9} />
      ))}
    </svg>
  );
}

// ───────────────────────── Canvas simulation ─────────────────────────
interface P extends Home {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hx: number;
  hy: number;
}

interface Palette {
  rgb: [string, string, string];
  line: string;
  sprites: HTMLCanvasElement[];
  light: boolean;
}

interface Sim {
  ps: P[];
  w: number;
  h: number;
  dpr: number;
  scale: number;
  ox: number;
  oy: number;
  laidOut: boolean;
  cx: number;
  cy: number;
  active: boolean;
  mx: number;
  my: number;
  hasPointer: boolean;
  burst: number;
  pal: Palette | null;
}

function makeSprite(rgb: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.16, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.4, `rgba(${rgb},0.25)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string) => (cs.getPropertyValue(`--${n}`).trim() || '128 128 128').split(/\s+/).join(',');
  const rgb: [string, string, string] = [get('brand'), get('gold'), get('ai')];
  const light = document.documentElement.dataset.theme === 'light';
  return { rgb, line: light ? get('brand') : get('gold'), sprites: rgb.map(makeSprite), light };
}

function layout(s: Sim) {
  if (!s.w || !s.h) return;
  s.scale = (Math.min(s.w, s.h) * 0.9) / 64;
  s.ox = (s.w - 64 * s.scale) / 2;
  s.oy = (s.h - 64 * s.scale) / 2;
  for (const p of s.ps) {
    p.hx = s.ox + p.ux * s.scale;
    p.hy = s.oy + p.uy * s.scale;
  }
}

function scatter(s: Sim) {
  const rand = rng(99);
  for (const p of s.ps) {
    p.x = rand() * s.w;
    p.y = rand() * s.h;
    p.vx = (rand() - 0.5) * 4;
    p.vy = (rand() - 0.5) * 4;
  }
}

function burstAt(s: Sim, x: number, y: number) {
  for (const p of s.ps) {
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.hypot(dx, dy) || 1;
    const power = 6 + 18 * Math.max(0, 1 - d / 260);
    const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.7;
    const k = 0.6 + Math.random() * 0.7;
    p.vx += Math.cos(ang) * power * k;
    p.vy += Math.sin(ang) * power * k;
  }
  s.burst = 1;
}

function step(s: Sim, dt: number, now: number, rect: DOMRect) {
  const mx = s.cx - rect.left;
  const my = s.cy - rect.top;
  s.mx = mx;
  s.my = my;
  s.hasPointer = s.active && mx > -RADIUS && my > -RADIUS && mx < s.w + RADIUS && my < s.h + RADIUS;
  const k = 0.022 * (1 - s.burst * 0.9);
  const damp = Math.pow(0.86, dt);
  const t = now * 0.001;
  const drift = 0.22 * s.scale;
  const R2 = RADIUS * RADIUS;
  for (const p of s.ps) {
    const tx = p.hx + Math.sin(t * 0.7 + p.ph) * drift;
    const ty = p.hy + Math.cos(t * 0.9 + p.ph * 1.3) * drift;
    let ax = (tx - p.x) * k;
    let ay = (ty - p.y) * k;
    if (s.hasPointer) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 1) {
        const d = Math.sqrt(d2);
        const f = (1 - d / RADIUS) * 0.55; // gentle gravity toward the cursor
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
    }
    p.vx = (p.vx + ax * dt) * damp;
    p.vy = (p.vy + ay * dt) * damp;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  s.burst = Math.max(0, s.burst - 0.012 * dt);
}

const BINS = 5;
function draw(s: Sim, ctx: CanvasRenderingContext2D, now: number) {
  const { dpr, w, h, ps, pal } = s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!pal) return;
  const rScale = Math.max(0.6, Math.min(1.6, s.scale / 7.5));

  // Constellation links, batched by opacity.
  const L = 3.5 * s.scale;
  const L2 = L * L;
  const bins = Array.from({ length: BINS }, () => new Path2D());
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i];
    for (let j = i + 1; j < ps.length; j++) {
      const b = ps[j];
      const dx = a.x - b.x;
      if (dx > L || dx < -L) continue;
      const dy = a.y - b.y;
      if (dy > L || dy < -L) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 < L2) {
        const q = 1 - Math.sqrt(d2) / L;
        const bi = Math.min(BINS - 1, Math.floor(q * BINS));
        bins[bi].moveTo(a.x, a.y);
        bins[bi].lineTo(b.x, b.y);
      }
    }
  }
  ctx.lineWidth = 0.7;
  const base = pal.light ? 0.26 : 0.32;
  for (let bi = 0; bi < BINS; bi++) {
    ctx.strokeStyle = `rgba(${pal.line},${(((bi + 1) / BINS) * base).toFixed(3)})`;
    ctx.stroke(bins[bi]);
  }

  // Threads from the cursor to nearby particles.
  if (s.hasPointer) {
    const cl = new Path2D();
    const C = 120;
    for (const p of ps) {
      const dx = p.x - s.mx;
      const dy = p.y - s.my;
      if (dx * dx + dy * dy < C * C) {
        cl.moveTo(s.mx, s.my);
        cl.lineTo(p.x, p.y);
      }
    }
    ctx.strokeStyle = `rgba(${pal.line},${pal.light ? 0.08 : 0.1})`;
    ctx.lineWidth = 0.5;
    ctx.stroke(cl);
  }

  // Particles: additive glow on dark, plain on light.
  ctx.globalCompositeOperation = pal.light ? 'source-over' : 'lighter';
  const t = now * 0.002;
  for (const p of ps) {
    const tw = 0.62 + 0.38 * Math.sin(t + p.ph);
    const spr = pal.sprites[p.color];
    const g = p.r * 7 * rScale;
    ctx.globalAlpha = (p.kind === 2 ? 0.5 : 0.3) * tw;
    ctx.drawImage(spr, p.x - g / 2, p.y - g / 2, g, g);
    const c = p.r * 2.4 * rScale;
    ctx.globalAlpha = 0.25 + 0.75 * tw;
    ctx.drawImage(spr, p.x - c / 2, p.y - c / 2, c, c);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function ParticleCanvas({ count }: { count: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const theme = useApp((s) => s.theme);
  const pageVisible = usePageVisible();
  const [onScreen, setOnScreen] = useState(true);
  const sim = useRef<Sim>({
    ps: [],
    w: 0,
    h: 0,
    dpr: 1,
    scale: 1,
    ox: 0,
    oy: 0,
    laidOut: false,
    cx: -9999,
    cy: -9999,
    active: false,
    mx: -9999,
    my: -9999,
    hasPointer: false,
    burst: 1,
    pal: null,
  });

  // Palette follows the theme (read after <html data-theme> updates).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      sim.current.pal = readPalette();
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  // (Re)build particles when the count changes, keeping existing positions.
  useEffect(() => {
    const s = sim.current;
    const prev = s.ps;
    s.ps = buildHomes(count).map((h, i) => {
      const o = prev[i];
      return { ...h, x: o?.x ?? s.w / 2, y: o?.y ?? s.h / 2, vx: o?.vx ?? 0, vy: o?.vy ?? 0, hx: 0, hy: 0 };
    });
    layout(s);
    if (s.laidOut && prev.length < s.ps.length) s.burst = Math.max(s.burst, 0.6);
  }, [count]);

  // Size the canvas (DPR-aware) and lay out the monogram.
  useEffect(() => {
    const el = wrap.current;
    const c = cvs.current;
    if (!el || !c) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = sim.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = s.w;
      const ph = s.h;
      s.w = r.width;
      s.h = r.height;
      s.dpr = dpr;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      layout(s);
      if (!s.laidOut) {
        s.laidOut = true;
        scatter(s);
        s.burst = 1;
      } else if (pw && ph) {
        for (const p of s.ps) {
          p.x *= r.width / pw;
          p.y *= r.height / ph;
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pause when off-screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Shared pointer feed; forget the cursor when it leaves the window.
  useEffect(() => {
    const unsub = subscribePointer((x, y) => {
      const s = sim.current;
      s.cx = x;
      s.cy = y;
      s.active = true;
    });
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) sim.current.active = false;
    };
    window.addEventListener('pointerout', out);
    return () => {
      unsub();
      window.removeEventListener('pointerout', out);
    };
  }, []);

  const running = pageVisible && onScreen;
  useEffect(() => {
    if (!running) return;
    const c = cvs.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.667);
      last = now;
      const s = sim.current;
      if (s.laidOut) {
        step(s, dt, now, c.getBoundingClientRect());
        draw(s, ctx, now);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const c = cvs.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    burstAt(sim.current, e.clientX - r.left, e.clientY - r.top);
  };

  return (
    <div ref={wrap} className="absolute inset-0 touch-none" onPointerDown={onDown}>
      <canvas ref={cvs} className="block h-full w-full" aria-hidden />
    </div>
  );
}

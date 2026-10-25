import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  Fingerprint,
  Flag,
  HandCoins,
  Handshake,
  Hammer,
  Headset,
  Lock,
  LockOpen,
  ShoppingBag,
} from 'lucide-react';
import { useLang, useT, useTpl } from '../../i18n';
import { ASK, DIGITAL_PEERS, FY, PNL_BASE, WAFRA, type SourceId } from '../../data/deck';
import { cn } from '../../lib/cn';
import { iso } from '../../lib/format';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';

export const EASE = [0.22, 1, 0.36, 1] as const;
const VIEW = { once: true, margin: '-60px' } as const;

/** "~4%" / "~6.9%" kept as one isolated run so RTL never reorders the tilde. */
export function useApprox() {
  const f = useFmt();
  return {
    pct: (v: number, dp = 0) => (f.lang === 'ar' ? iso(`~${f.num(v, dp)}%`) : `~${f.num(v, dp)}%`),
    mill: (v: number, dp = 1) => (f.lang === 'ar' ? `${iso(`~${f.num(v, dp)}`)} مليون` : `~${f.num(v, dp)}m`),
  };
}

export function VisualCard({
  title,
  src,
  children,
  className,
  border = 'gold',
}: {
  title: ReactNode;
  src?: SourceId;
  children: ReactNode;
  className?: string;
  border?: 'gold' | 'ai' | 'none';
}) {
  return (
    <SpotlightCard border={border} className={cn('p-5 sm:p-6', className)}>
      <div className="relative z-[2] mb-5 flex items-center justify-between gap-3">
        <h3 className="eyebrow">{title}</h3>
        {src && <SourceChip src={src} />}
      </div>
      <div className="relative z-[2]">{children}</div>
    </SpotlightCard>
  );
}

const Divider = () => <div className="my-5 h-px bg-line/10" aria-hidden />;

/** Small radial gauge that fills on view (demand gauge). */
export function MiniRing({ value, tone = 'gold', size = 44 }: { value: number; tone?: 'gold' | 'brand' | 'pass'; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const color = tone === 'gold' ? 'rgb(var(--gold))' : tone === 'brand' ? 'rgb(var(--brand))' : 'rgb(var(--pass))';
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" style={{ stroke: 'rgb(var(--line) / 0.1)' }} />
      <motion.circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        style={{ stroke: color }}
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
        viewport={VIEW}
        transition={{ duration: 1.3, ease: EASE, delay: 0.15 }}
      />
    </svg>
  );
}

// ───────────────────────── 1 · Problem: diverging growth and returns ─────────────────────────
export function GrowthGap() {
  const t = useT();
  const f = useFmt();
  const ap = useApprox();
  const p = t.story.problem;
  const rtl = useLang() === 'ar';
  const rows = [
    { key: 'retail', label: p.retail, v: WAFRA.retailGrowth, cls: 'from-brand-deep to-brand' },
    { key: 'sme', label: p.sme, v: WAFRA.smeGrowth, cls: 'from-gold/50 to-gold' },
  ];
  const max = Math.max(WAFRA.retailGrowth, WAFRA.smeGrowth);
  const roeMax = 20;
  const markers = [
    { key: 'wafra', label: p.wafra, v: WAFRA.roe, src: 'caseDeck' as SourceId, dot: 'bg-brand', dp: 1 },
    { key: 'sector', label: p.sector, v: WAFRA.sectorRoe, src: 'samaFsr' as SourceId, dot: 'bg-gold', dp: 1 },
  ];
  return (
    <VisualCard title={p.visualTitle} src="caseDeck">
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="font-medium">{r.label}</span>
              <Fig src="caseDeck" className="font-display text-lg font-semibold">
                {ap.pct(r.v)}
              </Fig>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-line/[0.07]">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r rtl:bg-gradient-to-l', r.cls)}
                style={{ width: `${(r.v / max) * 100}%`, originX: rtl ? 1 : 0 }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VIEW}
                transition={{ delay: 0.15 + i * 0.14, duration: 1.1, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div>
        <div className="mb-3 text-[13px] font-medium">{p.roeTitle}</div>
        <div className="relative h-9">
          <div className="absolute inset-x-0 top-[14px] h-1.5 rounded-full bg-line/[0.08]" />
          {[0, 5, 10, 15, 20].map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="num absolute top-[26px] -translate-x-1/2 text-[10px] text-muted/70 rtl:translate-x-1/2"
              style={{ insetInlineStart: `${(tick / roeMax) * 100}%` }}
            >
              {tick}
            </span>
          ))}
          {markers.map((mk, i) => (
            <span
              key={mk.key}
              aria-hidden
              className="absolute top-[8px] h-[18px] w-[18px] -translate-x-1/2 rtl:translate-x-1/2"
              style={{ insetInlineStart: `${(mk.v / roeMax) * 100}%` }}
            >
              <motion.span
                className={cn('block h-full w-full rounded-full border-[3px] border-elev', mk.dot)}
                style={{ boxShadow: '0 0 0 1px rgb(var(--line) / 0.25), 0 0 18px rgb(var(--gold) / 0.25)' }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={VIEW}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.4 + i * 0.15 }}
              />
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {markers.map((mk) => (
            <div key={mk.key} className="inner flex items-center gap-2.5 px-3 py-2">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', mk.dot)} aria-hidden />
              <span className="min-w-0 flex-1 text-[12px] leading-snug text-muted">{mk.label}</span>
              <Fig src={mk.src} className="font-display text-[15px] font-semibold">
                {f.pct(mk.v, mk.dp)}
              </Fig>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">{p.techTitle}</div>
          <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="mt-2 h-5 w-full rtl:-scale-x-100" aria-hidden>
            <motion.line
              x1="4"
              y1="10"
              x2="192"
              y2="10"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 5"
              style={{ stroke: 'rgb(var(--muted) / 0.6)' }}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={VIEW}
              transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
            />
            <circle cx="194" cy="10" r="4" style={{ fill: 'rgb(var(--gold))' }} />
          </svg>
        </div>
        <div className="text-end">
          <Fig src="caseDeck" className="font-display text-lg font-semibold">
            {ap.pct(WAFRA.techSpend, 1)}
          </Fig>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{p.flat}</div>
        </div>
      </div>
    </VisualCard>
  );
}

// ───────────────────────── 2 · Insight: convenience is solved, salary-to-credit is open ─────────────────────────
export function ConvenienceGap() {
  const t = useT();
  const tp = useTpl();
  const lang = useLang();
  const dir = lang === 'ar' ? -1 : 1;
  const ins = t.story.insight;
  const plus = (s: string) => (lang === 'en' ? s : tp(ins.plusM, { n: parseInt(s, 10) }));
  const peers = [
    { id: 'd360', initials: 'D3', name: ins.d360Name, value: plus(DIGITAL_PEERS.d360Customers), label: ins.d360Label, src: 'digitalBanker' as SourceId },
    { id: 'stc', initials: 'SB', name: ins.stcName, value: plus(DIGITAL_PEERS.stcCustomers), label: ins.stcLabel, src: 'menaStartup' as SourceId },
  ];
  const openIcons = [Banknote, HandCoins, Headset];
  return (
    <VisualCard title={ins.visualTitle}>
      <div className="grid gap-3 sm:grid-cols-2">
        {peers.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: EASE }}
            className="inner flex items-center gap-3 p-3"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/15 bg-line/[0.06] font-display text-[13px] font-semibold" aria-hidden>
              {p.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                {p.name}
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{ins.digitalBank}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[12px] text-muted">
                <Fig src={p.src} className="font-display text-[17px] font-semibold text-ink">
                  {p.value}
                </Fig>
                <span>{p.label}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Divider />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="eyebrow mb-3">{ins.solvedTitle}</div>
          <ul className="space-y-2.5">
            {ins.solved.map((s, i) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -8 * dir }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={VIEW}
                transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease: EASE }}
                className="flex items-center gap-2.5 text-[13px] text-muted"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line/10 text-muted">
                  <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="line-through decoration-line/30">{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEW}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
          className="relative overflow-hidden rounded-inner border border-gold/35 bg-gold/[0.07] p-4 shadow-goldglow"
        >
          <div className="eyebrow mb-3 !text-gold">{ins.openTitle}</div>
          <ul className="space-y-2.5">
            {ins.open.map((s, i) => {
              const Icon = openIcons[i];
              return (
                <motion.li
                  key={s}
                  initial={{ opacity: 0, x: 8 * dir }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={VIEW}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: EASE }}
                  className="flex items-center gap-2.5 text-[13px] font-medium"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </span>
                  {s}
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </VisualCard>
  );
}

// ───────────────────────── 3 · Recommendation: the three pillars ─────────────────────────
export function Pillars() {
  const t = useT();
  const r = t.story.recommendation;
  const rtl = useLang() === 'ar';
  const icons = [Fingerprint, HandCoins, Headset];
  const modes = [
    { label: r.build, what: r.buildWhat, Icon: Hammer, cls: 'text-brand bg-brand/10 border-brand/25' },
    { label: r.buy, what: r.buyWhat, Icon: ShoppingBag, cls: 'text-ink bg-line/[0.06] border-line/15' },
    { label: r.partner, what: r.partnerWhat, Icon: Handshake, cls: 'text-gold bg-gold/10 border-gold/25' },
  ];
  return (
    <VisualCard title={r.visualTitle}>
      <div className="relative grid gap-5 sm:grid-cols-3 sm:gap-4">
        <motion.div
          aria-hidden
          className="absolute inset-x-[16.6%] top-6 hidden h-px bg-gradient-to-r from-brand via-gold to-brand sm:block"
          style={{ originX: rtl ? 1 : 0 }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEW}
          transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
        />
        {r.pillars.map((p, i) => {
          const Icon = icons[i];
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEW}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: EASE }}
              className="relative text-center"
            >
              <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-elev text-gold shadow-goldglow">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                <span className="num absolute -end-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
              </div>
              <div className="mt-3 font-display text-[15px] font-semibold leading-snug">{p.title}</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{p.body}</p>
            </motion.div>
          );
        })}
      </div>

      <Divider />

      <div className="grid gap-2 sm:grid-cols-3">
        {modes.map((md, i) => (
          <motion.div
            key={md.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ delay: 0.45 + i * 0.06, duration: 0.5, ease: EASE }}
            className="inner flex items-start gap-2.5 p-3"
          >
            <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', md.cls)}>
              <md.Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold">{md.label}</div>
              <div className="text-[11.5px] leading-snug text-muted">{md.what}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[r.noLicence, r.noBranches].map((b) => (
          <span key={b} className="chip !px-2.5 !py-1 !text-[12px] text-ink">
            <BadgeCheck className="h-3.5 w-3.5 text-pass" strokeWidth={1.75} aria-hidden />
            {b}
          </span>
        ))}
        <span className="text-[11px] text-muted">· {r.sama}</span>
      </div>
    </VisualCard>
  );
}

// ───────────────────────── 4 · Economics: the J-curve ─────────────────────────
export function JCurve() {
  const t = useT();
  const f = useFmt();
  const e = t.story.economics;
  const data = PNL_BASE.cumulative;
  const W = 480;
  const H = 250;
  const x0 = 46;
  const dx = 97;
  const yTop = 58;
  const yBot = 196;
  const min = -150;
  const X = (i: number) => x0 + i * dx;
  const Y = (v: number) => yTop + (v / min) * (yBot - yTop);
  const pts = data.map((v, i) => [X(i), Y(v)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L ${X(data.length - 1)} ${yTop} L ${X(0)} ${yTop} Z`;
  let trough = 0;
  data.forEach((v, i) => {
    if (v < data[trough]) trough = i;
  });
  const beIdx = FY.indexOf('FY30');
  const pctX = (x: number) => `${(x / W) * 100}%`;
  const pctY = (y: number) => `${(y / H) * 100}%`;

  return (
    <VisualCard title={e.visualTitle} src="teamModel">
      <div dir="ltr" className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="story-j-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'rgb(var(--brand))', stopOpacity: 0.05 }} />
              <stop offset="1" style={{ stopColor: 'rgb(var(--brand))', stopOpacity: 0.32 }} />
            </linearGradient>
            <linearGradient id="story-j-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: 'rgb(var(--brand))' }} />
              <stop offset="0.55" style={{ stopColor: 'rgb(var(--brand-hover))' }} />
              <stop offset="1" style={{ stopColor: 'rgb(var(--gold))' }} />
            </linearGradient>
          </defs>
          {[-50, -100, -150].map((g) => (
            <line key={g} x1={24} x2={W - 10} y1={Y(g)} y2={Y(g)} strokeWidth="1" style={{ stroke: 'rgb(var(--line) / 0.06)' }} />
          ))}
          <line x1={24} x2={W - 10} y1={yTop} y2={yTop} strokeWidth="1" strokeDasharray="3 4" style={{ stroke: 'rgb(var(--line) / 0.3)' }} />
          <text x={16} y={yTop + 3.5} fontSize="10" textAnchor="middle" style={{ fill: 'rgb(var(--muted))' }}>
            0
          </text>
          <motion.path d={area} fill="url(#story-j-area)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={VIEW} transition={{ duration: 1, delay: 0.6 }} />
          <motion.path
            d={line}
            fill="none"
            stroke="url(#story-j-line)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEW}
            transition={{ duration: 1.5, ease: EASE, delay: 0.15 }}
          />
          <line
            x1={X(beIdx)}
            x2={X(beIdx)}
            y1={yTop - 24}
            y2={pts[beIdx][1] - 7}
            strokeWidth="1"
            strokeDasharray="2 3"
            style={{ stroke: 'rgb(var(--gold) / 0.7)' }}
          />
          {pts.map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={i === trough ? 5.5 : 3.6}
              strokeWidth="2"
              style={{ fill: i === trough ? 'rgb(var(--brand))' : 'rgb(var(--elev))', stroke: i === trough ? 'rgb(var(--text))' : 'rgb(var(--gold))' }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={VIEW}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 + i * 0.22 }}
            />
          ))}
          <circle
            cx={pts[trough][0]}
            cy={pts[trough][1]}
            r="6"
            fill="none"
            strokeWidth="1.5"
            className="animate-pulseRing"
            style={{ stroke: 'rgb(var(--brand))', transformBox: 'fill-box', transformOrigin: 'center' }}
          />
          {FY.map((fy, i) => (
            <text key={fy} x={X(i)} y={H - 8} fontSize="11" textAnchor="middle" style={{ fill: 'rgb(var(--muted))' }}>
              {fy}
            </text>
          ))}
        </svg>

        {pts.map(([x, y], i) => (
          <div key={i} className="absolute -translate-x-1/2" style={{ left: pctX(x), top: pctY(y + (i === trough ? 11 : 9)) }}>
            <Fig src="teamModel" className={cn('text-[12px] font-semibold', i === trough ? 'text-brand' : 'text-ink/90')}>
              {f.paren(data[i])}
            </Fig>
          </div>
        ))}

        <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: pctX(pts[trough][0]), top: pctY(pts[trough][1] - 16) }}>
          <span className="whitespace-nowrap rounded-full border border-brand/40 bg-brand/15 px-2 py-0.5 text-[10.5px] font-semibold text-ink" dir="auto">
            {e.trough} · {f.fy(FY[trough])}
          </span>
        </div>

        <div className="absolute -translate-x-1/2" style={{ left: pctX(X(beIdx)), top: pctY(yTop - 50) }}>
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10.5px] font-semibold text-gold" dir="auto">
            <Flag className="h-3 w-3" strokeWidth={1.75} aria-hidden />
            {e.breakEven}
            <Fig src="teamModel">{f.fy(FY[beIdx])}</Fig>
          </span>
        </div>
      </div>
    </VisualCard>
  );
}

// ───────────────────────── 5 · The ask: gate locks and the exposure meter ─────────────────────────
export function GateLocks() {
  const t = useT();
  const f = useFmt();
  const lang = useLang();
  const a = t.story.ask;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const values = [ASK.gate1, ASK.gate2, ASK.peak];
  const fracs = values.map((v) => v / ASK.peak);
  const p = useMotionValue(reduce ? 1 : 0);
  const [opened, setOpened] = useState(reduce ? values.length : 0);

  useMotionValueEvent(p, 'change', (v) => setOpened(fracs.filter((fr) => v >= fr - 0.002).length));
  useEffect(() => {
    if (reduce) {
      p.set(1);
      setOpened(values.length);
      return;
    }
    if (!inView) return;
    const c = animate(p, 1, { duration: 2.8, ease: [0.45, 0, 0.2, 1], delay: 0.3 });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);

  return (
    <VisualCard title={a.visualTitle} src="teamGates">
      <div ref={ref} dir="ltr" className="px-6 pb-1 pt-1">
        <div className="relative h-[124px]">
          {values.map((v, i) => {
            const open = i < opened;
            return (
              <div key={i} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${fracs[i] * 100}%` }}>
                <motion.div
                  animate={open ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors duration-500',
                    open ? 'border-pass/50 bg-pass/15 text-pass shadow-[0_0_28px_-6px_rgb(var(--pass)/0.7)]' : 'border-line/15 bg-elev text-muted',
                  )}
                >
                  {open ? <LockOpen className="h-5 w-5" strokeWidth={1.5} aria-hidden /> : <Lock className="h-5 w-5" strokeWidth={1.5} aria-hidden />}
                  <span className="num absolute -top-2 rounded-full border border-line/15 bg-elev px-1.5 text-[10px] font-semibold text-ink">G{i + 1}</span>
                </motion.div>
                <div className="mt-[34px] whitespace-nowrap text-center">
                  <Fig src="teamGates" className="font-display text-[14px] font-semibold">
                    {f.sarM(v)}
                  </Fig>
                </div>
              </div>
            );
          })}
          <div className="absolute inset-x-0 top-[62px] h-2.5 overflow-hidden rounded-full bg-line/[0.08]">
            <motion.div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-deep via-brand to-gold" style={{ scaleX: p, originX: 0 }} />
          </div>
          {fracs.map((fr, i) => (
            <span key={i} aria-hidden className="absolute top-[56px] h-[22px] w-px -translate-x-1/2 bg-line/30" style={{ left: `${fr * 100}%` }} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {(lang === 'ar' ? [...a.gates].reverse() : a.gates).map((g, ri) => {
            const i = lang === 'ar' ? a.gates.length - 1 - ri : ri;
            const open = i < opened;
            return (
              <div key={g} className={cn('inner px-2.5 py-2 text-center transition-colors duration-500', open && 'border-pass/30')}>
                <div className="text-[11.5px] font-medium leading-snug">{g}</div>
                <div className={cn('mt-1 text-[10px] font-semibold uppercase tracking-wide', open ? 'text-pass' : 'text-muted')}>
                  {open ? a.released : a.locked}
                  {i === values.length - 1 && ` · ${a.peak}`}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[12px] text-muted" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <ArrowRight className="h-3.5 w-3.5 text-gold rtl:-scale-x-100" strokeWidth={1.5} aria-hidden />
          {a.releases}
        </div>
      </div>
    </VisualCard>
  );
}

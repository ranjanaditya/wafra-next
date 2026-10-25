import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Boxes,
  Hammer,
  Handshake,
  KeyRound,
  Landmark,
  Package,
  Rocket,
  ShieldCheck,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { BBP, BBP_CRITERIA, BBP_MAX, OPERATING_LAYERS, RUN_COST, WAFRA } from '../../data/deck';
import { useT, useTpl } from '../../i18n';
import { useFmt } from '../../components/ui/useFmt';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { RunCostChart } from '../../components/charts/strategy/RunCostChart';
import { cn } from '../../lib/cn';
import { CardHead, EASE, Item, Rich, SecHead, Stagger } from './ui';

type Crit = (typeof BBP_CRITERIA)[number];
type SortKey = 'deck' | Crit | 'total';
type Layer = (typeof OPERATING_LAYERS)[number];
type OptionId = keyof ReturnType<typeof useT>['strategy']['how']['options'];

function Dots({ v, rec }: { v: number; rec: boolean }) {
  return (
    <span className="mt-1 flex justify-center gap-[3px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn('h-1.5 w-1.5 rounded-full', n <= v ? (rec ? 'bg-gold' : 'bg-ink/55') : 'bg-line/15')}
        />
      ))}
    </span>
  );
}

function Scorecard() {
  const t = useT().strategy.how;
  const tpl = useTpl();
  const f = useFmt();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'desc' | 'asc' }>({ key: 'deck', dir: 'desc' });

  const rows = useMemo(() => {
    const base = BBP.map((r, order) => ({ ...r, order }));
    if (sort.key === 'deck') return base;
    const k = sort.key;
    const val = (r: (typeof base)[number]) => (k === 'total' ? r.total : r.scores[BBP_CRITERIA.indexOf(k)]);
    return [...base].sort((a, b) => (sort.dir === 'desc' ? val(b) - val(a) : val(a) - val(b)) || a.order - b.order);
  }, [sort]);

  const click = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  const icon = (k: SortKey) =>
    sort.key !== k ? (
      <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={1.5} aria-hidden />
    ) : sort.dir === 'desc' ? (
      <ArrowDown className="h-3 w-3 text-gold" strokeWidth={2} aria-hidden />
    ) : (
      <ArrowUp className="h-3 w-3 text-gold" strokeWidth={2} aria-hidden />
    );

  const ariaSort = (k: SortKey) => (sort.key === k ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none');
  const headBtn = (k: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => click(k)}
      aria-label={tpl(t.sortAria, { c: label })}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-line/10 hover:text-ink',
        sort.key === k && 'text-ink',
      )}
    >
      {label}
      {icon(k)}
    </button>
  );

  return (
    <SpotlightCard border="gold" className="h-full p-5">
      <CardHead
        title={t.scoreTitle}
        hint={t.scoreHint}
        right={
          <>
            <button
              type="button"
              onClick={() => setSort({ key: 'deck', dir: 'desc' })}
              aria-pressed={sort.key === 'deck'}
              className={cn('chip transition-colors', sort.key === 'deck' ? 'border-gold/40 text-gold' : 'text-muted hover:text-ink')}
            >
              {t.deckOrder}
            </button>
            <SourceChip src="teamView" />
          </>
        }
      />
      <div className="-mx-2 overflow-x-auto px-2 pb-1">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-[0.8125rem]">
          <thead>
            <tr className="text-[0.6875rem] text-muted">
              <th scope="col" className="pb-1 ps-3 text-start font-medium">
                {t.option}
              </th>
              {BBP_CRITERIA.map((k) => (
                <th key={k} scope="col" aria-sort={ariaSort(k)} className="pb-1 text-center font-medium">
                  {headBtn(k, t.criteria[k])}
                </th>
              ))}
              <th scope="col" aria-sort={ariaSort('total')} className="pb-1 pe-2 text-end font-medium">
                {headBtn('total', t.total)}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rec = !!r.recommended;
              const cell = rec ? 'bg-gold/[0.09]' : 'bg-line/[0.03]';
              const opt = t.options[r.id as OptionId];
              return (
                <motion.tr key={r.id} layout transition={{ type: 'spring', stiffness: 420, damping: 36 }}>
                  <td
                    className={cn(
                      'rounded-s-xl py-2.5 pe-3 ps-3 align-middle',
                      cell,
                      rec && 'shadow-[inset_3px_0_0_rgb(var(--gold))] rtl:shadow-[inset_-3px_0_0_rgb(var(--gold))]',
                    )}
                  >
                    {rec && (
                      <span className="mb-1 inline-flex rounded-full border border-gold/40 bg-gold/15 px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-wide text-gold">
                        {t.recommended}
                      </span>
                    )}
                    <div className={cn('font-semibold leading-snug', rec && 'text-ink')}>{opt.name}</div>
                    <div className="text-[0.6875rem] leading-snug text-muted">{opt.note}</div>
                  </td>
                  {r.scores.map((v, i) => (
                    <td key={i} className={cn('px-1 py-2.5 text-center align-middle', cell)}>
                      <Fig src="teamView" className="font-semibold">
                        {f.num(v)}
                      </Fig>
                      <Dots v={v} rec={rec} />
                    </td>
                  ))}
                  <td className={cn('rounded-e-xl py-2.5 pe-3 ps-2 text-end align-middle', cell)}>
                    <div className={cn('font-display text-[1.125rem] font-semibold leading-none', rec && 'text-gold')}>
                      <Fig src="teamView">{f.num(r.total)}</Fig>
                    </div>
                    <div className="mt-1 text-[0.625rem] text-muted">{tpl(t.outOf, { max: BBP_MAX })}</div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted">{t.scoreNote}</p>
    </SpotlightCard>
  );
}

const LAYER_ICONS: Record<Layer, LucideIcon> = {
  customers: Users,
  digitalUnit: Rocket,
  staysInBank: Landmark,
  modularTech: Boxes,
  partners: Handshake,
};

function OperatingModel() {
  const t = useT().strategy.how;
  const [active, setActive] = useState<Layer>('digitalUnit');
  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <CardHead title={t.layersTitle} hint={t.layersHint} right={<SourceChip src="report" />} />
      <div className="space-y-1.5">
        {OPERATING_LAYERS.map((id, i) => {
          const Icon = LAYER_ICONS[id];
          const on = active === id;
          return (
            <motion.button
              key={id}
              type="button"
              onMouseEnter={() => setActive(id)}
              onFocus={() => setActive(id)}
              onClick={() => setActive(id)}
              aria-pressed={on}
              animate={{ scale: on ? 1.02 : 1, y: on ? -2 : 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={cn(
                'flex w-full items-center gap-3 rounded-inner border px-3 py-2.5 text-start transition-colors',
                on ? 'border-gold/45 bg-gold/[0.09] shadow-goldglow' : 'border-line/10 bg-line/[0.035] hover:bg-line/[0.06]',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  on ? 'bg-gold/20 text-gold' : id === 'digitalUnit' ? 'bg-brand/15 text-brand' : 'bg-line/[0.07] text-muted',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="flex-1 text-[0.8125rem] font-semibold leading-snug">{t.layers[id].name}</span>
              <span className="num text-[0.625rem] text-muted">0{i + 1}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="inner mt-3 min-h-[7rem] flex-1 p-3.5" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className="mb-1 text-[0.75rem] font-semibold text-gold">{t.layers[active].name}</div>
            <p className="text-[0.8125rem] leading-relaxed text-ink/85">{t.layers[active].body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted">{t.governance}</p>
    </SpotlightCard>
  );
}

function WhoDoesWhat() {
  const t = useT().strategy.how;
  const cols: { key: 'build' | 'buy' | 'partner'; items: string[]; Icon: LucideIcon; tone: string }[] = [
    { key: 'build', items: t.buildItems, Icon: Hammer, tone: 'border-brand/35 bg-brand/10 text-brand' },
    { key: 'buy', items: t.buyItems, Icon: Package, tone: 'border-gold/35 bg-gold/10 text-gold' },
    { key: 'partner', items: t.partnerItems, Icon: Handshake, tone: 'border-line/25 bg-line/[0.07] text-ink' },
  ];
  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <CardHead title={t.bbpTitle} right={<SourceChip src="report" />} />
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        {cols.map(({ key, items, Icon, tone }) => (
          <div key={key} className="inner p-3.5">
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg border', tone)}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="font-display text-[0.875rem] font-semibold">{t[key]}</span>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {items.map((it) => (
                <li key={it} className="flex gap-2 text-[0.75rem] leading-snug text-ink/85">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-[0.75rem] font-medium">
        <KeyRound className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        {t.keeps}
      </p>
    </SpotlightCard>
  );
}

function RunCost() {
  const t = useT().strategy.how;
  const f = useFmt();
  const first = RUN_COST.values[0];
  const last = RUN_COST.values[RUN_COST.values.length - 1];
  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <CardHead title={t.runTitle} hint={t.runUnit} right={<SourceChip src="teamModel" />} />
      <div className="flex-1">
        <RunCostChart label={t.runLabel} format={(v) => f.sarM(v)} />
      </div>
      <p className="mt-2 text-[0.75rem] leading-relaxed text-muted">
        <Rich
          text={t.runNote}
          values={{ from: <Fig src="teamModel">{f.sarM(first)}</Fig>, to: <Fig src="teamModel">{f.sarM(last)}</Fig> }}
        />
      </p>
    </SpotlightCard>
  );
}

function Commitments() {
  const t = useT().strategy.how;
  const f = useFmt();
  const notes: { title: string; body: ReactNode; Icon: LucideIcon; tone: string }[] = [
    {
      title: t.noBranches,
      body: <Rich text={t.noBranchesBody} values={{ n: <Fig src="caseDeck">{f.int(WAFRA.branches)}</Fig> }} />,
      Icon: Ban,
      tone: 'text-gold',
    },
    { title: t.noLicence, body: t.noLicenceBody, Icon: ShieldCheck, tone: 'text-gold' },
    { title: t.wontDo, body: t.wontDoBody, Icon: XCircle, tone: 'text-brand' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {notes.map(({ title, body, Icon, tone }) => (
        <SpotlightCard key={title} className="h-full p-4">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', tone)} strokeWidth={1.5} aria-hidden />
            <h4 className="font-display text-[0.875rem] font-semibold">{title}</h4>
          </div>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-ink/80">{body}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}

export function HowToWinSection() {
  const t = useT().strategy.how;
  return (
    <section id="strategy-how" aria-label={t.eyebrow} className="scroll-mt-36">
      <SecHead eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <Stagger className="grid gap-4 lg:grid-cols-12">
        <Item className="lg:col-span-8">
          <Scorecard />
        </Item>
        <Item className="lg:col-span-4">
          <OperatingModel />
        </Item>
        <Item className="lg:col-span-7">
          <WhoDoesWhat />
        </Item>
        <Item className="lg:col-span-5">
          <RunCost />
        </Item>
        <Item className="lg:col-span-12">
          <Commitments />
        </Item>
      </Stagger>
    </section>
  );
}

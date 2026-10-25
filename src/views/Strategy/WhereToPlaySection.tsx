import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Headset,
  MapPin,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { CHANNELS, PRODUCT_WAVES, SEGMENTS, WAFRA } from '../../data/deck';
import { useLang, useT } from '../../i18n';
import { useApp } from '../../store';
import { useFmt } from '../../components/ui/useFmt';
import { Fig, Illus, SourceChip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Button } from '../../components/ui/Button';
import { useMedia } from '../../components/fx/hooks';
import { cn } from '../../lib/cn';
import { CardHead, chevronClip, EASE, Item, Rich, SecHead, Stagger } from './ui';

const PILLAR_ICONS: LucideIcon[] = [Smartphone, ShieldCheck, Headset];
const CHANNEL_ICONS: Record<(typeof CHANNELS)[number], LucideIcon> = {
  app: Smartphone,
  payroll: Briefcase,
  universities: GraduationCap,
  telco: RadioTower,
  smeCorporate: Building2,
  touchpoints: Store,
};

function Segments() {
  const t = useT().strategy.where;
  const f = useFmt();
  const cards = [
    {
      id: 'core' as const,
      tone: 'border-brand/40 bg-brand/15 text-brand',
      stat: <Rich text={t.approx} values={{ v: <Fig src="teamMarket">{f.mill(SEGMENTS.targetEmployed, 1)}</Fig> }} />,
      label: t.segments.core.stat,
      src: 'gastatLfs' as const,
    },
    {
      id: 'feeder' as const,
      tone: 'border-gold/40 bg-gold/15 text-gold',
      stat: <Fig src="gastatPop">{f.mill(SEGMENTS.feederAged2024)}</Fig>,
      label: t.segments.feeder.stat,
      src: 'gastatPop' as const,
    },
    {
      id: 'deepen' as const,
      tone: 'border-line/25 bg-line/[0.07] text-ink',
      stat: <Fig src="gastatLfs">{f.pct(SEGMENTS.womenUnemployment, 1)}</Fig>,
      label: <Rich text={t.segments.deepen.stat} values={{ men: <Fig src="gastatLfs">{f.pct(SEGMENTS.menUnemployment, 1)}</Fig> }} />,
      src: 'gastatLfs' as const,
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c, i) => (
        <SpotlightCard key={c.id} border={i === 0 ? 'gold' : 'none'} className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide', c.tone)}>
              {t.segments[c.id].tag}
            </span>
            <SourceChip src={c.src} />
          </div>
          <div className="mt-4 font-display text-[2rem] font-semibold leading-none tracking-tight">{c.stat}</div>
          <div className="mt-1.5 text-[0.75rem] leading-snug text-muted">{c.label}</div>
          <p className="mt-3 border-t border-line/10 pt-3 text-[0.8125rem] leading-relaxed text-ink/85">{t.segments[c.id].body}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}

function Pillars() {
  const t = useT().strategy.where;
  return (
    <SpotlightCard className="p-5">
      <CardHead title={t.pillarsTitle} right={<SourceChip src="report" />} />
      <div className="grid gap-3 md:grid-cols-3">
        {t.pillars.map((p, i) => {
          const Icon = PILLAR_ICONS[i];
          const human = i === 2;
          return (
            <div key={p.title} className={cn('inner p-4', human && 'border-gold/30 bg-gold/[0.05]')}>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-xl border',
                    human ? 'border-gold/40 bg-gold/15 text-gold' : 'border-brand/35 bg-brand/10 text-brand',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="num text-[0.75rem] font-semibold text-muted">0{i + 1}</span>
              </div>
              <p className="mt-3 font-display text-[0.9375rem] font-semibold leading-snug">{p.title}</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink/80">{p.body}</p>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

function CustomerPath() {
  const t = useT().strategy.where;
  const lang = useLang();
  const rtl = lang === 'ar';
  const wide = useMedia('(min-width: 768px)');
  const setArea = useApp((s) => s.setArea);
  return (
    <SpotlightCard border="gold" className="p-5">
      <CardHead
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {t.pathTitle}
            <Illus />
          </span>
        }
        right={
          <Button
            size="sm"
            variant="secondary"
            iconEnd={<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />}
            cursor="open"
            onClick={() => {
              setArea('app');
              window.scrollTo({ top: 0 });
            }}
          >
            {t.walkIt}
          </Button>
        }
      />
      <ol className="flex flex-col gap-2 md:flex-row md:gap-0">
        {t.path.map((label, i) => {
          const human = i === t.path.length - 1;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: rtl ? 14 : -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.45, ease: EASE }}
              className={cn('group relative md:flex-1', i > 0 && 'md:-ms-2')}
            >
              <div
                style={wide ? { clipPath: chevronClip(i === 0, rtl) } : undefined}
                className={cn(
                  'flex h-full min-h-[5.75rem] items-center gap-2.5 py-3 transition-colors duration-300',
                  wide ? (i === 0 ? 'pe-6 ps-4' : 'pe-6 ps-7') : 'rounded-inner px-4',
                  human
                    ? 'bg-gold/[0.16] group-hover:bg-gold/25'
                    : 'bg-line/[0.07] group-hover:bg-brand/[0.16]',
                )}
              >
                <span
                  className={cn(
                    'num inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold',
                    human ? 'bg-gold text-[#1a1408]' : 'bg-brand text-white',
                  )}
                >
                  {i + 1}
                </span>
                <span className={cn('text-[0.75rem] font-medium leading-snug', human && 'text-gold')}>{label}</span>
              </div>
            </motion.li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-start gap-2 text-[0.75rem] leading-relaxed text-muted">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        <span>{t.pathCaption}</span>
      </p>
    </SpotlightCard>
  );
}

function Waves() {
  const t = useT().strategy.where;
  const lang = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <SpotlightCard className="h-full p-5">
      <CardHead title={t.wavesTitle} right={<SourceChip src="report" />} />
      <div ref={ref} dir="ltr" className="relative">
        <div className="absolute inset-x-[12.5%] top-[2.05rem] hidden h-px bg-line/10 sm:block" aria-hidden />
        <motion.div
          aria-hidden
          className="absolute start-[12.5%] top-[2.05rem] hidden h-px origin-left bg-gradient-to-r from-brand to-gold sm:block"
          initial={{ width: 0 }}
          animate={inView ? { width: '75%' } : undefined}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3">
          {PRODUCT_WAVES.map((w, i) => (
            <motion.li
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.45, ease: EASE }}
              className="relative flex flex-col items-center text-center"
            >
              <span className="num text-[0.75rem] font-semibold text-gold">{w.fy}</span>
              <span className="relative z-10 mt-2 h-3 w-3 rounded-full border-2 border-gold bg-bg" aria-hidden />
              <p dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mt-3 text-[0.75rem] leading-snug text-ink/85">
                {t.waves[w.id]}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </SpotlightCard>
  );
}

function Channels() {
  const t = useT().strategy.where;
  const f = useFmt();
  return (
    <SpotlightCard className="h-full p-5">
      <CardHead title={t.channelsTitle} right={<SourceChip src="report" />} />
      <ul className="grid grid-cols-2 gap-2">
        {CHANNELS.map((id) => {
          const Icon = CHANNEL_ICONS[id];
          return (
            <li key={id} className="inner flex items-center gap-2 px-3 py-2.5">
              <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
              <span className="text-[0.75rem] font-medium leading-snug">{t.channels[id]}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[0.75rem] leading-relaxed text-muted">
        <Rich text={t.channelsNote} values={{ n: <Fig src="caseDeck">{f.int(WAFRA.branches)}</Fig> }} />
      </p>
    </SpotlightCard>
  );
}

export function WhereToPlaySection() {
  const t = useT().strategy.where;
  return (
    <section id="strategy-where" aria-label={t.eyebrow} className="scroll-mt-36">
      <SecHead eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <Stagger className="grid gap-4 lg:grid-cols-12">
        <Item className="lg:col-span-12">
          <h3 className="sr-only">{t.segmentsTitle}</h3>
          <Segments />
        </Item>
        <Item className="lg:col-span-12">
          <Pillars />
        </Item>
        <Item className="lg:col-span-12">
          <CustomerPath />
        </Item>
        <Item className="lg:col-span-7">
          <Waves />
        </Item>
        <Item className="lg:col-span-5">
          <Channels />
        </Item>
      </Stagger>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Angry,
  CheckCheck,
  ChevronDown,
  Circle,
  CircleAlert,
  Frown,
  Headset,
  Meh,
  Send,
  Siren,
  Smile,
  SmilePlus,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useApp, type Priority, type Sentiment, type Ticket } from '../../store';
import { PERSONAS } from '../../config/illustrative';
import { useMsg, useT, useTpl } from '../../i18n';
import { m } from '../../lib/msg';
import { cn } from '../../lib/cn';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Avatar, SectionHeader } from '../../components/ui/Controls';
import { Button } from '../../components/ui/Button';
import { Illus } from '../../components/ui/Provenance';
import { EASE, fmtElapsed } from './shared';

/** Illustrative SLA targets by priority (minutes). */
const SLA_MIN: Record<Priority, number> = { High: 10, Medium: 60, Low: 240 };

const PRIORITY_STYLE: Record<Priority, { cls: string; Icon: typeof Siren }> = {
  High: { cls: 'border-stop/45 bg-stop/10 text-stop', Icon: Siren },
  Medium: { cls: 'border-watch/45 bg-watch/10 text-watch', Icon: CircleAlert },
  Low: { cls: 'border-line/20 bg-line/5 text-muted', Icon: Circle },
};

const SENTIMENT_ICON: Record<Sentiment, typeof Smile> = {
  calm: Smile,
  positive: SmilePlus,
  concerned: Meh,
  anxious: Frown,
  frustrated: Angry,
};

function PriorityPill({ p }: { p: Priority }) {
  const t = useT();
  const { cls, Icon } = PRIORITY_STYLE[p];
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold', cls)}>
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
      {t.common.priority[p]}
    </span>
  );
}

function SlaRing({ ticket, now }: { ticket: Ticket; now: number }) {
  const t = useT();
  const tp = useTpl();
  const end = ticket.repliedAt ?? now;
  const elapsed = end - ticket.createdAt;
  const ratio = Math.min(1, elapsed / (SLA_MIN[ticket.priority] * 60000));
  const tone = ticket.status !== 'open' ? 'rgb(var(--muted))' : ratio < 0.5 ? 'rgb(var(--pass))' : ratio < 1 ? 'rgb(var(--watch))' : 'rgb(var(--stop))';
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <span className="flex shrink-0 items-center gap-1.5" title={t.cockpit.queue.slaNote}>
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="-rotate-90">
        <circle cx="10" cy="10" r={r} fill="none" stroke="rgb(var(--line) / 0.12)" strokeWidth="2.5" />
        <circle cx="10" cy="10" r={r} fill="none" stroke={tone} strokeWidth="2.5" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} strokeLinecap="round" />
      </svg>
      <span className="num text-xs text-muted" aria-label={tp(t.cockpit.queue.waiting, { t: fmtElapsed(elapsed) })} dir="ltr">
        {fmtElapsed(elapsed)}
      </span>
    </span>
  );
}

function StatusPill({ status }: { status: Ticket['status'] }) {
  const t = useT();
  const q = t.cockpit.queue;
  if (status === 'open') return <span className="chip shrink-0 text-ink/80">{q.statusOpen}</span>;
  if (status === 'replied')
    return (
      <span className="chip shrink-0 border-gold/40 bg-gold/10 text-gold">
        <Headset className="h-3 w-3" strokeWidth={1.75} aria-hidden />
        {q.statusReplied}
      </span>
    );
  return (
    <span className="chip shrink-0 text-muted">
      <CheckCheck className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      {q.statusResolved}
    </span>
  );
}

function TicketRow({
  ticket,
  now,
  expanded,
  onToggle,
  draft,
  setDraft,
}: {
  ticket: Ticket;
  now: number;
  expanded: boolean;
  onToggle: () => void;
  draft: string | undefined;
  setDraft: (v: string | undefined) => void;
}) {
  const t = useT();
  const q = t.cockpit.queue;
  const render = useMsg();
  const replyTicket = useApp((s) => s.replyTicket);
  const resolveTicket = useApp((s) => s.resolveTicket);
  const toast = useApp((s) => s.toast);
  const persona = ticket.personaId ? PERSONAS[ticket.personaId] : null;
  const isNew = !!ticket.fresh && ticket.status === 'open';
  const SentIcon = SENTIMENT_ICON[ticket.sentiment];
  const composing = draft !== undefined && ticket.status === 'open';

  const send = () => {
    const text = (draft ?? '').trim();
    if (!text) return;
    replyTicket(ticket.id, text);
    toast(m('common.toasts.replied'), 'success');
    setDraft(undefined);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: ticket.status === 'resolved' ? 0.6 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        'relative overflow-hidden rounded-inner border transition-colors',
        isNew ? 'border-gold/50 bg-gold/[0.06] shadow-goldglow' : 'border-line/10 bg-line/[0.03]',
      )}
    >
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-2.5 p-3 text-start" data-cursor="open">
        <PriorityPill p={ticket.priority} />
        {persona ? (
          <Avatar initials={persona.initials} gradient={persona.gradient} size={28} />
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line/10 text-muted">
            <UserRound className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{render(ticket.customer)}</span>
            {isNew && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-1.5 py-px text-[0.625rem] font-bold uppercase tracking-wide text-[#1a1408]">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1a1408] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1a1408]" />
                </span>
                {q.newBadge}
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-muted">
            {t.common.intents[ticket.intent]} · <span dir="ltr">{ticket.id}</span> · {persona ? q.fromApp : q.synthetic}
          </span>
        </span>
        <SlaRing ticket={ticket} now={now} />
        <span className="hidden sm:inline-flex">
          <StatusPill status={ticket.status} />
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform', expanded && 'rotate-180')} strokeWidth={1.5} aria-hidden />
        <span className="sr-only">{expanded ? q.collapse : q.expand}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 px-3 pb-3">
              <div className="rounded-xl border border-ai/30 bg-ai/[0.08] p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-ai-glow">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  {q.aiSummary}
                </div>
                <ul className="space-y-1">
                  {ticket.summary.map((b, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.06, duration: 0.3 }}
                      className="flex gap-2 text-[0.8125rem] leading-snug text-ink/90"
                    >
                      <span aria-hidden className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-ai-glow" />
                      <span>{render(b)}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
                <div className="inner flex items-center gap-2 px-3 py-2">
                  <SentIcon className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden />
                  <div>
                    <div className="text-[0.625rem] uppercase tracking-wider text-muted">{q.sentiment}</div>
                    <div className="text-xs font-medium">{t.common.sentiment[ticket.sentiment]}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-inner border border-ai/25 bg-ai/[0.05] px-3 py-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-glow" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0">
                    <div className="text-[0.625rem] uppercase tracking-wider text-ai-glow">{q.aiSuggests}</div>
                    <div className="text-xs leading-snug">{render(ticket.nextAction)}</div>
                  </div>
                </div>
              </div>

              {ticket.status === 'replied' && ticket.reply && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-gold/35 bg-gold/[0.07] p-3"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-gold">
                    <Headset className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    {q.specialist}
                  </div>
                  <p className="text-[0.8125rem] leading-snug">{ticket.reply}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[0.6875rem] text-muted">
                    <CheckCheck className="h-3 w-3 text-pass" strokeWidth={2} aria-hidden />
                    {q.sentNote}
                  </div>
                </motion.div>
              )}

              {composing && (
                <div className="space-y-2">
                  <label className="block text-[0.6875rem] font-medium uppercase tracking-wider text-gold" htmlFor={`reply-${ticket.id}`}>
                    {q.replyLabel}
                  </label>
                  <textarea
                    id={`reply-${ticket.id}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gold/35 bg-bg/60 p-3 text-[0.8125rem] leading-snug text-ink outline-none focus:border-gold"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="gold" size="sm" icon={<Send className="h-3.5 w-3.5 rtl:-scale-x-100" strokeWidth={1.75} />} onClick={send}>
                      {q.send}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDraft(undefined)}>
                      {q.cancel}
                    </Button>
                  </div>
                </div>
              )}

              {!composing && ticket.status !== 'resolved' && (
                <div className="flex flex-wrap gap-2">
                  {ticket.status === 'open' && (
                    <Button
                      variant="gold"
                      size="sm"
                      icon={<Headset className="h-3.5 w-3.5" strokeWidth={1.75} />}
                      onClick={() => setDraft(render(ticket.suggestedReply))}
                    >
                      {q.reply}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" icon={<CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} />} onClick={() => resolveTicket(ticket.id)}>
                    {q.resolve}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/** g. Human-in-the-loop queue: live tickets from the customer app. */
export function HitlQueue() {
  const t = useT();
  const tp = useTpl();
  const q = t.cockpit.queue;
  const tickets = useApp((s) => s.tickets);
  const markTicketsSeen = useApp((s) => s.markTicketsSeen);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    markTicketsSeen();
  }, [markTicketsSeen, tickets.length]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Newest first; resolved tickets sink to the bottom. A replied ticket keeps its place so the reply stays in view.
  const sorted = useMemo(() => {
    const rank = (x: Ticket) => (x.status === 'resolved' ? 1 : 0);
    return [...tickets].sort((a, b) => rank(a) - rank(b) || b.createdAt - a.createdAt);
  }, [tickets]);

  const freshId = sorted.find((x) => x.fresh && x.status === 'open')?.id ?? null;
  const [expanded, setExpanded] = useState<string | null>(() => freshId ?? sorted.find((x) => x.status === 'open')?.id ?? null);
  const lastAuto = useRef<string | null>(freshId);
  useEffect(() => {
    if (freshId && freshId !== lastAuto.current) {
      lastAuto.current = freshId;
      setExpanded(freshId);
    }
  }, [freshId]);

  const [drafts, setDrafts] = useState<Record<string, string | undefined>>({});
  const openCount = tickets.filter((x) => x.status === 'open').length;

  return (
    <SpotlightCard border="gold" className="flex h-full flex-col p-5">
      <SectionHeader
        eyebrow={q.eyebrow}
        title={q.title}
        subtitle={q.subtitle}
        right={
          <span className="chip border-gold/40 bg-gold/10 text-gold">
            <Headset className="h-3 w-3" strokeWidth={1.75} aria-hidden />
            {tp(q.open, { n: openCount })}
          </span>
        }
      />
      <div className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-muted">
        <Illus note={q.slaNote} />
        <span className="truncate">{q.slaNote}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{q.empty}</p>
      ) : (
        <ul className="mt-3 max-h-[27rem] flex-1 space-y-2 overflow-y-auto pe-1">
          <AnimatePresence initial={false}>
            {sorted.map((tk) => (
              <TicketRow
                key={tk.id}
                ticket={tk}
                now={now}
                expanded={expanded === tk.id}
                onToggle={() => setExpanded((e) => (e === tk.id ? null : tk.id))}
                draft={drafts[tk.id]}
                setDraft={(v) => setDrafts((d) => ({ ...d, [tk.id]: v }))}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </SpotlightCard>
  );
}

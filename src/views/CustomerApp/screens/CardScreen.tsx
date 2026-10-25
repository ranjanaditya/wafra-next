import { motion } from 'framer-motion';
import { AlertTriangle, Coffee, Fuel, Lock, LockOpen, ShieldAlert, ShoppingBag } from 'lucide-react';
import { useApp, useJourney } from '../../../store';
import { useT } from '../../../i18n';
import { PERSONAS, TRANSACTIONS } from '../../../config/illustrative';
import { setCardFrozen } from '../../../logic/journey';
import { reportUnrecognised } from '../../../logic/assistant';
import { useFmt } from '../../../components/ui/useFmt';
import { cn } from '../../../lib/cn';
import { DebitCard, PButton, PCard } from '../ui';

const MERCHANT_ICON = { qahwa: Coffee, souq: ShoppingBag, unknown: AlertTriangle, fuel: Fuel } as const;

export function CardScreen() {
  const t = useT();
  const f = useFmt();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const tickets = useApp((s) => s.tickets);
  const escalated = tickets.some((x) => x.personaId === pid && x.intent === 'fraud');
  return (
    <div className="space-y-3">
      <div className="pt-1 text-[18px] font-semibold">{t.app.card.title}</div>
      <DebitCard persona={PERSONAS[pid]} frozen={j.cardFrozen} />
      <PButton
        full
        variant={j.cardFrozen ? 'outline' : 'secondary'}
        data-cursor="freeze"
        icon={j.cardFrozen ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        onClick={() => setCardFrozen(pid, !j.cardFrozen)}
      >
        {j.cardFrozen ? t.app.card.unfreeze : t.app.card.freeze}
      </PButton>
      {escalated && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <PCard tone="gold">
            <div className="flex items-start gap-2 text-[12px] leading-snug">
              <ShieldAlert className="mt-[1px] h-4 w-4 shrink-0 text-gold" />
              {t.app.card.frozenSub}
            </div>
          </PCard>
        </motion.div>
      )}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t.app.card.recent}</div>
        <div className="space-y-1.5">
          {TRANSACTIONS.map((tx, i) => {
            const Icon = MERCHANT_ICON[tx.merchant];
            return (
              <div key={tx.id} className={cn('rounded-[14px] border p-2.5', tx.flagged ? 'border-stop/40 bg-stop/[0.07]' : 'border-line/10 bg-line/[0.03]')}>
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', tx.flagged ? 'bg-stop/15 text-stop' : 'bg-line/10 text-ink/80')}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold" dir={tx.merchant === 'unknown' ? 'ltr' : undefined}>
                      {t.app.card.merchants[tx.merchant]}
                    </div>
                    <div className="text-[10.5px] text-muted">{i < 2 ? t.app.card.today : t.app.card.yesterday}</div>
                  </div>
                  <span className="num text-[12.5px] font-semibold">{f.sar(tx.amount)}</span>
                </div>
                {tx.flagged && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[10.5px] font-semibold text-stop">
                      <AlertTriangle className="h-3 w-3" />
                      {t.app.card.flagged}
                    </span>
                    <button
                      type="button"
                      data-cursor="freeze"
                      disabled={escalated}
                      onClick={() => reportUnrecognised(pid)}
                      className="rounded-full bg-stop px-2.5 py-1 text-[11px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                    >
                      {t.app.card.notMe}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

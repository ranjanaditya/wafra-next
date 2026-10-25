import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Headset, MapPin, MessageCircle, PhoneCall, X } from 'lucide-react';
import { useApp } from '../../store';
import { useT, useTpl } from '../../i18n';
import { PERSONAS, SERVICE_HUBS } from '../../config/illustrative';
import { ask, bookCallback, greet } from '../../logic/assistant';
import { CheckMorph } from './ui';

type View = 'menu' | 'callback' | 'service' | 'booked';

/** Human help: chat with a specialist · request a call-back · find a service point. */
export function HelpSheet() {
  const t = useT();
  const tpl = useTpl();
  const open = useApp((s) => s.helpOpen);
  const setOpen = useApp((s) => s.setHelpOpen);
  const pid = useApp((s) => s.personaId);
  const setTab = useApp((s) => s.setPhoneTab);
  const [view, setView] = useState<View>('menu');
  const [slot, setSlot] = useState<'today' | 'tomorrow'>('today');

  useEffect(() => {
    if (open) setView('menu');
  }, [open]);

  const city = pid ? PERSONAS[pid].city : 'riyadh';
  const hubs = SERVICE_HUBS[city];

  const options = [
    {
      id: 'chat',
      Icon: MessageCircle,
      title: t.app.help.chat,
      sub: t.app.help.chatSub,
      onClick: () => {
        setOpen(false);
        if (pid) {
          setTab('assistant');
          greet(pid);
          ask(pid, '', 'human');
        }
      },
    },
    { id: 'callback', Icon: PhoneCall, title: t.app.help.callback, sub: t.app.help.callbackSub, onClick: () => setView('callback') },
    { id: 'service', Icon: MapPin, title: t.app.help.service, sub: t.app.help.serviceSub, onClick: () => setView('service') },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-label={t.app.help.title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[28px] border-t border-gold/30 bg-elev px-[18px] pb-9 pt-3"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line/25" />
            <div className="mb-3 flex items-center gap-2">
              {view !== 'menu' && (
                <button type="button" onClick={() => setView('menu')} aria-label={t.app.help.back} className="rounded-full p-1 text-muted hover:bg-line/10">
                  <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                </button>
              )}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-[#1a1408]">
                <Headset className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold leading-tight">{t.app.help.title}</div>
                <div className="text-[11px] text-muted">{t.app.help.sub}</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.common.close} className="rounded-full p-1.5 text-muted hover:bg-line/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            {view === 'menu' && (
              <div className="space-y-2">
                {options.map((o, i) => (
                  <motion.button
                    key={o.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={o.onClick}
                    className="flex w-full items-center gap-3 rounded-[16px] border border-line/10 bg-line/[0.04] p-3 text-start hover:border-gold/40"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                      <o.Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold">{o.title}</div>
                      <div className="text-[11.5px] leading-snug text-muted">{o.sub}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted rtl:-scale-x-100" />
                  </motion.button>
                ))}
              </div>
            )}

            {view === 'callback' && (
              <div className="space-y-2">
                {(['today', 'tomorrow'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`flex w-full items-center gap-2 rounded-[14px] border p-3 text-start text-[13px] ${slot === s ? 'border-gold/60 bg-gold/10' : 'border-line/10 bg-line/[0.04]'}`}
                  >
                    <Clock className="h-4 w-4 text-gold" />
                    <span className="first-letter:uppercase">{t.app.help.slots[s]}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (pid) bookCallback(pid, slot);
                    setView('booked');
                  }}
                  className="mt-1 h-[42px] w-full rounded-full bg-gold text-[13.5px] font-semibold text-[#1a1408]"
                >
                  {t.app.help.callback}
                </button>
              </div>
            )}

            {view === 'booked' && (
              <div className="flex flex-col items-center py-3 text-center">
                <CheckMorph size={46} color="rgb(var(--gold))" />
                <div className="mt-2 text-[13.5px] font-semibold">{tpl(t.app.help.booked, { slot: { key: `app.help.slots.${slot}` } })}</div>
              </div>
            )}

            {view === 'service' && (
              <div className="space-y-2">
                {hubs.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-[14px] border border-line/10 bg-line/[0.04] p-3">
                    <MapPin className="h-4 w-4 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold leading-snug">{t.app.help.hubs[h.id as keyof typeof t.app.help.hubs]}</div>
                      <div className="text-[11px] text-muted">{t.app.help.openUntil}</div>
                    </div>
                    <span className="num text-[12px] font-semibold">{tpl(t.app.help.km, { km: h.km })}</span>
                  </div>
                ))}
                <p className="pt-1 text-[11px] leading-snug text-muted">{t.app.help.serviceSub}</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

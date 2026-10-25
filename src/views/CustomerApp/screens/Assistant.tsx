import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Headset, SendHorizontal, Sparkles, Ticket } from 'lucide-react';
import { useApp, type ChatMessage, type IntentId } from '../../../store';
import { useMsg, useT } from '../../../i18n';
import { ask, chipsFor, greet } from '../../../logic/assistant';
import { cn } from '../../../lib/cn';

function Streamed({ text, streaming }: { text: string; streaming?: boolean }) {
  const [n, setN] = useState(streaming ? 0 : text.length);
  useEffect(() => {
    if (!streaming) {
      setN(text.length);
      return;
    }
    setN(0);
    const words = text.split(/(\s+)/);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(words.slice(0, i).join('').length);
      if (i >= words.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [text, streaming]);
  return (
    <>
      {text.slice(0, n)}
      {streaming && n < text.length && <span className="ms-0.5 inline-block h-3 w-[2px] animate-pulse bg-ai-glow align-middle" />}
    </>
  );
}

function Bubble({ c }: { c: ChatMessage }) {
  const t = useT();
  const render = useMsg();
  if (c.from === 'system') {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-line/[0.05] px-2.5 py-1 text-[10.5px] text-muted">
          <Ticket className="h-3 w-3" />
          {render(c.msg)}
        </span>
      </div>
    );
  }
  const isUser = c.from === 'user';
  const isHuman = c.from === 'human';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[86%]')}>
        {!isUser && (
          <div className={cn('mb-1 flex items-center gap-1 text-[10px] font-semibold', isHuman ? 'text-gold' : 'text-ai-glow')}>
            {isHuman ? <Headset className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
            {isHuman ? t.app.assistant.humanBadge : t.app.assistant.aiBadge}
          </div>
        )}
        <div
          className={cn(
            'rounded-[18px] px-3 py-2 text-[12.5px] leading-[1.5]',
            isUser && 'rounded-ee-[6px] bg-brand text-white',
            c.from === 'ai' && 'rounded-es-[6px] border border-ai/25 bg-ai/[0.08]',
            isHuman && 'rounded-es-[6px] border border-gold/45 bg-gold/[0.10]',
            c.handoff && 'border-gold/40 bg-gold/[0.08]',
          )}
        >
          {c.typing ? (
            <span className="flex items-center gap-2 py-1" aria-label={t.app.assistant.typing}>
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inset-0 animate-pulseRing rounded-full border border-ai" />
                <span className="h-1.5 w-1.5 rounded-full bg-ai-glow" />
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-blink rounded-full bg-ai-glow" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </span>
          ) : (
            <Streamed text={render(c.msg)} streaming={c.streaming} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Assistant() {
  const t = useT();
  const pid = useApp((s) => s.personaId)!;
  const chats = useApp((s) => s.chats[pid]);
  const [text, setText] = useState('');
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    greet(pid);
  }, [pid]);

  useEffect(() => {
    const el = list.current?.closest('.overflow-y-auto') as HTMLElement | null;
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chats]);

  const chips = useMemo(() => {
    const last = [...chats].reverse().find((c) => c.from === 'ai' && c.chips);
    return (last?.chips ?? chipsFor(pid)) as IntentId[];
  }, [chats, pid]);

  const send = () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    ask(pid, v);
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ai/20 text-ai-glow">
          <span className="absolute inset-0 animate-pulseRing rounded-full border border-ai/50" />
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{t.app.assistant.title}</div>
          <div className="text-[11px] text-muted">{t.app.assistant.sub}</div>
        </div>
      </div>
      <div ref={list} className="flex-1 space-y-2.5 pb-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {chats.map((c) => (
            <Bubble key={c.id} c={c} />
          ))}
        </AnimatePresence>
      </div>
      <div className="sticky bottom-0 -mx-[16px] bg-gradient-to-t from-bg via-bg to-transparent px-[16px] pb-1 pt-3">
        <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ask(pid, '', c)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
                c === 'human' ? 'border-gold/45 text-gold hover:bg-gold/10' : c === 'fraud' ? 'border-stop/40 text-stop hover:bg-stop/10' : 'border-ai/35 text-ai-glow hover:bg-ai/10',
              )}
            >
              {t.app.assistant.chips[c as keyof typeof t.app.assistant.chips] ?? c}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 rounded-full border border-line/15 bg-line/[0.05] py-1 pe-1 ps-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.app.assistant.placeholder}
            aria-label={t.app.assistant.placeholder}
            className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted"
          />
          <button type="submit" aria-label={t.app.assistant.send} className="flex h-8 w-8 items-center justify-center rounded-full bg-ai text-white transition-[filter] hover:brightness-110">
            <SendHorizontal className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </form>
        <p className="mt-1 text-center text-[9.5px] text-muted">{t.app.assistant.scripted}</p>
      </div>
    </div>
  );
}

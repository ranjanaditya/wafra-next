import { useCallback } from 'react';
import { en } from './en';
import { ar } from './ar';
import { useApp } from '../store';
import { mill, monthYear, pct, sar, sarM, type Lang } from '../lib/format';
import type { Msg, ParamValue, Params } from '../lib/msg';

export type Dict = typeof en;
export const DICTS: Record<Lang, Dict> = { en, ar };

export function useT(): Dict {
  const lang = useApp((s) => s.lang);
  return DICTS[lang];
}

export function useLang(): Lang {
  return useApp((s) => s.lang);
}

/** Look up a dotted key such as "app.log.salaryCredited". */
export function lookup(dict: unknown, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

function formatParam(v: ParamValue, lang: Lang): string {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  if ('sar' in v) return sar(v.sar, lang, v.dp ?? 0);
  if ('sarM' in v) return sarM(v.sarM, lang);
  if ('pct' in v) return pct(v.pct, v.dp ?? 0, lang);
  if ('m' in v) return mill(v.m, lang, v.dp ?? 2);
  if ('ym' in v) return monthYear(v.ym.y, v.ym.m0, lang);
  if ('key' in v) return renderMsg({ key: v.key, params: v.params }, lang);
  return '';
}

/** Replace {name} placeholders. */
export function tpl(s: string, params: Params | undefined, lang: Lang): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? formatParam(params[k], lang) : `{${k}}`));
}

export function renderMsg(msg: Msg, lang: Lang): string {
  if (msg.text !== undefined) return msg.text;
  if (!msg.key) return '';
  const s = lookup(DICTS[lang], msg.key) ?? lookup(DICTS.en, msg.key);
  if (s === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${msg.key}`);
    return msg.key;
  }
  return tpl(s, msg.params, lang);
}

/** Hook: render language-neutral messages in the current language. */
export function useMsg() {
  const lang = useLang();
  return useCallback((msg: Msg) => renderMsg(msg, lang), [lang]);
}

/** Hook: template a dictionary string with params in the current language. */
export function useTpl() {
  const lang = useLang();
  return useCallback((s: string, params?: Params) => tpl(s, params, lang), [lang]);
}

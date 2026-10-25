/**
 * Language-neutral messages. Logs, chat, tickets and reason codes store a
 * dictionary key plus params, so switching language re-renders history.
 */
export type ParamValue =
  | string
  | number
  | { sar: number; dp?: number }
  | { sarM: number }
  | { pct: number; dp?: number }
  | { m: number; dp?: number }
  | { ym: { y: number; m0: number } }
  | { key: string; params?: Params };

export type Params = Record<string, ParamValue>;

export interface Msg {
  key?: string;
  params?: Params;
  /** Free text (user input, edited specialist replies). Shown as typed. */
  text?: string;
}

export const m = (key: string, params?: Params): Msg => ({ key, params });
export const raw = (text: string): Msg => ({ text });

let n = 0;
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}_${(n++).toString(36)}`;

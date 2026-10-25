export type ClassValue = string | false | null | undefined | 0;
export const cn = (...c: ClassValue[]) => c.filter(Boolean).join(' ');

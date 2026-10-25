import type { en } from './en';
import { common } from './ar/common';
import { app } from './ar/app';
import { cockpit } from './ar/cockpit';
import { story } from './ar/story';
import { strategy } from './ar/strategy';

export const ar: typeof en = { common, app, cockpit, story, strategy };

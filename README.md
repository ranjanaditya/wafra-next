# Wafra Next: interactive prototype

A stage-gated digital youth bank inside Wafra, built for a 90-second live demo and the Q&A that follows. All personas, employers and transactions are synthetic. A "Prototype · synthetic data" badge appears on every view.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # credit-engine and stage-gate tests (persona expected outputs)
npm run build      # type-check + production build into dist/ (relative paths, any static host)
```

Requires Node 18 or later.

## Areas

| Key | Area | What it shows |
| --- | --- | --- |
| 1 | Story | Hero with the particle "W", six KPI cards, five chapters: Problem → Insight → Recommendation → Economics → The ask |
| 2 | Customer app | Phone following the deck's customer path, journey timeline (month 0 to 18), life events, "Behind the glass" engine log, "Try your own numbers" |
| 3 | Bank cockpit | KPI strip, escalation queue, decision log, stage-gate simulator, scenarios and J-curve, unit economics, sensitivity lab, risk register, customer path |
| 4 | Strategy | Market funnel, opportunity pools, positioning map, where to play, how to win, roadmap and the ask |

State is shared: a credit decision or escalation made in the customer app appears in the cockpit, and a specialist's reply in the cockpit lands in the customer's chat.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| 1 to 4 | Switch areas |
| L | English / Arabic (RTL) |
| T | Dark / light theme |
| R | Reset the demo (clears all state) |
| ? | Shortcut sheet |
| Esc | Close panels |

The monitor icon in the top bar toggles presenter mode (larger type, fewer particles, higher contrast) for screen-sharing.

## 90-second demo script

Reset first with `R`. Times are approximate.

1. **Story (5 s).** Open on the headline: "Salary in. First financing out. A human when it matters."
2. **Account in minutes (12 s).** Press `2`, pick **Noura**, tap *Verify with Nafath eKYC (simulated)*. The number match and liveness steps advance on their own; tap *Open my account*, then *Move my salary*.
3. **First salary (10 s).** Click the **First salary** life event. Continue through employer and IBAN; the salary lands and the AI autopilot suggests the split. Drag a donut handle, then *Apply autopilot*.
4. **Seasoning (10 s).** Drag the timeline from month 1 to 5. The ring fills, the provisional score builds, and no offer appears.
5. **First financing (12 s).** Drag to month 6: SAR 8,500, income-linked. Open *Why this limit*.
6. **Credit expands (8 s).** Drag to month 12: the limit grows to SAR 25,500, and the credit card and goal-based investing tiles unlock.
7. **Human help (8 s).** Pick **Abdullah**, click the *First financing* chevron (month 6), open *Ask Wafra* and tap *Can I borrow SAR 20,000?*. The AI explains why and hands off.
8. **Cockpit (8 s).** Press `3`. The ticket is at the top with its AI summary. Click *Reply*, then *Send to customer*.
9. **Stage gates (12 s).** In the gate simulator set 30-day activation to 50% and CAC to SAR 380. Gate 1 stops and exposure is capped at SAR 61m.
10. **Close (5 s).** Press `1` and land on the headline and the ask.

## Where things live

```
src/data/deck.ts              DECK DATA (exact figures, source ids)
src/config/illustrative.ts    Illustrative settings: sub-brand name, policy, personas, pricing, gate defaults
src/logic/creditEngine.ts     Transparent scorecard (staged: seasoning → first financing → expanded)
src/logic/gates.ts            Stage gates and the stop rule
src/logic/assistant.ts        "Ask Wafra" intent engine, escalations, optional LLM
src/logic/journey.ts          Customer-journey actions and the engine-room log
src/store.ts                  Shared state (Zustand)
src/i18n/en/*, src/i18n/ar/*  Every string, English and Arabic
src/components/fx/            Cursor, Magnetic, Spotlight, Tilt, Particles, Aurora
src/views/                    Story, CustomerApp, Cockpit, Strategy
```

- **Renaming the sub-brand:** edit `BRAND` in `src/config/illustrative.ts`.
- **Number fidelity:** every business figure comes from `deck.ts` and shows its source on hover. Illustrative values carry an "Illustrative" tag. P&L tables say "Lines may not add due to rounding".
- **Credit engine:** labelled "Illustrative scorecard, not a production credit model". Gender, nationality, marital status and age are never scoring inputs.

## Optional LLM for "Ask Wafra"

By default the assistant uses scripted, persona-aware answers, so the demo cannot fail. To route low-stakes free text to your own endpoint, set:

```bash
VITE_ASK_WAFRA_ENDPOINT=https://your-proxy.example.com/ask
```

The app POSTs `{ system, messages, context }` and expects `{ reply }`. After 3 seconds, or on any error, it falls back to the script. Fraud, complaint, hardship, "talk to a person" and over-limit requests always use the scripted path and escalate to a human.

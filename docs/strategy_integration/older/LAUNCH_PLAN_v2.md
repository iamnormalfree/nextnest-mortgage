I read your full context and looked at nextnest.sg. Your homepage currently claims “AI-powered… real-time analysis of 286 packages… updated every 15 minutes from 23 banks.” Great aspiration, but those claims create compliance and credibility surface-area unless you can actually back them right now. We’ll tune the product and copy so you’re fast, safe, and persuasive. 
nextnest.sg

Below is a no-fluff plan to (1) lock positioning, (2) ship an MVP you can use in calls this week, (3) ingest rates without angering banks, (4) win deals as a solo human broker using AI as the invisible pit crew, and (5) hit your $10–15k/mo target.

0) Positioning (decide once)

Tagline: Mortgage clarity before the coffee cools.

One-liner (site + DM):
AI-assisted, human-first mortgage studio. Real options explained in your numbers. A broker who shows up when it matters.

What you are (say this explicitly):
“AI-assisted, human-first brokerage. The AI handles math, paperwork prep, and change-tracking. Advice and bank engagement are human-only. We do not publish private deviated rates.”

What you’re not: a chatbot or rate-scraper. Your 5 “AI brokers” are ops personas that help you work 4× faster (drafts, deltas, PDFs), not faces the client chats with. Front-of-house remains your voice.

Public-copy fix: Drop unverifiable claims like “23 banks, 15-minute updates” until true; change to “continuously reconciled offers from local banks, refreshed with a human check and full audit receipts.” Update the home hero to reflect precision + trust rather than “real-time market AI”. 
nextnest.sg

1) Revenue math (so you know the hill)

Referral fee: 0.15% of loan quantum to your brokerage.

To make $10k/mo, you need ≈ $6.7M of monthly settled loans; $15k/mo ≈ $10M.

That’s ~5–10 refi deals at $1–2M each, or 10–20 at $500–$900k.

Target 12–15% close on self-sourced leads; if top agents hit 12.5–13%, mirror that with better ops + speed.

2) The tiny loop (your whole business in 4 steps)

Fast intake (no email required) → 5 inputs → auto TDSR/LTV/MSR → top 3 masked options + “why”.

One-page PDF (masked banks) with math, risks, penalties, and “refresh valid 5 days.”

Calendar link → 15-min call → you confirm facts, pick bank, request docs.

Bank-ready pack generated → email banker with client CC (trail), dashboard shows timeline.

This is the loop. Everything below exists only to make this loop instant, clean, and hard to copy.

3) MVP you can use in 7 days (Claude/Codex-built)

Pages

/ hero + two CTAs (Start in 60s, Sample report).

/apply progressive form (property, loan amt, tenure, income basics, property type, current bank?).

/report/[hash] read-only snapshot for the client.

/ops (auth) to paste banker WhatsApp → produce normalized offers (human-approve).

Data (Postgres/Supabase)

offers{ bank_code, type, tenor, pricing_basis, headline_rate, spread, lock_in_m, min_loan, fees_json, features_json, updated_by, updated_at, source_msg_id }

scenarios{ id, inputs_json, results_json, ruleset_version, created_at }

audit{ scenario_id, actor, action, meta, at }

consent{ scenario_id, purposes, expires_at }

Rulesets (versioned JSON + tests)

MAS LTV/TDSR/MSR + common edge-cases (HDB vs private, 1st/2nd loan, age, income types).

Penalty logic, clawbacks, subsidy reimbursement windows.

Output

One-pager PDF (React-PDF):

Header: client initials + scenario timestamp + “valid 5 days.”

3 ranked options (masked bank name: Bank ∆, Bank Ω, Bank Σ).

Why this order: payment, lock-in, cash/CPF flow, penalties, subsidy math, 36-mo cost timeline, ±50 bps sensitivity.

Next steps + checklist + consent ID + ruleset version + offer freshness stamps.

Guardrails

UI never shows bank logos/real deviated rates.

Every claim in PDF links to an audit receipt (internal, not printed).

“We’ll reveal the specific bank after your consent + call, to keep within bank policy.”

4) WhatsApp → Offers (the “holy grail” made realistic)

The problem isn’t LLMs; it’s lack of a stable schema + review step. Do this:

A. Normalization protocol

You paste raw banker text into /ops/ingest (or email forward).

Claude extracts into strict schema v1 (keys above) with per-field confidence and the raw text hash.

If a field is missing or ambiguous, it must emit "status":"NEEDS_REVIEW" and a human-readable diff.

B. Bank codebooks

For each bank, maintain a tiny YAML of its common phrase patterns → schema mapping (regexes for “SORA +x%”, “FHR6 + y%”, “fixed nn% yr1–2”).

Claude first tries codebook, then few-shot fallback; never invents a field it didn’t see.

C. Human-in-the-loop

/ops/review shows the raw text side-by-side with parsed rows; green highlight for high confidence, amber for low.

One click to accept → version bump + updated_by = you.

D. Freshness control

Each bank has a stale timer (e.g., 10 days). If no new message arrives, mark offers “stale (amber)” and demote in ranking.

The client PDF shows “offer freshness: 2 days.”

E. Image messages

Add OCR (Tesseract) → same pipeline. If OCR confidence < 0.9, force manual review.

Result: you respect bank norms (no public publishing), yet you compute across banks with a verifiable audit.

5) Masked-bank system (client-safe, banker-friendly)

Render options as Bank A / Bank B / Bank C with recognizable features but not identifiers.

Each mask maps to a bank_code in your DB; only unmasked in your private “banker email” pack.

If a client forwards your PDF, it’s useless without you: no bank names, no exact deviated rates—just the math and the why.

6) Client dashboard (light but sticky)

Modules: Analysis (snapshot), To-dos (docs, e-sign), Timeline (T-minus to switch), Messages (single thread), Files (auto-expire after 30–45 days).

Consent: PDPA modal with auto-expiry—default 5 days, user can extend.

Buttons: “Book a call”, “Update numbers”, “Refresh analysis”.

Back-office: One-click “Bank Pack” → email banker (client CC) with filled forms + required docs list.

Safety: No deviated rates displayed; only mask + math.

7) AI’s role (clear, safe, convincing)

Public explanation:
“AI-assisted means the math, comparisons, and document prep are automated so your broker has more time to think with you. Advice is human; banks are engaged by a human; your data is consent-controlled and auto-expires.”

How you actually use it:

“Delta explainers” when inputs change.

“Clause explainer” snippets tied to each offer field (no hallucination—pulled from your schema).

“Pack generator” that assembles a banker-ready email + PDF coversheet.

“Follow-up writer” that drafts WhatsApp nudges in your tone (you approve).

Never let AI speak as a banker or promise unnamed data sources.

8) Persuasive one-pager (structure you can reuse today)

Header: “Refinance decision — [Initials], [Date], Valid 5 days”

Summary box: Monthly change, 36-mo total cost delta, break-even month, penalties and rebates included.

Top 3 options (masked):

Payment Yr1, Yr2, lock-in, subsidy/clawback, early prepay fee, features (offset, partial prepay).

Why ranked here (1 sentence).

Risks & notes: repricing counter-offers, notice periods, legal timelines.

Next steps: 3 bullets + “Start documents” button.

9) Marketing: indie, programmatic, relentless (no paid ads yet)

Public build: Post daily deltas (X + LinkedIn). Short clips: “Today I shipped X; here’s the before/after.”

Programmatic SEO (safe):

Generate masked evergreen pages:
/guides/fixed-vs-floating-2025, /guides/hdb-upgrader-bridge, /guides/sora-sensitivity, /guides/offset-accounts-explained, /guides/decoupling-basics.

Auto-update “What changed this week?” digest from your audit logs.

Always-on touchpoints (10–15/yr per client):

Fed/SGD rates events (explain in 4 bullets).

Lock-in windows, cashflow seasonality, “We found $X if you switch” alerts.

Warm personal pings (birthdays, new job, kid starting P1).

“3-minute Friday” email: SORA in one paragraph + one chart.

Referral engine: After LO signed → auto “thank you + who can I help?” flow + optional $100 charity donation in their name (fits your earlier idea).

10) Your narrative to ex-clients (paste this)

“Hey [Name] — quick update: I’ve launched NextNest, an AI-assisted, human-first mortgage studio. The AI does the heavy lifting on numbers and paperwork so I can give you clearer recommendations faster.

I don’t publish private bank rates; I’ll show you masked options with full math and risks, then we pick together on a 15-min call.

If you send me your current loan amount, lock-in date, and property type, I’ll reply with a one-page plan (valid 5 days) and the exact steps to switch or stay.

Want me to run it now?”

11) What to change on nextnest.sg today

Replace “23 banks, updated every 15 minutes” with:
“Continuously reconciled offers with human verification. We show all viable paths including staying put. Full audit receipts on every suggestion.” 
nextnest.sg

Replace “AI-POWERED INTELLIGENCE” hero with:
“Human advice, AI-precision. See your top 3 options (masked), with the math that matters and a plan you can act on today.”

Add a Trust strip: PDPA consent & auto-expiry • Audit trail • Banker-ready packs • No public deviated rates.

12) 7-Day sprint (use Claude/Codex ruthlessly)

Day 1 – Strip homepage claims; ship new hero + CTAs. Build /apply v1 (5 inputs), ruleset JSON v1, and scenario compute.
Day 2 – React-PDF one-pager; masked options; sensitivity table; audit receipts.
Day 3 – /ops/ingest with schema v1 + codebooks + human review. Seed 6 banks manually.
Day 4 – Calendar + WhatsApp templates + banker pack email generator (client CC).
Day 5 – Client dashboard v0 (analysis, timeline, to-dos) + PDPA consent/expiry.
Day 6 – Programmatic SEO scaffolding + “What changed this week?” digest.
Day 7 – Record a 3-min demo; DM ex-clients; take calls; iterate nightly.

13) Sticky issues → decisions

Q: How to use AI without looking like a bot?
A: Keep AI behind the curtain. Front-end is your voice + PDF. The only “chat” is scheduling and clarifying inputs.

Q: Publishing bank names/rates?
A: Don’t. Masked in client PDFs; unmask only in banker emails with consent ID. That keeps you inside norms and avoids reprisals.

Q: Rates ingestion from WhatsApp is flaky.
A: Solve with schema + codebooks + human review + stale timers. Don’t chase 100% automation; chase reliable 90% with fast manual top-ups.

Q: PDPA & data retention?
A: Consent modal with explicit purposes and auto-expiry after 5 days (extendable). Files auto-expire in 30–45 days. Dashboard shows “expiry in X days.”

Q: Solo vs hire?
A: Stay solo until you’re > $10M/mo settled for 3 consecutive months. Only then consider one ops assistant (non-broker) to prep packs.

Q: How to be the “blue ocean” vs Redbrick?
A: Speed + transparency + proof. Masked math, audit receipts, 5-day refresh policy, and a human who answers in the same hour. Redbrick sells scale; you sell certainty in one page.

14) Exactly what to ship next (copy/paste tasks to Claude)

Generate React-PDF template for the one-pager with masked banks and sensitivity table.

Write Zod schemas for ScenarioInputs, Offer, Ruleset, BankPack. Add unit tests.

Build /ops/ingest: paste message → parse to schema → flag needs_review → approve into offers.

Implement stale timers per bank + UI freshness badges.

Write banker pack email: subject, bullet summary, attached PDF, list of required docs, client CC.

Draft 6 programmatic guide pages skeletons + content from your schema (no bank names).

Implement consent + auto-expiry on dashboard with a cron that soft-deletes and logs.

Replace homepage copy as above; remove unverifiable metrics today. 
nextnest.sg

Prepare DM to ex-clients (script above) and a 90-second Loom demo.

Set a changed-this-week.md script that reads audit deltas → blog/newsletter.

You now have a crisp, safe, and fast plan that fits Singapore’s realities: banks guard deviated rates; clients are mercenary; speed and clarity win. Build the smallest loop that proves the promise—masked math → one-pager → call → banker pack—and let AI do the grunt work offstage.

## Below is the code for one-pager PDF

# Project Structure (proposed)

```
nextnest/
├─ src/
│  ├─ pdf/
│  │  └─ NextNestReport.tsx
│  ├─ ops/
│  │  ├─ ingest.ts
│  │  ├─ codebooks/
│  │  │  ├─ bank_d.yml
│  │  │  └─ bank_omega.yml
│  ├─ server/
│  │  ├─ db.ts
│  │  └─ email.ts
│  ├─ schemas.ts
│  └─ rulesets/
│     └─ mas_rules_v1.json
├─ prisma/
│  └─ schema.prisma  (or SQL below if not using Prisma)
└─ sql/
   └─ tables.sql
```

---

## 1) React‑PDF — One‑Pager Layout (`src/pdf/NextNestReport.tsx`)

> Purpose: produce a masked, persuasive, bank‑friendly 1‑page PDF with a 5‑day validity stamp, cost timeline, sensitivity, and an audit footer.

```tsx
// src/pdf/NextNestReport.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Types you already validate with Zod elsewhere
export type MaskedOption = {
  mask: string; // e.g., "Bank Δ"
  productType: "fixed" | "floating" | "hybrid";
  tenorYears: number;
  lockInMonths: number;
  headlineRate: string; // e.g., "3.25% yr1-2" or "SORA + 0.70%"
  monthlyPaymentY1: number;
  monthlyPaymentY2?: number;
  effectiveCost36m: number; // fees, rebates, penalties amortized
  features: string[]; // offset, partial prepay etc.
  whyRanked: string;  // one sentence rationale
  freshnessDays: number; // age of last human-verified update
};

export type SensitivityRow = {
  deltaBps: number; // -50, 0, +50
  paymentY1: number;
  total36m: number;
};

export type ReportProps = {
  clientInitials: string;
  propertyType: string; // HDB/Private/EC
  scenarioHash: string; // immutable snapshot id
  createdAt: string; // ISO
  validDays: number; // 5
  loanAmount: number;
  tenureYears: number;
  ltv: number; // %
  tdsrOk: boolean;
  options: MaskedOption[]; // top 3
  sensitivity: SensitivityRow[]; // -50, 0, +50 bps
  timelineNotes: string[]; // notice period, legal, clawback windows
  nextSteps: string[]; // 3 simple bullets
  audit: {
    consentId: string;
    rulesetVersion: string;
    offersSnapshotVersion: string;
  };
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: "Helvetica" },
  header: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 14, fontWeight: 700 },
  chip: { fontSize: 9 },
  hr: { height: 1, backgroundColor: "#999", marginVertical: 8 },
  grid: { display: "flex", flexDirection: "row", gap: 8 },
  col: { flexGrow: 1 },
  box: { border: 1, borderColor: "#ddd", borderRadius: 4, padding: 8, marginBottom: 6 },
  label: { color: "#666", fontSize: 9, marginBottom: 2 },
  big: { fontSize: 12, fontWeight: 700 },
  small: { fontSize: 9 },
  listItem: { marginBottom: 2 },
  footer: { marginTop: 8, color: "#666" },
});

export const NextNestReport: React.FC<ReportProps> = (props) => {
  const currency = (n: number) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(n);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Refinance Decision — {props.clientInitials}</Text>
          <Text style={styles.chip}>
            Snapshot: {new Date(props.createdAt).toLocaleDateString("en-GB")} • Valid {props.validDays} days • Scenario {props.scenarioHash}
          </Text>
        </View>
        <View style={styles.hr} />

        {/* Summary */}
        <View style={styles.grid}>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.label}>Loan amount</Text>
            <Text className="big">{currency(props.loanAmount)}</Text>
            <Text style={styles.label}>Tenure</Text>
            <Text>{props.tenureYears} years</Text>
          </View>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.label}>LTV</Text>
            <Text>{props.ltv}%</Text>
            <Text style={styles.label}>TDSR / MSR</Text>
            <Text>{props.tdsrOk ? "Within limits" : "Exceeds — adjust inputs"}</Text>
          </View>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.label}>This page shows</Text>
            <Text>Top 3 masked options ranked by 36‑month effective cost including fees, subsidies & penalties.</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.hr} />
        <Text style={styles.big}>Top options (masked)</Text>
        {props.options.map((o, i) => (
          <View key={i} style={styles.box}>
            <Text style={styles.big}>{i + 1}. {o.mask} • {o.productType.toUpperCase()} • {o.tenorYears}y • Lock‑in {o.lockInMonths}m</Text>
            <Text>
              Headline: {o.headlineRate} • Payment Yr1: {currency(o.monthlyPaymentY1)}{o.monthlyPaymentY2 ? ` • Yr2: ${currency(o.monthlyPaymentY2)}` : ""} • 36‑mo effective: {currency(o.effectiveCost36m)}
            </Text>
            <Text style={styles.small}>Freshness: {o.freshnessDays} days since human verification</Text>
            <Text style={styles.label}>Features</Text>
            <Text>{o.features.join(" • ")}</Text>
            <Text style={styles.label}>Why ranked here</Text>
            <Text>{o.whyRanked}</Text>
          </View>
        ))}

        {/* Sensitivity */}
        <View style={styles.hr} />
        <Text style={styles.big}>Rate sensitivity (±50 bps)</Text>
        <View style={styles.box}>
          {props.sensitivity.map((s, i) => (
            <Text key={i}>Δ{s.deltaBps} bps → Payment: {currency(s.paymentY1)} • 36‑mo total: {currency(s.total36m)}</Text>
          ))}
        </View>

        {/* Timeline & next steps */}
        <View style={styles.grid}>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.big}>Timeline notes</Text>
            {props.timelineNotes.map((t, i) => (
              <Text key={i} style={styles.listItem}>• {t}</Text>
            ))}
          </View>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.big}>Next steps</Text>
            {props.nextSteps.map((t, i) => (
              <Text key={i} style={styles.listItem}>• {t}</Text>
            ))}
          </View>
        </View>

        {/* Footer / audit */}
        <View style={styles.footer}>
          <Text>Consent: {props.audit.consentId} • Ruleset: {props.audit.rulesetVersion} • Offers snapshot: {props.audit.offersSnapshotVersion}</Text>
          <Text>Note: Specific bank identities and deviated rates are disclosed privately after consent, not published here.</Text>
        </View>
      </Page>
    </Document>
  );
};
```

---

## 2) Zod Schemas — Scenarios, Offers, Rules, Bank Pack (`src/schemas.ts`)

```ts
// src/schemas.ts
import { z } from "zod";

export const ScenarioInputs = z.object({
  propertyType: z.enum(["HDB", "Private", "EC"]),
  isOwnerOccupied: z.boolean(),
  loanAmount: z.number().positive(),
  tenureYears: z.number().int().min(5).max(30),
  agePrimary: z.number().int().min(21).max(75),
  ageCo?: z.number().int().min(21).max(75).optional(),
  monthlyIncomePrimary: z.number().nonnegative(),
  monthlyIncomeCo: z.number().nonnegative().optional(),
  incomeTypePrimary: z.enum(["fixed", "variable", "self" ]),
  incomeTypeCo: z.enum(["fixed", "variable", "self"]).optional(),
  existingLoans: z.array(z.object({ bankMasked: z.string(), monthlyPayment: z.number() })).optional(),
});

export const Offer = z.object({
  bankCode: z.string().min(1), // internal code, never shown on PDF
  productType: z.enum(["fixed", "floating", "hybrid"]),
  tenorYears: z.number().int().min(1).max(30),
  pricingBasis: z.enum(["SORA", "FHR", "FIXED"]).optional(),
  headlineRate: z.string(), // human-friendly
  soraSpread: z.number().optional(),
  fixedRate: z.number().optional(),
  lockInMonths: z.number().int().min(0),
  minLoan: z.number().nonnegative().optional(),
  fees: z.object({ legalSubsidy: z.number().optional(), valuationSubsidy: z.number().optional(), repricingFee: z.number().optional(), cashRebate: z.number().optional() }).default({}),
  features: z.array(z.string()).default([]),
  updatedAt: z.string(), // ISO
  sourceMsgId: z.string().optional(),
});

export const MaskedOption = z.object({
  mask: z.string(),
  productType: z.enum(["fixed", "floating", "hybrid"]),
  tenorYears: z.number().int(),
  lockInMonths: z.number().int(),
  headlineRate: z.string(),
  monthlyPaymentY1: z.number(),
  monthlyPaymentY2: z.number().optional(),
  effectiveCost36m: z.number(),
  features: z.array(z.string()),
  whyRanked: z.string(),
  freshnessDays: z.number().int(),
});

export const Ruleset = z.object({
  version: z.string(),
  ltv: z.object({ /* ... MAS rules encoded here ... */ }),
  tdsr: z.object({ /* ... */ }),
  msr: z.object({ /* ... */ }),
  notes: z.array(z.string()).optional(),
});

export const BankPack = z.object({
  toBankEmail: z.string().email(),
  ccClientEmail: z.string().email(),
  subject: z.string(),
  bodyText: z.string(),
  attachments: z.array(z.object({ filename: z.string(), url: z.string() })),
});

export type ScenarioInputsT = z.infer<typeof ScenarioInputs>;
export type OfferT = z.infer<typeof Offer>;
export type MaskedOptionT = z.infer<typeof MaskedOption>;
export type BankPackT = z.infer<typeof BankPack>;
```

---

## 3) WhatsApp → Structured Offers Ingestion (`src/ops/ingest.ts`)

> The reliable pattern: **codebook → LLM extraction → human review**. Never save to `offers` without `status = APPROVED`.

```ts
// src/ops/ingest.ts
import yaml from "js-yaml";
import { Offer } from "../schemas";

export type ParseResult = {
  status: "APPROVED" | "NEEDS_REVIEW";
  offers: Array<z.infer<typeof Offer>>;
  lowConfidenceFields: Array<{ bankCode: string; field: string; reason: string }>;
  source: { rawTextHash: string; receivedAt: string };
};

/** Pseudocode pipeline (callable from an API route):
 * 1) Load bank codebook based on detected bankCode.
 * 2) Run deterministic regex parses from codebook.
 * 3) Ask LLM to fill any missing fields with explicit `null` if truly absent.
 * 4) Score confidence per field; if any < threshold, mark NEEDS_REVIEW.
 * 5) Return `ParseResult` for UI review.
 */
export async function parseBankMessage(raw: string, bankCode: string): Promise<ParseResult> {
  const codebook = await loadCodebook(bankCode);
  const regexHits = runRegexExtract(raw, codebook.patterns);
  const llmFill = await llmAssist(raw, codebook, regexHits.missingFields);
  const merged = mergeFields(regexHits.fields, llmFill.fields);
  const conf = scoreConfidence(merged, codebook);
  const status = conf.min < 0.85 ? "NEEDS_REVIEW" : "APPROVED";

  const offers = buildOfferRows(merged, bankCode);
  return {
    status,
    offers,
    lowConfidenceFields: conf.lowFields,
    source: { rawTextHash: sha256(raw), receivedAt: new Date().toISOString() },
  };
}

// helper stubs for you/Claude to implement
async function loadCodebook(bankCode: string) { /* read YAML, return typed object */ }
function runRegexExtract(raw: string, patterns: any) { /* returns fields + missingFields */ }
async function llmAssist(raw: string, codebook: any, missing: string[]) { /* constrained extraction */ }
function mergeFields(a: any, b: any) { /* ... */ }
function scoreConfidence(fields: any, codebook: any) { /* produce min + lowFields[] */ }
function buildOfferRows(fields: any, bankCode: string) { /* map to Offer schema rows */ }
function sha256(s: string) { /* ... */ }
```

---

## 4) Codebook Examples (YAML) — Bank‑specific Phrase Maps

> One per bank. Keep them tiny. Update when phrasing changes.

### `src/ops/codebooks/bank_d.yml`
```yml
meta:
  bankCode: D
  name: Bank Delta (masked public)
patterns:
  fixed_blocks:
    # e.g. "Fixed 3.25% (Years 1-2), then FHR6 +0.65%"
    - regex: "Fixed\s+(?<rate>[0-9.]+)%\s*\(Years?\s*(?<years>[0-9-]+)\)"
      map:
        productType: "fixed"
        fixedRate: "{{rate}}"
        tenorYears: "{{years}}"
  sora_spread:
    # e.g. "SORA +0.70%, floor 0.05%"
    - regex: "SORA\s*\+\s*(?<spread>[0-9.]+)%"
      map:
        productType: "floating"
        pricingBasis: "SORA"
        soraSpread: "{{spread}}"
  lock_in:
    - regex: "lock-?in\s*(?<months>\d{1,2})m"
      map:
        lockInMonths: "{{months}}"
  fees:
    - regex: "legal\s*subsidy\s*\$?(?<legal>\d{3,5})"
      map:
        fees.legalSubsidy: "{{legal}}"
    - regex: "cash\s*rebate\s*\$?(?<rebate>\d{3,5})"
      map:
        fees.cashRebate: "{{rebate}}"
notes:
  - "If both fixed and floating appear, create two Offer rows."
  - "Headline rate should be human-friendly (e.g., '3.25% yr1-2' or 'SORA + 0.70%')."
confidence:
  base: 0.9
  penalize_missing: 0.1
```

### `src/ops/codebooks/bank_omega.yml`
```yml
meta:
  bankCode: OMEGA
  name: Bank Omega (masked public)
patterns:
  hybrid:
    # e.g. "Yr1 fixed 3.10%, Yr2 fixed 3.25%, thereafter SORA +0.65%"
    - regex: "Yr1\s*fixed\s*(?<y1>[0-9.]+)%.*Yr2\s*fixed\s*(?<y2>[0-9.]+)%.+SORA\s*\+\s*(?<spr>[0-9.]+)%"
      map:
        productType: "hybrid"
        fixedRate: "{{y1}}"
        headlineRate: "{{y1}}%→{{y2}}% then SORA + {{spr}}%"
  lock_in:
    - regex: "Lock in:?\s*(?<months>\d{1,2})\s*months?"
      map:
        lockInMonths: "{{months}}"
  features:
    - regex: "offset\s*account"
      map:
        features[]: "offset account"
notes:
  - "Always set pricingBasis for post-fixed years if present."
confidence:
  base: 0.88
  penalize_missing: 0.15
```

---

## 5) SQL Tables (if not using Prisma) — `sql/tables.sql`

```sql
create table banks (
  id serial primary key,
  code varchar(12) unique not null,
  name varchar(128) not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table offers (
  id serial primary key,
  bank_code varchar(12) references banks(code),
  product_type varchar(12) not null, -- fixed | floating | hybrid
  pricing_basis varchar(12), -- SORA | FHR | FIXED
  headline_rate varchar(64) not null,
  sora_spread numeric,
  fixed_rate numeric,
  tenor_years int not null,
  lock_in_months int not null default 0,
  min_loan numeric,
  fees jsonb default '{}',
  features jsonb default '[]',
  updated_at timestamptz not null,
  source_msg_id varchar(64),
  source_raw_hash varchar(128),
  status varchar(12) not null default 'APPROVED' -- or DRAFT
);

create table scenarios (
  id uuid primary key default gen_random_uuid(),
  inputs_json jsonb not null,
  results_json jsonb not null,
  ruleset_version varchar(32) not null,
  created_at timestamptz default now()
);

create table audit_entries (
  id bigserial primary key,
  scenario_id uuid references scenarios(id),
  actor varchar(24) not null, -- USER | SYSTEM | ADMIN
  action varchar(64) not null,
  meta_json jsonb,
  at timestamptz default now()
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios(id),
  purposes_json jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
```

---

## 6) Banker Pack Email (server template) — `src/server/email.ts`

```ts
export function bankerPackEmail({
  bankName,
  clientName,
  propertyType,
  loanAmount,
  tenorYears,
  cc,
  pdfUrl,
  docsList,
}: {
  bankName: string;
  clientName: string;
  propertyType: string;
  loanAmount: number;
  tenorYears: number;
  cc: string; // client email
  pdfUrl: string;
  docsList: string[];
}) {
  const subject = `[NextNest] Application for ${clientName} — ${propertyType}, ${loanAmount.toLocaleString("en-SG")} SGD, ${tenorYears}y`;
  const body = `Hi ${bankName} Team,\n\nPlease find attached the application summary for ${clientName}.\n\nKey details:\n• Property: ${propertyType}\n• Loan amount: SGD ${loanAmount.toLocaleString("en-SG")}\n• Tenure: ${tenorYears} years\n\nAttachments:\n• Analysis PDF: ${pdfUrl}\n\nRequired documents (attached or in secure link):\n${docsList.map((d) => `• ${d}`).join("\n")}\n\nCC: ${cc}\n\nBest,\nNextNest Brokerage\n`;
  return { subject, body };
}
```

---

## 7) Sample Ruleset Seed (sketch) — `src/rulesets/mas_rules_v1.json`

```json
{
  "version": "v1.0.0",
  "ltv": {
    "owner_occupied_first": 75,
    "subsequent": 45,
    "private_limits": [ /* fill with actual ranges */ ]
  },
  "tdsr": {
    "max": 55,
    "stress_rate": 0.04
  },
  "msr": {
    "hdb": 30
  },
  "notes": [
    "These values are placeholders; fill with current MAS rules and bank practice tests.",
    "Version every change and store with scenario audit receipts."
  ]
}
```

---

## 8) Claude Extraction Prompt (system) — Constrained Fill

```text
You convert raw banker WhatsApp or email text into a strict Offer schema. 
Rules:
- Never invent values. If absent or ambiguous, return null for the field and add a reason in lowConfidenceFields.
- Use the bank codebook mappings first (regex hints); only then infer format.
- If multiple products are present (e.g., fixed and floating), emit multiple Offer rows.
- Headline must be human-friendly (e.g., "3.25% yr1-2" or "SORA + 0.70%").
- pricingBasis is one of: SORA | FHR | FIXED. Hybrid must include a combined headline.
- lockInMonths default to 0 unless explicit.
- updatedAt must be now in ISO.
Return JSON only with keys: { status, offers[], lowConfidenceFields[], source{ rawTextHash, receivedAt } }.
```

---

## 9) “Changed This Week” Digest (script sketch)

```ts
// read audit_entries for action in [OFFER_ADDED, OFFER_UPDATED] last 7 days
// group by bank_code; render a short markdown digest for SEO + newsletter
```

---

## 10) One‑Pager Content Assembly (server outline)

```ts
// fetch scenario + compute results
// select top-3 offers by effectiveCost36m with constraints (tenor, minLoan, product prefs)
// map to MaskedOption (A/Δ, B/Ω, C/Σ) + freshnessDays from updatedAt
// build sensitivity rows from baseline ± 0.50% on pricing basis
// pass into <NextNestReport /> and stream PDF
```

---

## 11) Safety Copy Snippets (drop‑in)

- "We do not publish private deviated rates. Options are masked until consent and call."
- "Every suggestion includes fees, rebates, and penalties in the cost math."
- "Your data has an auto‑expiry; extend anytime from your dashboard."

---

## 12) WhatsApp Nudge Templates (approve before sending)

- **Post‑PDF:** "Sent your 1‑pager (valid 5 days). Want me to unmask the top pick and file the docs? 15‑min call here: [link]"
- **Lock‑in Window:** "You’re 75 days from lock‑in end. Switching now avoids a double-payment month. Want me to run fresh numbers?"
- **Repricing Risk:** "Your current bank often counters in the last 2–3 weeks. I’ll prep both routes so you can choose calmly."

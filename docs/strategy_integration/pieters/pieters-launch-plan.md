Alright — BE Pieter Levels: ship fast, stay solo, automate the edges, revenue from day 1, brutally simple stack, public build thread, programmatic SEO, and ruthless scope control. Below are the first 100 concrete steps to bootstrap NextNest using Claude Code/Codex as your force-multiplier while you remain the only human broker.

Phase 0 — Foundation (Positioning, Scope, Legal) — Steps 1–12

Lock name/domain: nextnest.sg + nextnest.ai.

Define single outcome: “banker-grade rates + clear pick in <5 min.”

Decide free vs paid: free planner, paid “Fast-Track” (priority handling, $199) + broker commissions from banks.

Draft PDPA policy, consent flow, data-retention (auto-delete PII after X days unless user extends).

Write compliance disclaimers (not financial advice, MAS T&Cs, bank-provided numbers, audit trail kept).

Register business entity and broker status (tie to current brokerage structure; ensure commission routing).

Create one-line messaging: “Mortgage clarity before the coffee cools.”

Pick stack: Next.js + Tailwind (Vercel), Postgres (Neon/Supabase), file store (Supabase/Cloudflare R2), n8n automations.

Observability: Plausible analytics, Logtail for logs, UptimeRobot.

Support channels: Intercom (lite) or Crisp; WhatsApp Business API via Twilio; Calendly for calls.

Security basics: 2FA everywhere, least-privilege, .env rotation, secrets in Doppler.

Set public build log (X + indie hackers thread) to attract early adopters + trust.

Phase 1 — Skeleton Product — Steps 13–24

With Claude/Codex, scaffold Next.js app with /, /report/[slug], /eligibility, /compare.

Implement Tailwind UI with a stark, fast theme; ship a clean hero + two CTAs (“Start”, “Sample report”).

Authless mode first: store session in signed cookies; add soft account later.

Create Postgres schema v0: leads, intake_answers, scenarios, offers, banks, audit_entries, documents, consents.

Build consent banner + modal (explicit PDPA, purposes, expiry date).

Add “Start in 60 seconds” intake (property type, loan amt, tenure, SORA/FH/Fixed preference, income basics).

Add server actions to compute rough TDSR/MSR quick checks and LTV caps (rules table).

Add /sample-report static page with a redacted example.

Implement audit trail middleware (every recommendation/action writes to audit_entries).

Integrate Plausible + simple event map (start, finish, book_call, download_pdf).

Deploy to Vercel (preview + prod), set custom domains, force HTTPS.

Write smoke tests with Playwright (home, intake, sample, 200/500 guards).

Phase 2 — Data Ingestion (Rates & Packages) — Steps 25–36

Create banks and offers tables with fields: bank_id, name, product_type, sora_spread, lock_in, repricing_fee, legal_subsidy, valuation_cap, notes, updated_at.

Start manual seed of 10–15 current packages (you curate daily; fastest path).

Build admin /ops/offers (protected) to add/edit packages in 30s.

Add CSV import in admin; Claude writes a CSV parser.

Create “freshness badge” on UI using updated_at delta.

Set up n8n inbox parser (Parseur/Mailparser) for banker emails → webhook → DB update draft (you approve).

Build a “delta log” to show users what changed in the last 5 days.

Add rule engine for edge clauses (FHR floors, clawbacks, min loan, lock-in penalties).

Model “effective annual cost” metric that includes subsidies/fees amortized.

Show top 3 fits, then expandable rest (no walls of text).

Add “why ranked this way” panel (transparency).

Create daily “sanity checklist” script: missing fresh offers, stale flags, anomalies.

Phase 3 — Core Computation (Singapore Rules) — Steps 37–48

Encode MAS LTV/TDSR/MSR rules as versioned JSON + test suite.

Add property categories: HDB/EC/private, owner-occupied vs investment, first/second loan, age rules.

Salary types: fixed, variable %, self-employed add-backs/discounts; CPF OA usage logic.

Bridging scenario checkbox with explanation + risk notes.

Repricing vs refinancing bifurcation (edge warnings on lock-in/penalties).

Scenario builder: user can toggle tenure, rate type, prepayment; recompute instantly.

Cost timeline view: month 1–36 cashflow, legal fees net of subsidies, break-even on switching.

Generate a “sensitivity table” (±50bps SORA) to show robustness.

Add document checklist per bank (varying requirements).

Save/share link for family review (immutable snapshot with hash).

PDF export of the plan (server-side React-PDF).

Audit receipts appended in the PDF (consent ID, ruleset version, offer freshness).

Phase 4 — AI Co-Advisor (Claude/Codex) — Steps 49–60

Design prompt chain: “Explain like a broker to a smart adult; no fluff; cite clauses; flag risk.”

Tooling: give the model structured access to offers, rules, and user_scenario via server functions (no raw DB creds).

Create Response-Aware Guidance: if user toggles a variable, the assistant re-summarizes only deltas.

Add “What changed since last week?” explainer using audit deltas.

Build “ask anything” box with safe defaults and guardrails (no legal/financial advice claims).

Implement “explain this clause” micro-prompts on hover.

Add “create bank-ready summary” button: JSON → PDF cover letter.

Train a mini prompt for “risk mirror”: the AI must state uncertainties and data freshness every time.

Create canned “next steps” generator (call scripts, email templates).

System test prompts; ban hallucinated banks via whitelist.

Add profanity/off-topic filters; redirect to human when stuck.

Cache AI outputs per scenario hash to cut cost.

Phase 5 — Human Broker Ops (Solo) — Steps 61–72

Calendly page with 20-min slots; buffer and max daily count.

WhatsApp Business quick-replies: intake request, doc checklist, follow-up nudges.

Notion board (or lightweight Airtable) as CRM: columns = Stage, Amount, Bank, Deadline, Docs, Notes.

n8n workflows: intake → CRM card → email/WA templates → task reminders.

Commission tracker per bank (private) with expected payout timelines.

Set SLAs: response in 2h business hours; overnight batched updates at 9am.

Pre-filled bank forms generator; user e-sign via Dropbox Sign.

Secure file intake (Supabase signed URLs), antivirus scan, auto-expire links after 30 days.

Create pipeline dashboard (kanban): New → Reviewing → Docs Pending → Bank Submitted → LO Issued → Completed.

Add “five-day refresh” policy: you commit to updated offers within 5 business days.

Build “referral ask” template post-completion (with opt-in).

Finance hygiene: monthly P&L export, tax earmark, invoice/receipt templates.

Phase 6 — Go-to-Market (Indie, Programmatic) — Steps 73–84

Publish your build thread daily: metrics, learnings, screenshots.

Launch Hacker News “Show HN: NextNest” when MVP works end-to-end.

Seed a programmatic SEO tree: /guides/{bank}-{fixed/sora}-{tenure} auto-generated from offers.

Add localized explainers: HDB upgrader, decoupling basics, bridging timeline.

Comparison pages vs typical brokers (“free but slow” vs “instant clarity + human on demand”).

“Live rate updates” page with changelog (timestamped).

Publish “mortgage report generator” as a free tool (leads magnet).

Capture email/WA consent softly (continue without email still possible).

Ship “View a sample report” CTA on home and share to X/LinkedIn.

Outreach to property agents: co-branded report (their headshot + your engine), rev share.

Record a 3-min demo video; embed site-wide.

Spin a tiny newsletter: “SORA in one paragraph, weekly.”

Phase 7 — Monetization & Pricing Experiments — Steps 85–92

Keep core free; monetize via bank commissions (primary) + $199 Fast-Track (secondary).

Test $29/month “Pro Monitor” for homeowners: alerts when switching saves > X.

Offer $49 “Document Concierge” (you prep/organize).

A/B test CTAs: “Talk to an advisor” vs “See my savings now.”

Add “tip jar” for DIYers who don’t want broker help.

Track conversion funnel in Plausible: start → see offers → save → call/book → submitted.

Measure activation time; target <4 minutes to first ranked offer.

Add “exit intent” modal: email a personal link to return later.

Phase 8 — Reliability, Speed, Trust — Steps 93–100

Lighthouse > 95 mobile/desktop; remove all non-essential JS.

Set rate-limit/abuse guards; queue heavy calls; cache frequently used datasets.

Backups: nightly Postgres backups; test restore monthly.

Incident playbook: status page, tweet template, user email.

Pen-test checklist; rotate keys quarterly; content-security-policy strict.

Add “transparency page”: how we make money, how consent works, deletion policy.

Invite 10 users for 1:1 onboarding; record friction; remove 20% of UI.

Ship v1.0. Announce. Keep shipping daily deltas. Talk to users every day.

How to use Claude Code/Codex effectively (threaded through)

Boilerplate gen: scaffolds, Tailwind components, CRUD admin, React-PDF templates.

Rule encoding: feed MAS/TDSR/MSR text → ask model to emit normalized JSON + test cases.

Explainers: prompt to produce concise clause explanations with citations to the offer fields you maintain.

Programmatic SEO: ask it to transform offers rows → static guide pages with consistent tone and disclaimers.

Ops scripts: CSV parsers, inbox → DB webhook code, sanity checks, reconciliation reports.

Minimal DB v0 (fast copy/paste for Claude)

banks(id, name, contact_email, is_active, created_at, updated_at)

offers(id, bank_id, product_type, sora_spread, fixed_rate, lock_in_months, min_loan, legal_subsidy, repricing_fee, notes, effective_cost_score, updated_at)

rulesets(id, name, version, json, effective_from)

leads(id, session_id, email, phone, consent_id, created_at)

intake_answers(id, lead_id, key, value, created_at)

scenarios(id, lead_id, json, hash, created_at)

audit_entries(id, lead_id, action, meta_json, created_at)

documents(id, lead_id, kind, url, expires_at, created_at)

consents(id, lead_id, purposes_json, expires_at, created_at)

Copy you can use immediately (tight, indie)

Hero: Mortgage advice that moves at your speed.

Sub: See live bank offers, understand the trade-offs, and lock in the right deal before anyone else shows up.

CTA: Start in 60 seconds / View a sample report

Trust strip: PDPA-grade vault • Audit trail • Banker-ready docs

Why us: Real rates now • Transparent receipts • Always-on support

Keep scope savage. Build the smallest loop that proves the promise: fresh rates → ranked choice → audit-clean PDF → human broker helps file. Talk to users daily. Kill anything that slows that loop.

Want me to spin up the exact Next.js file structure + first pages and a seed SQL you can paste into your DB?
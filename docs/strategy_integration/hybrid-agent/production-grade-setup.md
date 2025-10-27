Short answer: no, you don’t need LangChain or CrewAI. With Next.js + Vercel AI SDK + BullMQ + Chatwoot, you can run a lean, production-grade hybrid agent without heavy frameworks.

Here’s a pragmatic setup that slots into your stack today.

Architecture (minimal + solid)

Next.js (App Router)

app/api/chat/route.ts — streaming Chat endpoint (Vercel AI SDK).

lib/agent/ — your tiny orchestrator (intent → retrieve → tool → JSON).

lib/rag/ — retriever + vector store/BM25.

lib/tools/ — recommendPackages, mortgageMath, macroView.

lib/schema/ — Zod JSON schema for strict outputs.

BullMQ

Queue long tasks (batch package comparisons, PDF memos, valuation lookups).

workers/agentWorker.ts runs on a Node worker (not on Vercel edge).

Chatwoot

Webhook ➜ app/api/chatwoot/inbound/route.ts

Replies via Chatwoot API from your server/worker.

Store

Start with SQLite/pg + pgvector (or sqlite-vss) for RAG.

Later: Pinecone/Qdrant if you outgrow it.

Why not LangChain/CrewAI?

Pros (DIY): smaller surface area, faster cold start on Vercel, easier to reason about failures, cheaper.

When to add: multi-agent topologies, tool registries with dozens of tools, or if your team already speaks LangChain.

The lean agent (TypeScript)
1) JSON contract (Zod)
// lib/schema/agent.ts
import { z } from "zod";

export const ToolName = z.enum(["recommend_packages","mortgage_math","macro_view","none"]);
export const AgentSchema = z.object({
  kind: z.enum(["final_answer","clarification_request"]),
  citations: z.array(z.string()),
  tool_call: z.object({
    name: ToolName,
    arguments: z.record(z.any())
  }),
  answer: z.string().optional(),
  structured: z.object({
    tracks: z.array(z.object({
      option: z.enum(["reprice","refinance"]),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      packages: z.array(z.any())
    })).optional(),
    math: z.record(z.any()).optional(),
    macro: z.record(z.any()).optional()
  }).optional()
});
export type AgentOutput = z.infer<typeof AgentSchema>;

2) Tools (Singapore-specific)
// lib/tools/mortgage.ts
export function recommendPackages(args: {
  property_type:"private"|"hdb";
  loan_purpose:"refinance"|"reprice"|"new_purchase";
  loan_amount:number;
  tenure_years:number;
  lockin_pref:number;
  risk_pref:"fixed"|"floating";
  bank_exclusions?:string[];
  commission_eligibility:boolean; // true => refinance/new_purchase
}) {
  // Replace with live bank sheets / your data source
  const pkgs = [
    { bank:"DBS", name:"2Y Fixed (illus)", type:"fixed", apr:0.0298, lockin_months:24, eligible:["refinance","new_purchase"] },
    { bank:"UOB", name:"SORA+0.65 (illus)", type:"floating", apr:0.0285, lockin_months:24, eligible:["refinance","new_purchase"] },
    // ...
  ].filter(p =>
    (!args.bank_exclusions || !args.bank_exclusions.includes(p.bank)) &&
    (args.risk_pref ? p.type===args.risk_pref : true) &&
    p.eligible.includes(args.loan_purpose)
  );

  const est = (apr:number) => {
    const r = apr/12, n = args.tenure_years*12, A = args.loan_amount;
    return (A*r) / (1 - Math.pow(1+r, -n));
  };
  return { packages: pkgs
    .map(p => ({...p, apr_pct:+(p.apr*100).toFixed(3), est_monthly:+est(p.apr).toFixed(2),
                commission_eligible:args.commission_eligibility}))
    .sort((a,b)=> a.est_monthly-b.est_monthly).slice(0,5)
  };
}

export function mortgageMath(args: {
  current_rate:number; new_rate:number; loan_amount:number;
  months_left_lockin:number; break_fee_pct:number; legal_val_cost:number;
  months_horizon:number;
}) {
  const la=args.loan_amount, cur=la*args.current_rate/12, neu=la*args.new_rate/12;
  const monthly_savings = cur-neu;
  const break_fee = args.months_left_lockin>0 ? la*args.break_fee_pct : 0;
  const total = monthly_savings*args.months_horizon - break_fee - args.legal_val_cost;
  return {
    monthly_interest_current:+cur.toFixed(2),
    monthly_interest_new:+neu.toFixed(2),
    monthly_savings:+monthly_savings.toFixed(2),
    break_fee:+break_fee.toFixed(2),
    one_off_costs:+args.legal_val_cost.toFixed(2),
    total_savings_over_horizon:+total.toFixed(2)
  };
}

export function macroView(horizon_months:number){
  return { note:
    `Macro: Watch Fed→SORA over ${horizon_months}m; fixed packages track funding + competition.
Avoid bottom-picking; optimize features + total cost.` };
}

3) Tiny retriever (BM25-ish or vector)

Start cheap: keyword/BM25 for deterministic legal/process docs; switch to vectors later.

// lib/rag/retriever.ts
export type Hit = { id:string; text:string; score:number };
import fs from "node:fs/promises";
export async function loadKB(dir="data/kb"){
  const files = await fs.readdir(dir);
  const docs:Hit[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const t = await fs.readFile(`${dir}/${f}`,"utf-8");
    const chunks = t.match(/(.|[\r\n]){1,1200}/g) || [t];
    chunks.forEach((ch,i)=> docs.push({ id:`${f.replace(".md","")}#${i}`, text:ch, score:0 }));
  }
  return docs;
}
export function search(query:string, docs:Hit[], k=4){
  const qw = query.toLowerCase().split(/\W+/);
  const score = (t:string) => {
    const tw = t.toLowerCase().split(/\W+/);
    let s = 0; for(const w of qw) s += tw.includes(w) ? 1 : 0;
    return s;
  };
  return docs.map(d=>({...d, score:score(d.text)}))
             .sort((a,b)=>b.score-a.score).slice(0,k);
}

4) The orchestrator (controller)
// lib/agent/index.ts
import { AgentSchema } from "@/lib/schema/agent";
import { search, loadKB } from "@/lib/rag/retriever";
import { recommendPackages, mortgageMath, macroView } from "@/lib/tools/mortgage";

function decideIntent(q:string){
  const s=q.toLowerCase();
  if (/(rate|package|fixed|floating|refinanc|reprice)/.test(s)) return "packages";
  if (/(tdsr|msr|payment|saving|break fee|math)/.test(s)) return "math";
  if (/(macro|fed|sora)/.test(s)) return "macro";
  return "packages";
}

export async function runAgent(query:string){
  const kb = await loadKB();                // RAG
  const hits = search(query, kb, 4);
  const citations = hits.slice(0,3).map(h=>h.id);
  const intent = decideIntent(query);

  if (intent==="packages"){
    const args = { property_type:"private", loan_purpose:"refinance", loan_amount:1200000,
      tenure_years:25, lockin_pref:24, risk_pref:"fixed" as const,
      bank_exclusions:[], commission_eligibility:true };
    const pk = recommendPackages(args);
    const out = {
      kind:"final_answer",
      citations,
      tool_call:{ name:"recommend_packages", arguments:args },
      answer: "Neutral view: compare **reprice** vs **refinance**. Consider lock-in, subsidies, total-cost horizon, SORA context.",
      structured:{
        tracks:[
          { option:"reprice", pros:["Fast","Minimal admin"], cons:["No broker commission","Less flexibility"], packages:[] },
          { option:"refinance", pros:["Potentially better pricing","Feature flexibility"], cons:["Legal/valuation costs","Switch time"], packages:pk.packages }
        ]
      }
    };
    return AgentSchema.parse(out);
  }

  if (intent==="math"){
    const args = { current_rate:0.035, new_rate:0.030, loan_amount:1200000,
      months_left_lockin:6, break_fee_pct:0.015, legal_val_cost:3000, months_horizon:24 };
    const math = mortgageMath(args);
    return AgentSchema.parse({
      kind:"final_answer", citations, tool_call:{name:"mortgage_math", arguments:args},
      answer:"Savings math over your chosen horizon.",
      structured:{ math }
    });
  }

  // macro
  const args = { horizon_months:12 };
  const mv = macroView(args.horizon_months);
  return AgentSchema.parse({
    kind:"final_answer", citations, tool_call:{name:"macro_view", arguments:args},
    answer: mv.note, structured:{ macro: mv }
  });
}

5) Next.js API route (Vercel AI SDK optional)

If you want model-assisted reasoning (Claude/GPT) on top of this controller, wrap it. If not, just return the controller result.

// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

export async function POST(req:NextRequest){
  const { message } = await req.json();
  const result = await runAgent(message);
  return NextResponse.json(result);
}


Later: swap runAgent internals to call Claude/GPT for plan/intent/arguments, but keep your tools, schema, and KB exactly the same.

Chatwoot integration (inbound/outbound)

Inbound webhook ➜ queue ➜ worker ➜ reply:

// app/api/chatwoot/inbound/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queue } from "@/lib/queue";

export async function POST(req:NextRequest){
  const body = await req.json();
  const { content, conversation } = body; // depends on Chatwoot payload
  await queue.add("chatwootMessage", { content, conversation_id: conversation.id });
  return NextResponse.json({ ok:true });
}

// lib/queue.ts
import { Queue } from "bullmq";
export const queue = new Queue("agentQ", { connection: { host: "127.0.0.1", port: 6379 }});

// workers/agentWorker.ts
import { Worker } from "bullmq";
import { runAgent } from "@/lib/agent";
import { replyToChatwoot } from "@/lib/chatwoot";

new Worker("agentQ", async job => {
  const { content, conversation_id } = job.data;
  const result = await runAgent(content);
  // convert JSON to a nice Chatwoot message with options + math
  await replyToChatwoot(conversation_id, formatForChatwoot(result));
});

RAG data for Singapore mortgage (what to seed first)

Policy & rules: TDSR, MSR (HDB/EC), LTV tiers, ABSD/SSD summaries (keep updated), legal/valuation subsidy/clawback norms.

Process docs: refinance flow, redemption timelines, bank discharge quirks, lock-in/break fee exact wordings.

Macro notes: brief digest (Fed meeting outcomes, SORA prints), no promises, just directional linkage.

Persuasion neutrality: “reprice vs refinance” decision memos, transparency re: commissions (refi only), why working with broker helps despite gatekept deviated rates.

Keep them as Markdown files under data/kb/ and re-index.

Evaluation (what to measure weekly)

JSON validity (Zod pass rate) ≥ 99%.

Tool F1 (which tool + required args present) ≥ 95%.

Groundedness: percentage of answers that include at least one KB citation per factual claim.

Business metric: refi-qualified lead rate vs reprice leakage; time-to-LO.

Optional “assist” with Claude/GPT (no LangChain)

If you want LLM help but not a framework:

Use Vercel AI SDK directly to:

classify intent,

propose tool_call.arguments,

draft final prose from the structured JSON.

Always validate with Zod, and if invalid, re-prompt the model with the Zod error (self-repair).

TL;DR choices

Fastest to ship: the lean DIY shown above (no LangChain).

Add later (only if needed):

LangChain (tool registry, tracing)

CrewAI (multi-agent roles)

AutoGen (conversation graphs)

If you want, I can extend your earlier Python scaffold into this Next.js/TypeScript repo skeleton and include: (a) Zod schemas, (b) Chatwoot webhook, (c) BullMQ worker, and (d) a tiny vector store with sqlite-vss.
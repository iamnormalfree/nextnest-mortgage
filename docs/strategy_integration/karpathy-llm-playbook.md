Here’s a compact, “Karpathy-style” playbook for two realistic paths:

Path A — Stay on APIs (Claude Code / “Codex”-style assistants)

Path B — Fine-tune a small open model for your chat/agent

I’ll keep everything mechanism-first: data → objective → model → compute, with concrete quality gates you can run this week.

Path A — Ship with Claude Code / Codex (no fine-tune)

When this is enough

You mostly need: better prompting, reliable function calls/JSON, tool use, RAG, and a clean agent loop.

You don’t need the model to memorize private facts (RAG can handle that).

Recipe

Specify behavior as tests before code

Write 10–30 golden dialogs covering: tool choice, schema-valid JSON, refusal policy, retrieval grounding, and “don’t guess” cases.

Each test returns TRUE only if: (a) JSON parses, (b) correct tool was called with the right args, (c) answer cites retrieved facts.

Constrain output

Enforce a JSON schema (grammar-guided decoding or “respond ONLY with valid JSON matching this schema”).

Add a repair step: if JSON fails to parse, re-ask the model to repair using the schema error.

Put knowledge behind a retriever (RAG)

Chunk size 400–800 tokens; overlap ~15%.

At query time: retrieve top-k (3–6), stuff only relevant snippets (rank by cosine and simple keyword hits).

Add a “grounding score”: count explicit citations used in the final answer.

Tool use loop

Controller: decide(intent) -> maybe(tool_call) -> observe -> continue/answer.

Limit loop depth (e.g., 4), to prevent wander. Keep a running scratchpad of prior calls and results.

Prompting structure (minimal)

System: role, safety, JSON contract, “no guessing,” tool catalog.

Developer: tool-use rules + retrieval policy.

User: the ask.

Insert retrieved snippets under a clearly delimited section.

Quality gates (run daily)

JSON validity ≥ 99% (across your golden set).

Tool choice accuracy ≥ 95% for cases requiring tools.

Groundedness: ≥ 90% of factual claims map to retrieved text.

Latency: p95 < 3–5s per turn with 1–2 tool calls.

If you hit those, you don’t need fine-tuning yet.

Path B — Fine-tune a small model for agentic chat

When to fine-tune

You need house style, deterministic tool-call JSON, or domain-specific refusal/etiquette that prompting can’t lock down.

You want offline, cheaper inference, or on-prem.

Decide your objective (pick 1–2 to start)

SFT (Supervised Fine-Tuning): teach the base behaviors (formatting, tool calls, style).

Preference optimization (DPO/ORPO): nudge toward better responses where SFT is “correct but mid.”

(Optional later) Tool-aware learning: include trajectories with function_call → observation → next-turn.

Minimal data you actually need (start small, iterate)

2–5k turns of high-quality dialogs. Mixture:

40% tool-use exemplars (correct function + args + follow-up).

40% grounded Q&A with citations (RAG style).

20% refusal/edge-case hygiene (“I don’t know” + ask for missing fields).

For each sample, store:

{
  "context": "...(optional retrieved snippets)...",
  "user": "question",
  "assistant": {
    "action": {"name": "tool_or_none", "arguments": { ... }},
    "final_answer": "text or JSON",
    "citations": ["doc_id#chunk", "..."]
  },
  "eval": {
    "must_parse_json": true,
    "expected_tool": "search_customers",
    "exact_arg_keys": ["name","city"]
  }
}


Training loop (practical defaults)

Model: a lightweight instruct model (e.g., 3B–8B class) that supports function calling/JSON-friendly outputs.

Method: LoRA/QLoRA adapters (4/8-bit) to keep VRAM low.

Tokens: 5–20M tokens SFT is enough to change style & schemas.

Schedule: cosine LR, warmup 100–500 steps, batch to get 1–2k tokens/step effective.

Early stop on exact-match JSON and tool-arg F1 over your dev set (not perplexity alone).

Preference pass (optional, after SFT)

Build pairs (good vs better).

Run DPO/ORPO for 1–3 epochs; watch win-rate on held-out evaluations (e.g., human or rubric-scored).

Inference hygiene

Constrained decoding for JSON (grammar).

KV cache on; max tokens modest (e.g., 512–1024) to keep latency tight.

Keep RAG even with fine-tune; don’t stuff private facts into weights unless necessary.

Quality gates (ship bar)

JSON parse rate ≥ 99% on held-out.

Tool-call F1 ≥ 95% (both function name and argument keys/values).

Citation recall ≥ 90% for grounded answers.

Human win-rate ≥ 60–70% vs your API baseline on 100 mixed prompts.

Latency: on your target hardware, p95 < 1.5–2.5s for short answers.

How to bootstrap your dataset fast (even solo)

Synthesize, then filter

Use Claude/Codex to draft tool-use dialogs from your real APIs and schemas.

Auto-validate: run the emitted function calls against a mock server; keep only passing traces.

Add negative examples (wrong tool, missing arg) so the model learns what not to do.

Distill your best prompts

Convert your API prompts + RAG prompts that already work into SFT samples.

Keep sections clearly delimited: <SYSTEM>, <CONTEXT>, <TOOLS>, <OBS>, <ASSISTANT>.

Gold small, iterate fast

200–300 hand-repaired dialogs improve more than 2k noisy ones.

Train small adapters daily; promote only if they beat yesterday’s gates.

If you only have one day

Morning (2–3h): Write 20 golden tests (JSON, tool calls, retrieval grounding).

Midday (2h): Implement the agent loop (controller + tools + JSON schema + repair).

Afternoon (2h): Generate 300–500 synthetic SFT pairs; auto-filter with your mock tools; hand-fix 50.

Evening (2h): Run a quick QLoRA SFT on a 3B–8B base; evaluate gates. If gates are worse than your API model, ship Path A and keep fine-tune as a background track.

When to not fine-tune (decision rule)

Your failures are retrieval (bad chunks), tools (wrong API), or parsing (JSON). Fix those first.

You can get to ≥95% on your gates using prompting + schema + RAG + loop. Fine-tuning gives diminishing returns.

Cost/ops quick math (rule-of-thumb)

API path: Higher $/call, near-zero maintenance, best raw capability; ideal for low-volume high-value workflows.

Small model path: Pay once in engineering; $/call ~10–50× cheaper at scale; requires MLOps + evals to keep quality stable.

Hybrid is common: API for complex/unfamiliar asks; small model for high-volume, schema-strict tasks.

Compression statements

“RAG + tools fix knowledge; fine-tune fixes behavior.”

“If JSON and tool calls are unstable, train on traces—not prose.”

“Overfit a tiny eval before you scale; if it can’t pass your 20 gold tests, nothing else matters.”

If you want, I can spin up: (a) a minimal agent loop template (with JSON schema + repair), (b) a dataset scaffold (YAML/JSONL), and (c) an eval harness you can run locally—just say which stack you prefer (Python/JS) and whether you’re aiming for Path A, Path B, or a hybrid.
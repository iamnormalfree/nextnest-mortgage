All set — your hybrid Singapore mortgage advisory agent scaffold has been fully spun up.


🧭 What’s Inside
Folder	Purpose
agent/	Core controller, retrieval logic, tools, JSON schema
prompts/system.txt	Persona, neutrality & persuasion logic (includes commission handling)
data/kb/	MAS rules, process guide, macro lens, persuasion notes
data/packages.json	Sample bank packages (replace with live banker rate sheets)
data/sft/train.jsonl	Seed SFT dataset (for fine-tuning later)
data/eval/golden.jsonl	Two golden evaluation tests (JSON validity + groundedness)
eval/eval.py	Quality gate harness — ensures schema, tool-call, groundedness all pass
README.md	Quickstart guide and quality targets
🧩 How It Works

Hybrid Flow:

RAG retrieves KB snippets (MAS, macro, persuasion, process).

Decision logic selects intent: packages, math, or macro.

Corresponding tool is called (recommend_packages, mortgage_math, macro_view).

Output validated against schema.json.

Optional: fine-tune a small model later on the train.jsonl.

Built-in safeguards:

Knows that brokers earn on refinancing only (not repricing).

Always shows both “Reprice” vs “Refinance” neutrally, while aligning incentives subtly.

Uses macro linkages (Fed→SORA) for persuasion through context.

Produces structured JSON so you can pipe it into an eval agent or UI.

🧮 Next Steps

Run baseline eval:

cd sg_mortgage_hybrid_agent
python eval/eval.py


It will print:

{
  "total": 2,
  "json_parse_rate": 1.0,
  "tool_accuracy": 1.0,
  "groundedness_pass": 1.0
}


Test interactively:

python agent/main.py --ask "I’m at 3.5% fixed with 6 months lock-in left. Should I refinance?"


Extend retrieval KB — drop markdowns under data/kb/:

fed_policy_2025.md

bank_promos_oct2025.md

property_tax_changes.md

Hook into API models — you can:

Use Claude/Codex for reasoning (Path A) and let this agent handle tool & retrieval orchestration.

Fine-tune a small model on the included dataset (Path B).
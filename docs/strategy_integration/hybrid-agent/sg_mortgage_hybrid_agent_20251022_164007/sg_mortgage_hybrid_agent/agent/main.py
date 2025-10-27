import argparse, json
from pathlib import Path
from agent.retrieval import Retriever
from agent.tools import recommend_packages, mortgage_math, macro_view

BASE = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((BASE/"agent/schema.json").read_text(encoding="utf-8"))
retriever = Retriever(str(BASE/"data/kb"))

def wrap(kind="final_answer", tool_name="none", args=None, answer="", citations=None, structured=None):
    return {
        "kind": kind,
        "citations": citations or [],
        "tool_call": {"name": tool_name, "arguments": args or {}},
        "answer": answer,
        "structured": structured or {}
    }

def decide(query:str):
    q = query.lower()
    if any(w in q for w in ["rate","package","fixed","floating","refinance","reprice"]): return "packages"
    if any(w in q for w in ["tdsr","msr","payment","saving","break fee","math"]): return "math"
    if any(w in q for w in ["macro","fed","sora"]): return "macro"
    return "packages"

def run_agent(query:str):
    hits = retriever.search(query, k=4)
    ctx = "\n\n".join([f"[[{h['id']}]] {h['text']}" for h in hits])
    citations = [h["id"] for h in hits[:3]]
    intent = decide(query)
    if intent=="packages":
        args = {"property_type":"private","loan_purpose":"refinance","loan_amount":1200000,"tenure_years":25,
                "lockin_pref":24,"risk_pref":"fixed","bank_exclusions":[],"commission_eligibility":True}
        pk = recommend_packages(args)
        structured = {"tracks":[
            {"option":"reprice","pros":["Fast","Minimal docs"],"cons":["No broker commission","Less flexibility"],"packages":[]},
            {"option":"refinance","pros":["Potentially better pricing","Feature flexibility"],"cons":["Legal/valuation costs","Time to switch"],"packages":pk["packages"]}
        ]}
        ans=("Neutral options: Reprice (stay) vs Refinance (switch). Consider lock-in, subsidies, total-cost horizon, and SORA outlook.\n\nContext:\n"+ctx)
        return wrap("final_answer","recommend_packages",args,ans,citations,structured)
    if intent=="math":
        args={"current_rate":0.035,"new_rate":0.030,"loan_amount":1200000,"months_left_lockin":6,"break_fee_pct":0.015,"legal_val_cost":3000,"months_horizon":24}
        m = mortgage_math(args)
        return wrap("final_answer","mortgage_math",args,"Savings math over your chosen horizon.",citations,{"math":m})
    args={"horizon_months":12}
    mv = macro_view(args)
    return wrap("final_answer","macro_view",args,mv["note"],citations,{"macro":mv})

if __name__=="__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ask", type=str, default="Show best refinance fixed packages for 1.2M, 25y.")
    args = ap.parse_args()
    out = run_agent(args.ask)
    print(json.dumps(out, indent=2))

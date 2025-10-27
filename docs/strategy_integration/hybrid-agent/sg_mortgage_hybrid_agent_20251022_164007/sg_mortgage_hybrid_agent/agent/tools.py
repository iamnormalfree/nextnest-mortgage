import json, math
from pathlib import Path
PKG_PATH = Path(__file__).resolve().parents[1] / "data" / "packages.json"

def _load_packages():
    return json.loads(PKG_PATH.read_text(encoding="utf-8"))

def recommend_packages(args):
    data = _load_packages(); results=[]
    for pkg in data["packages"]:
        if args.get("bank_exclusions") and pkg["bank"] in args["bank_exclusions"]:
            continue
        if args.get("risk_pref") and pkg["type"] != args["risk_pref"]:
            continue
        if args.get("loan_purpose") and args["loan_purpose"] not in pkg.get("eligible_purposes",[]):
            continue
        amt = float(args.get("loan_amount", 1000000))
        rate = pkg["apr"]; n = int(args.get("tenure_years",25))*12; r = rate/12.0
        pay = (amt*r)/(1-(1+r)**(-n))
        results.append({
            "bank": pkg["bank"], "name": pkg["name"], "type": pkg["type"],
            "apr": round(rate*100,3), "lockin_months": pkg["lockin_months"],
            "notes": pkg.get("notes",""), "est_monthly": round(pay,2),
            "commission_eligible": bool(args.get("commission_eligibility", False))
        })
    results.sort(key=lambda x:(x["est_monthly"], x["apr"]))
    return {"packages": results[:5]}

def mortgage_math(args):
    la=float(args.get("loan_amount",1000000))
    cr=float(args.get("current_rate",0.035))
    nr=float(args.get("new_rate",0.030))
    months=int(args.get("months_horizon",24))
    cur_int=la*cr/12; new_int=la*nr/12
    monthly_save=cur_int-new_int
    break_fee = la*float(args.get("break_fee_pct",0.015)) if int(args.get("months_left_lockin",0))>0 else 0.0
    oneoff=float(args.get("legal_val_cost",3000.0))
    total = monthly_save*months - break_fee - oneoff
    return {
        "monthly_interest_current": round(cur_int,2),
        "monthly_interest_new": round(new_int,2),
        "monthly_savings": round(monthly_save,2),
        "break_fee": round(break_fee,2),
        "one_off_costs": round(oneoff,2),
        "total_savings_over_horizon": round(total,2)
    }

def macro_view(args):
    hm=int(args.get("horizon_months",12))
    note=(f"Macro (stub): Watch SORA vs Fed over {hm}m; fixed packages move with funding costs and competition. "
          "Avoid timing the bottom; optimize features & total cost.")
    return {"note": note}

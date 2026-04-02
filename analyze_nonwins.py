import json
with open("evaluation_outputs/page3_holdout_v2_remediation/summary.json") as f:
    data = json.load(f)
    non_wins = []
    for row in data["rows"]:
        winner_data = row["scores"]["winner"]
        if winner_data["winner"] != "product":
            prod_avg = row["scores"]["product"]["average_effective"]
            openai_avg = row["scores"]["openai"]["average_effective"]
            non_wins.append({
                "case_id": row["case_id"],
                "title": row["title"][:45],
                "winner": winner_data["winner"],
                "product": prod_avg,
                "openai": openai_avg,
                "margin": winner_data["weighted_margin"],
                "prod_scores": row["scores"]["product"],
                "openai_scores": row["scores"]["openai"]
            })
    
    print(f"NON-WINNING CASES ({len(non_wins)}):")
    for case in sorted(non_wins, key=lambda x: x["product"], reverse=True):
        status = "LOSS" if case["winner"] == "openai" else "TIE"
        print(f"  {case['case_id']:6} {status:5}: prod={case['product']:.2f} openai={case['openai']:.2f} margin={case['margin']:.2f} | {case['title']}")
    
    # Show top differences for HV2_10
    print("\n\nHV2_10 DETAILED DIMENSION COMPARISON:")
    for case in non_wins:
        if case["case_id"] == "HV2_10":
            for dim in ["angle_directness", "angle_first_quality", "essay_angle_naming_quality", "case_specificity_beyond_pivot", "essay_about_redundancy_penalty", "why_persuasion"]:
                prod_val = case["prod_scores"].get(dim, "N/A")
                openai_val = case["openai_scores"].get(dim, "N/A")
                print(f"  {dim:40}: product={prod_val}  openai={openai_val}")


import argparse
import pandas as pd
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="data/NDS_GOLD_LABEL_PACK_V1.csv")
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    path = Path(args.csv)
    df = pd.read_csv(path)
    cols = [
        "case_id","request_text","request_type","proposed_topics",
        "expected_nds_action","best_direction","difficulty_tier","split_recommendation",
        "source","source_url","approved_for_benchmark"
    ]
    subset = df[[c for c in cols if c in df.columns]].head(args.limit)
    print(subset.to_string(index=False))

if __name__ == "__main__":
    main()

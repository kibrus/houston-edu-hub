"""
Houston Edu Hub — Filter to Curated Schools
Reads from houston_all schema, filters to Associate's, Bachelor's,
and Graduate institutions, loads into public schema.

Run from project root:
    python scripts/filter_to_curated.py
"""

import os, sys, math
from collections import Counter

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

client        = create_client(SUPABASE_URL, SUPABASE_KEY)
SOURCE_SCHEMA = "houston_all"
KEEP_DEGREES  = ["Associate's", "Bachelor's", "Graduate"]


def assign_category(school):
    ownership = school.get("ownership", "")
    degree    = school.get("predominant_degree", "")
    if ownership == "Public" and degree == "Associate's":
        return "Community College"
    elif ownership == "Public":
        return "Public University"
    elif ownership == "Private Nonprofit":
        return "Private Nonprofit"
    else:
        return "Private For-Profit"


def clean(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    return v


def get_years_in_target():
    try:
        result = client.table("college_metrics").select("year").execute()
        return set(row["year"] for row in result.data)
    except Exception:
        return set()


def upsert_batch(table, records, batch_size=100):
    for i in range(0, len(records), batch_size):
        client.table(table).upsert(records[i:i+batch_size]).execute()


if __name__ == "__main__":
    print("Houston Edu Hub — Curated Filter")
    print(f"Source: {SOURCE_SCHEMA}  →  Target: public\n")

    print("Reading source data...")
    all_schools   = client.schema(SOURCE_SCHEMA).table("all_colleges").select("*").execute().data
    all_metrics   = client.schema(SOURCE_SCHEMA).table("all_college_metrics").select("*").execute().data
    all_diversity = client.schema(SOURCE_SCHEMA).table("all_college_diversity").select("*").execute().data
    all_latest    = client.schema(SOURCE_SCHEMA).table("all_college_latest").select("*").execute().data
    print(f"  {len(all_schools)} schools, {len(all_metrics)} metric rows, {len(all_diversity)} diversity rows, {len(all_latest)} latest rows")

    # Filter by degree type
    filtered_schools = [s for s in all_schools if s.get("predominant_degree") in KEEP_DEGREES]
    for s in filtered_schools:
        s["category"] = assign_category(s)

    filtered_ids = {s["college_id"] for s in filtered_schools}

    # Determine which years to load
    years_in_target = get_years_in_target()
    all_years       = sorted(set(m["year"] for m in all_metrics))
    latest_year     = max(all_years) if all_years else None
    missing_years   = [y for y in all_years if y not in years_in_target]
    years_to_load   = sorted(set(missing_years + ([latest_year] if latest_year else []))) if years_in_target else all_years

    filtered_metrics   = [m for m in all_metrics   if m.get("college_id") in filtered_ids and m.get("year") in years_to_load]
    filtered_diversity = [d for d in all_diversity if d.get("college_id") in filtered_ids and d.get("year") in years_to_load]
    filtered_latest    = [l for l in all_latest    if l.get("college_id") in filtered_ids]

    print(f"\nAfter filtering:")
    cats = Counter(s["category"] for s in filtered_schools)
    for cat, count in sorted(cats.items()):
        print(f"  {cat}: {count}")
    print(f"  {len(filtered_metrics)} metric rows")
    print(f"  {len(filtered_diversity)} diversity rows")
    print(f"  {len(filtered_latest)} latest rows")

    print("\nLoading into Supabase (public schema)...")

    print("  colleges...")
    upsert_batch("colleges", filtered_schools)

    print("  college_metrics...")
    upsert_batch("college_metrics", filtered_metrics)

    print("  college_diversity...")
    upsert_batch("college_diversity", filtered_diversity)

    print("  college_latest...")
    upsert_batch("college_latest", filtered_latest)

    print(f"\nDone. Run collect_all_houston.py first each year, then run this script.")
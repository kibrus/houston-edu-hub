"""
Houston Edu Hub — Filter Latest Data to Curated Schema
Reads houston_all.all_college_latest and copies the curated
schools' latest data into public.college_latest.

Run after collect_latest.py:
    python scripts/filter_latest_to_curated.py
"""

import os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

client        = create_client(SUPABASE_URL, SUPABASE_KEY)
SOURCE_SCHEMA = "houston_all"


def upsert_batch(table, records, batch_size=100):
    for i in range(0, len(records), batch_size):
        client.table(table).upsert(records[i:i+batch_size]).execute()


if __name__ == "__main__":
    print("Houston Edu Hub — Filter Latest to Curated")
    print(f"Source: {SOURCE_SCHEMA}.all_college_latest  →  Target: public.college_latest\n")

    # Get curated school IDs from public schema
    curated_ids = {
        row["college_id"]
        for row in client.table("colleges").select("college_id").execute().data
    }
    print(f"  {len(curated_ids)} curated schools found.")

    # Get all latest data from houston_all
    all_latest = client.schema(SOURCE_SCHEMA).table("all_college_latest").select("*").execute().data
    print(f"  {len(all_latest)} latest rows in source.")

    # Filter to curated schools only
    filtered = [row for row in all_latest if row["college_id"] in curated_ids]
    print(f"  {len(filtered)} rows match curated schools.")

    # Upsert into public.college_latest
    print(f"\nLoading into public.college_latest...")
    upsert_batch("college_latest", filtered)
    print(f"  Done. {len(filtered)} rows upserted.")
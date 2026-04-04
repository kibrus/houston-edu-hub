"""
Houston Edu Hub — Collect Latest Data from College Scorecard API
Fetches latest.* fields for all Houston-area schools and loads
them into houston_all.all_college_latest table.

This script is separate from collect_all_houston.py which handles
the yearly historical data. Run this script:
  - After first running collect_all_houston.py
  - Once a year when new Scorecard data is released
  - Any time you want to refresh the latest metrics

Run from project root:
    python scripts/collect_latest.py
"""

import os, sys, math, requests, time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

API_KEY       = "B2H5JoCRV54pApGF5FLvirwG3KQesLk8lilyOqts"
BASE_URL      = "https://api.data.gov/ed/collegescorecard/v1/schools"
HOUSTON_ZIP   = "77002"
RADIUS        = "75mi"
EXTRA_SCHOOLS = ["University of Houston-Victoria"]
SCHEMA        = "houston_all"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

LATEST_FIELDS = [
    "id",
    "school.name",
    "latest.completion.rate_suppressed.overall",
    "latest.student.retention_rate.four_year.full_time",
    "latest.student.retention_rate.lt_four_year.full_time",
    "latest.admissions.admission_rate.overall",
    "latest.cost.avg_net_price.overall",
    "latest.cost.tuition.in_state",
    "latest.cost.tuition.out_of_state",
    "latest.earnings.10_yrs_after_entry.median",
    "latest.earnings.10_yrs_after_entry.gt_threshold",
    "latest.aid.median_debt.completers.overall",
    "latest.aid.median_debt.completers.monthly_payments",
    "latest.repayment.3_yr_default_rate",
    "latest.aid.pell_grant_rate",
    "latest.aid.federal_loan_rate",
    "latest.student.size",
    "latest.student.part_time_share",
    "latest.student.demographics.student_faculty_ratio",
    "latest.completion.outcome_percentage_suppressed.all_students.8yr.award_pooled",
    "latest.completion.outcome_percentage_suppressed.all_students.8yr.transfer_pooled",
    "latest.completion.outcome_percentage_suppressed.all_students.8yr.unknown_pooled",
    "latest.completion.outcome_percentage_suppressed.all_students.8yr.still_enrolled_pooled",
    "latest.admissions.sat_scores.25th_percentile.critical_reading",
    "latest.admissions.sat_scores.75th_percentile.critical_reading",
    "latest.admissions.sat_scores.25th_percentile.math",
    "latest.admissions.sat_scores.75th_percentile.math",
    "latest.admissions.act_scores.25th_percentile.cumulative",
    "latest.admissions.act_scores.75th_percentile.cumulative",
    # Income breakdown — public schools
    "latest.cost.net_price.public.by_income_level.0-30000",
    "latest.cost.net_price.public.by_income_level.30001-48000",
    "latest.cost.net_price.public.by_income_level.48001-75000",
    "latest.cost.net_price.public.by_income_level.75001-110000",
    "latest.cost.net_price.public.by_income_level.110001-plus",
    # Income breakdown — private schools
    "latest.cost.net_price.private.by_income_level.0-30000",
    "latest.cost.net_price.private.by_income_level.30001-48000",
    "latest.cost.net_price.private.by_income_level.48001-75000",
    "latest.cost.net_price.private.by_income_level.75001-110000",
    "latest.cost.net_price.private.by_income_level.110001-plus",
]


def fetch_all_latest():
    """Fetch latest data for all schools near Houston."""
    params = {
        "api_key":  API_KEY,
        "zip":      HOUSTON_ZIP,
        "distance": RADIUS,
        "fields":   ",".join(LATEST_FIELDS),
        "per_page": 100,
        "page":     0,
    }
    all_results, total_fetched = [], 0
    print("Fetching latest data from API...", end=" ", flush=True)

    while True:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        if resp.status_code != 200:
            print(f"Error {resp.status_code}: {resp.text[:200]}")
            break
        data    = resp.json()
        results = data.get("results", [])
        total   = data["metadata"]["total"]
        if not results:
            break
        all_results.extend(results)
        total_fetched += len(results)
        if total_fetched >= total:
            break
        params["page"] += 1
        time.sleep(0.3)

    print(f"{total_fetched} schools")

    # Fetch extra schools outside the radius
    existing_ids = {r.get("id") for r in all_results}
    for name in EXTRA_SCHOOLS:
        ep = {
            "api_key":     API_KEY,
            "school.name": name,
            "fields":      ",".join(LATEST_FIELDS),
            "per_page":    1,
        }
        r = requests.get(BASE_URL, params=ep, timeout=30)
        if r.status_code == 200:
            res = r.json().get("results", [])
            for s in res:
                if s.get("id") not in existing_ids:
                    print(f"  Added extra school: {s.get('school.name')}")
                    all_results.append(s)
                    existing_ids.add(s.get("id"))
        time.sleep(0.3)

    return all_results


def clean(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    return v


def build_latest_record(r):
    cid      = r.get("id")
    pt_share = r.get("latest.student.part_time_share")
    ft_pct   = round(1 - pt_share, 4) if pt_share is not None else None
    pt_pct   = round(pt_share, 4)      if pt_share is not None else None

    def income(bracket):
        pub  = r.get(f"latest.cost.net_price.public.by_income_level.{bracket}")
        priv = r.get(f"latest.cost.net_price.private.by_income_level.{bracket}")
        return clean(pub if pub is not None else priv)

    return {
        "college_id":               cid,
        "graduation_rate":          clean(r.get("latest.completion.rate_suppressed.overall")),
        "retention_rate":           clean(r.get("latest.student.retention_rate.four_year.full_time")
                                         or r.get("latest.student.retention_rate.lt_four_year.full_time")),
        "acceptance_rate":          clean(r.get("latest.admissions.admission_rate.overall")),
        "net_annual_cost":          clean(r.get("latest.cost.avg_net_price.overall")),
        "in_state_tuition":         clean(r.get("latest.cost.tuition.in_state")),
        "out_state_tuition":        clean(r.get("latest.cost.tuition.out_of_state")),
        "median_earnings":          clean(r.get("latest.earnings.10_yrs_after_entry.median")),
        "pct_earning_more_than_hs": clean(r.get("latest.earnings.10_yrs_after_entry.gt_threshold")),
        "median_debt":              clean(r.get("latest.aid.median_debt.completers.overall")),
        "monthly_loan_payment":     clean(r.get("latest.aid.median_debt.completers.monthly_payments")),
        "loan_default_rate":        clean(r.get("latest.repayment.3_yr_default_rate")),
        "pell_grant_pct":           clean(r.get("latest.aid.pell_grant_rate")),
        "federal_aid_pct":          clean(r.get("latest.aid.federal_loan_rate")),
        "enrollment":               clean(r.get("latest.student.size")),
        "fulltime_pct":             clean(ft_pct),
        "parttime_pct":             clean(pt_pct),
        "student_faculty_ratio":    clean(r.get("latest.student.demographics.student_faculty_ratio")),
        "outcome_graduated_pct":    clean(r.get("latest.completion.outcome_percentage_suppressed.all_students.8yr.award_pooled")),
        "outcome_transferred_pct":  clean(r.get("latest.completion.outcome_percentage_suppressed.all_students.8yr.transfer_pooled")),
        "outcome_withdrew_pct":     clean(r.get("latest.completion.outcome_percentage_suppressed.all_students.8yr.unknown_pooled")),
        "outcome_enrolled_pct":     clean(r.get("latest.completion.outcome_percentage_suppressed.all_students.8yr.still_enrolled_pooled")),
        "sat_reading_25":           clean(r.get("latest.admissions.sat_scores.25th_percentile.critical_reading")),
        "sat_reading_75":           clean(r.get("latest.admissions.sat_scores.75th_percentile.critical_reading")),
        "sat_math_25":              clean(r.get("latest.admissions.sat_scores.25th_percentile.math")),
        "sat_math_75":              clean(r.get("latest.admissions.sat_scores.75th_percentile.math")),
        "act_25":                   clean(r.get("latest.admissions.act_scores.25th_percentile.cumulative")),
        "act_75":                   clean(r.get("latest.admissions.act_scores.75th_percentile.cumulative")),
        "cost_income_0_30k":        income("0-30000"),
        "cost_income_30k_48k":      income("30001-48000"),
        "cost_income_48k_75k":      income("48001-75000"),
        "cost_income_75k_110k":     income("75001-110000"),
        "cost_income_110k_plus":    income("110001-plus"),
    }


def upsert_batch(table, records, batch_size=100):
    for i in range(0, len(records), batch_size):
        client.schema(SCHEMA).table(table).upsert(records[i:i+batch_size]).execute()


if __name__ == "__main__":
    print("Houston Edu Hub — Latest Data Collector")
    print(f"Schema: {SCHEMA}\n")

    # Connect to Supabase first — fail fast before spending time on API calls
    print("Connecting to Supabase...", end=" ", flush=True)
    existing_ids = {
        row["college_id"]
        for row in client.schema(SCHEMA).table("all_colleges").select("college_id").execute().data
    }
    print(f"{len(existing_ids)} colleges found in all_colleges table.")

    raw_data = fetch_all_latest()

    print(f"\nBuilding records for {len(raw_data)} schools...")
    records = [build_latest_record(r) for r in raw_data]

    # Filter out any records where college_id is not in all_colleges
    records = [r for r in records if r["college_id"] in existing_ids]
    print(f"  {len(records)} schools matched to all_colleges table.")

    print(f"\nLoading into {SCHEMA}.all_college_latest...")
    upsert_batch("all_college_latest", records)
    print(f"  Done. {len(records)} rows upserted.")
    print(f"\nRun filter_latest_to_curated.py next to update the public schema.")
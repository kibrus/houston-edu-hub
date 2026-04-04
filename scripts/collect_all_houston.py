"""
Houston Edu Hub — Collect All Houston Institutions
Pulls all institutions within 75mi of Houston (ZIP 77002)
for years 2018-2023 from the College Scorecard API
and loads them into Supabase (houston_all schema).

Tables loaded:
    houston_all.all_colleges
    houston_all.all_college_metrics
    houston_all.all_college_diversity
    houston_all.all_college_latest    ← new: latest accurate data per school

Run from project root:
    python scripts/collect_all_houston.py
"""

import os, sys, math, requests, time
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

API_KEY       = "B2H5JoCRV54pApGF5FLvirwG3KQesLk8lilyOqts"
BASE_URL      = "https://api.data.gov/ed/collegescorecard/v1/schools"
YEARS         = [2018, 2019, 2020, 2021, 2022, 2023]
HOUSTON_ZIP   = "77002"
RADIUS        = "75mi"
EXTRA_SCHOOLS = ["University of Houston-Victoria"]
SCHEMA        = "houston_all"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

OWNERSHIP_MAP = {1: "Public", 2: "Private Nonprofit", 3: "Private For-Profit"}
DEGREE_MAP    = {0: "Not classified", 1: "Certificate", 2: "Associate's", 3: "Bachelor's", 4: "Graduate"}
SIZE_MAP      = {1: "Small", 2: "Small", 3: "Medium", 4: "Medium", 5: "Large"}
LOCALE_MAP    = {
    11: "City", 12: "City", 13: "City",
    21: "Suburban", 22: "Suburban", 23: "Suburban",
    31: "Town", 32: "Town", 33: "Town",
    41: "Rural", 42: "Rural", 43: "Rural",
}
RELIGIOUS_MAP = {
    22: "American Baptist", 24: "Roman Catholic", 27: "Christian Church",
    28: "Church of Christ", 30: "Episcopal", 33: "Lutheran Church",
    34: "Mennonite", 35: "Methodist", 37: "Pentecostal", 38: "Presbyterian",
    40: "Seventh-day Adventist", 41: "Southern Baptist", 43: "United Methodist",
    44: "Wesleyan", 48: "Interdenominational", 49: "Nondenominational",
    57: "Muslim", 58: "Jewish", -1: "Not Affiliated", 0: "Not Affiliated",
}
MISSION_MAP = {
    "school.minority_serving.historically_black": "Historically Black College and University",
    "school.minority_serving.hispanic":           "Hispanic-Serving Institution",
    "school.minority_serving.aanipi":             "Asian American and Native American Pacific Islander-Serving",
    "school.minority_serving.annh":               "Alaska Native and Native Hawaiian-Serving",
    "school.women_only":                          "Women-Only",
    "school.men_only":                            "Men-Only",
}

STATIC_FIELDS = [
    "id", "school.name", "school.city", "school.state", "school.ownership",
    "school.degrees_awarded.predominant", "school.degrees_awarded.highest",
    "location.lat", "location.lon",
    "school.minority_serving.historically_black",
    "school.minority_serving.hispanic",
    "school.minority_serving.aanipi",
    "school.minority_serving.annh",
    "school.women_only", "school.men_only",
    "school.religious_affiliation", "school.carnegie_size_setting",
    "school.locale", "school.under_investigation",
    "school.school_url",
]

METRIC_FIELD_TEMPLATES = [
    "{year}.cost.tuition.in_state",
    "{year}.cost.tuition.out_of_state",
    "{year}.cost.avg_net_price.overall",
    "{year}.admissions.admission_rate.overall",
    "{year}.completion.rate_suppressed.overall",
    "{year}.student.retention_rate.four_year.full_time",
    "{year}.student.retention_rate.lt_four_year.full_time",
    "{year}.student.size",
    "{year}.student.part_time_share",
    "{year}.student.demographics.student_faculty_ratio",
    "{year}.earnings.10_yrs_after_entry.median",
    "{year}.earnings.10_yrs_after_entry.gt_threshold",
    "{year}.aid.median_debt.completers.overall",
    "{year}.aid.median_debt.completers.monthly_payments",
    "{year}.repayment.3_yr_default_rate",
    "{year}.aid.pell_grant_rate",
    "{year}.aid.federal_loan_rate",
    "{year}.completion.outcome_percentage_suppressed.all_students.8yr.award_pooled",
    "{year}.completion.outcome_percentage_suppressed.all_students.8yr.transfer_pooled",
    "{year}.completion.outcome_percentage_suppressed.all_students.8yr.unknown_pooled",
    "{year}.completion.outcome_percentage_suppressed.all_students.8yr.still_enrolled_pooled",
    "{year}.admissions.sat_scores.25th_percentile.critical_reading",
    "{year}.admissions.sat_scores.75th_percentile.critical_reading",
    "{year}.admissions.sat_scores.25th_percentile.math",
    "{year}.admissions.sat_scores.75th_percentile.math",
    "{year}.admissions.act_scores.25th_percentile.cumulative",
    "{year}.admissions.act_scores.75th_percentile.cumulative",
]

RACE_FIELD_TEMPLATES = [
    "{year}.student.demographics.race_ethnicity.hispanic",
    "{year}.student.demographics.race_ethnicity.black",
    "{year}.student.demographics.race_ethnicity.white",
    "{year}.student.demographics.race_ethnicity.asian",
    "{year}.student.demographics.race_ethnicity.aian",
    "{year}.student.demographics.race_ethnicity.nhpi",
    "{year}.student.demographics.race_ethnicity.two_or_more",
    "{year}.student.demographics.race_ethnicity.non_resident_alien",
    "{year}.student.demographics.race_ethnicity.unknown",
    "{year}.student.demographics.faculty.race_ethnicity.hispanic",
    "{year}.student.demographics.faculty.race_ethnicity.black",
    "{year}.student.demographics.faculty.race_ethnicity.white",
    "{year}.student.demographics.faculty.race_ethnicity.asian",
    "{year}.student.demographics.faculty.race_ethnicity.aian",
    "{year}.student.demographics.faculty.race_ethnicity.nhpi",
    "{year}.student.demographics.faculty.race_ethnicity.two_or_more",
    "{year}.student.demographics.faculty.race_ethnicity.non_resident_alien",
    "{year}.student.demographics.faculty.race_ethnicity.unknown",
]

# Latest fields — uses latest.* prefix for most accurate current data
LATEST_FIELDS = [
    "id",
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
    "latest.cost.net_price.public.by_income_level.0-30000",
    "latest.cost.net_price.public.by_income_level.30001-48000",
    "latest.cost.net_price.public.by_income_level.48001-75000",
    "latest.cost.net_price.public.by_income_level.75001-110000",
    "latest.cost.net_price.public.by_income_level.110001-plus",
    "latest.cost.net_price.private.by_income_level.0-30000",
    "latest.cost.net_price.private.by_income_level.30001-48000",
    "latest.cost.net_price.private.by_income_level.48001-75000",
    "latest.cost.net_price.private.by_income_level.75001-110000",
    "latest.cost.net_price.private.by_income_level.110001-plus",
]


def build_fields(year):
    yr = str(year)
    return (
        STATIC_FIELDS
        + [f.replace("{year}", yr) for f in METRIC_FIELD_TEMPLATES]
        + [f.replace("{year}", yr) for f in RACE_FIELD_TEMPLATES]
    )


def get_years_in_db():
    try:
        result = client.schema(SCHEMA).table("all_college_metrics").select("year").execute()
        return set(row["year"] for row in result.data)
    except Exception:
        return set()


def get_years_to_fetch():
    years_in_db    = get_years_in_db()
    latest_yr      = max(YEARS)
    if not years_in_db:
        print("First run — fetching all years.")
        return YEARS
    missing = [y for y in YEARS if y not in years_in_db]
    years   = sorted(set(missing + [latest_yr]))
    if years == [latest_yr]:
        print(f"Database up to date. Refreshing latest year ({latest_yr}).")
    else:
        print(f"Fetching: {years}")
    return years


def fetch_schools(year):
    params = {
        "api_key": API_KEY, "zip": HOUSTON_ZIP, "distance": RADIUS,
        "fields": ",".join(build_fields(year)), "per_page": 100, "page": 0,
    }
    all_results, total_fetched = [], 0
    print(f"  Fetching {year}...", end=" ", flush=True)
    while True:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        if resp.status_code != 200:
            print(f"Error {resp.status_code}")
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
    return all_results


def fetch_by_name(name, year):
    params = {
        "api_key": API_KEY, "school.name": name,
        "fields": ",".join(build_fields(year)), "per_page": 1,
    }
    resp    = requests.get(BASE_URL, params=params, timeout=30)
    results = resp.json().get("results", []) if resp.status_code == 200 else []
    if not results:
        print(f"  Warning: could not find '{name}' for {year}")
    return results


def fetch_latest_data(college_ids):
    """Fetch latest.* data for all schools in one API call per page."""
    print("  Fetching latest data...", end=" ", flush=True)
    params = {
        "api_key":  API_KEY,
        "zip":      HOUSTON_ZIP,
        "distance": RADIUS,
        "fields":   ",".join(LATEST_FIELDS),
        "per_page": 100,
        "page":     0,
    }
    all_results, total_fetched = [], 0
    while True:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        if resp.status_code != 200:
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

    # Also fetch extra schools by name
    for name in EXTRA_SCHOOLS:
        ep = {
            "api_key": API_KEY, "school.name": name,
            "fields": ",".join(LATEST_FIELDS), "per_page": 1,
        }
        r = requests.get(BASE_URL, params=ep, timeout=30)
        if r.status_code == 200:
            res = r.json().get("results", [])
            existing = {x.get("id") for x in all_results}
            for s in res:
                if s.get("id") not in existing:
                    all_results.append(s)
        time.sleep(0.3)

    print(f"{len(all_results)} schools")
    return {r.get("id"): r for r in all_results}


def clean(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    return v


def build_college_record(r):
    missions    = [label for field, label in MISSION_MAP.items() if r.get(field) == 1]
    specialized = "None" if not missions else (missions[0] if len(missions) == 1 else ", ".join(missions))
    pred        = DEGREE_MAP.get(r.get("school.degrees_awarded.predominant", 0), "")
    highest     = DEGREE_MAP.get(r.get("school.degrees_awarded.highest", 0), "")
    awards      = pred if pred == highest else (f"{pred}, {highest}" if pred and highest else pred or highest)
    url         = r.get("school.school_url") or ""
    if url and not url.startswith("http"):
        url = "https://" + url
    return {
        "college_id":            r.get("id"),
        "college_name":          r.get("school.name"),
        "city":                  r.get("school.city"),
        "state":                 r.get("school.state"),
        "ownership":             OWNERSHIP_MAP.get(r.get("school.ownership"), "Unknown"),
        "predominant_degree":    DEGREE_MAP.get(r.get("school.degrees_awarded.predominant"), "Unknown"),
        "awards_offered":        awards,
        "latitude":              r.get("location.lat"),
        "longitude":             r.get("location.lon"),
        "specialized_mission":   specialized,
        "religious_affiliation": RELIGIOUS_MAP.get(r.get("school.religious_affiliation", -1), "Not Affiliated"),
        "wioa_programs":         "Yes" if r.get("school.under_investigation") == 1 else "No",
        "size":                  SIZE_MAP.get(r.get("school.carnegie_size_setting"), "Unknown"),
        "urbanicity":            LOCALE_MAP.get(r.get("school.locale"), "Unknown"),
        "website":               url or None,
    }


def build_metric_record(r, year):
    yr       = str(year)
    pt_share = r.get(f"{yr}.student.part_time_share")
    ft_pct   = round(1 - pt_share, 4) if pt_share is not None else None
    pt_pct   = round(pt_share, 4)      if pt_share is not None else None
    return {
        "college_id":               r.get("id"),
        "year":                     year,
        "in_state_tuition":         clean(r.get(f"{yr}.cost.tuition.in_state")),
        "out_state_tuition":        clean(r.get(f"{yr}.cost.tuition.out_of_state")),
        "net_annual_cost":          clean(r.get(f"{yr}.cost.avg_net_price.overall")),
        "acceptance_rate":          clean(r.get(f"{yr}.admissions.admission_rate.overall")),
        "graduation_rate":          clean(r.get(f"{yr}.completion.rate_suppressed.overall")),
        "retention_rate":           clean(r.get(f"{yr}.student.retention_rate.four_year.full_time")
                                         or r.get(f"{yr}.student.retention_rate.lt_four_year.full_time")),
        "enrollment":               clean(r.get(f"{yr}.student.size")),
        "fulltime_pct":             clean(ft_pct),
        "parttime_pct":             clean(pt_pct),
        "student_faculty_ratio":    clean(r.get(f"{yr}.student.demographics.student_faculty_ratio")),
        "median_earnings":          clean(r.get(f"{yr}.earnings.10_yrs_after_entry.median")),
        "pct_earning_more_than_hs": clean(r.get(f"{yr}.earnings.10_yrs_after_entry.gt_threshold")),
        "median_debt":              clean(r.get(f"{yr}.aid.median_debt.completers.overall")),
        "monthly_loan_payment":     clean(r.get(f"{yr}.aid.median_debt.completers.monthly_payments")),
        "loan_default_rate":        clean(r.get(f"{yr}.repayment.3_yr_default_rate")),
        "pell_grant_pct":           clean(r.get(f"{yr}.aid.pell_grant_rate")),
        "federal_aid_pct":          clean(r.get(f"{yr}.aid.federal_loan_rate")),
        "outcome_graduated_pct":    clean(r.get(f"{yr}.completion.outcome_percentage_suppressed.all_students.8yr.award_pooled")),
        "outcome_transferred_pct":  clean(r.get(f"{yr}.completion.outcome_percentage_suppressed.all_students.8yr.transfer_pooled")),
        "outcome_withdrew_pct":     clean(r.get(f"{yr}.completion.outcome_percentage_suppressed.all_students.8yr.unknown_pooled")),
        "outcome_enrolled_pct":     clean(r.get(f"{yr}.completion.outcome_percentage_suppressed.all_students.8yr.still_enrolled_pooled")),
        "sat_reading_25":           clean(r.get(f"{yr}.admissions.sat_scores.25th_percentile.critical_reading")),
        "sat_reading_75":           clean(r.get(f"{yr}.admissions.sat_scores.75th_percentile.critical_reading")),
        "sat_math_25":              clean(r.get(f"{yr}.admissions.sat_scores.25th_percentile.math")),
        "sat_math_75":              clean(r.get(f"{yr}.admissions.sat_scores.75th_percentile.math")),
        "act_25":                   clean(r.get(f"{yr}.admissions.act_scores.25th_percentile.cumulative")),
        "act_75":                   clean(r.get(f"{yr}.admissions.act_scores.75th_percentile.cumulative")),
    }


def build_diversity_record(r, year):
    yr = str(year)
    return {
        "college_id":                   r.get("id"),
        "year":                         year,
        "hispanic_student_pct":         clean(r.get(f"{yr}.student.demographics.race_ethnicity.hispanic")),
        "black_student_pct":            clean(r.get(f"{yr}.student.demographics.race_ethnicity.black")),
        "white_student_pct":            clean(r.get(f"{yr}.student.demographics.race_ethnicity.white")),
        "asian_student_pct":            clean(r.get(f"{yr}.student.demographics.race_ethnicity.asian")),
        "nativeamerican_student_pct":   clean(r.get(f"{yr}.student.demographics.race_ethnicity.aian")),
        "pacificislander_student_pct":  clean(r.get(f"{yr}.student.demographics.race_ethnicity.nhpi")),
        "twoplus_student_pct":          clean(r.get(f"{yr}.student.demographics.race_ethnicity.two_or_more")),
        "nonresident_student_pct":      clean(r.get(f"{yr}.student.demographics.race_ethnicity.non_resident_alien")),
        "unknown_student_pct":          clean(r.get(f"{yr}.student.demographics.race_ethnicity.unknown")),
        "hispanic_staff_pct":           clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.hispanic")),
        "black_staff_pct":              clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.black")),
        "white_staff_pct":              clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.white")),
        "asian_staff_pct":              clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.asian")),
        "nativeamerican_staff_pct":     clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.aian")),
        "pacificislander_staff_pct":    clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.nhpi")),
        "twoplus_staff_pct":            clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.two_or_more")),
        "nonresident_staff_pct":        clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.non_resident_alien")),
        "unknown_staff_pct":            clean(r.get(f"{yr}.student.demographics.faculty.race_ethnicity.unknown")),
    }


def build_latest_record(college_id, r):
    pt_share = r.get("latest.student.part_time_share")
    ft_pct   = round(1 - pt_share, 4) if pt_share is not None else None
    pt_pct   = round(pt_share, 4)      if pt_share is not None else None

    # Income breakdown — try public first, fall back to private
    def income(bracket):
        pub  = r.get(f"latest.cost.net_price.public.by_income_level.{bracket}")
        priv = r.get(f"latest.cost.net_price.private.by_income_level.{bracket}")
        return clean(pub if pub is not None else priv)

    return {
        "college_id":               college_id,
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
    print(f"Houston Edu Hub — Data Collector")
    print(f"Schema: {SCHEMA}\n")

    years_to_fetch = get_years_to_fetch()

    all_records_by_year = {}
    for year in years_to_fetch:
        records      = fetch_schools(year)
        existing_ids = {r.get("id") for r in records}
        for name in EXTRA_SCHOOLS:
            for s in fetch_by_name(name, year):
                if s.get("id") not in existing_ids:
                    records.append(s)
                    existing_ids.add(s.get("id"))
            time.sleep(0.3)
        all_records_by_year[year] = records

    latest_year    = max(all_records_by_year.keys())
    latest_records = all_records_by_year[latest_year]
    all_ids        = {r.get("id") for r in latest_records}

    print(f"\nLoading into Supabase ({SCHEMA} schema)...")

    print("  all_colleges...")
    college_records = [build_college_record(r) for r in latest_records]
    upsert_batch("all_colleges", college_records)
    print(f"  {len(college_records)} schools.")

    print("  all_college_metrics...")
    metric_records = []
    for year, records in all_records_by_year.items():
        for r in records:
            metric_records.append(build_metric_record(r, year))
    upsert_batch("all_college_metrics", metric_records)
    print(f"  {len(metric_records)} rows.")

    print("  all_college_diversity...")
    diversity_records = []
    for year, records in all_records_by_year.items():
        for r in records:
            diversity_records.append(build_diversity_record(r, year))
    upsert_batch("all_college_diversity", diversity_records)
    print(f"  {len(diversity_records)} rows.")

    print("  all_college_latest...")
    latest_data    = fetch_latest_data(all_ids)
    latest_records_out = []
    for cid, r in latest_data.items():
        latest_records_out.append(build_latest_record(cid, r))
    upsert_batch("all_college_latest", latest_records_out)
    print(f"  {len(latest_records_out)} schools.")

    print(f"\nDone. Years loaded: {sorted(all_records_by_year.keys())}")
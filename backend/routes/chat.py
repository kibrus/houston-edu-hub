"""
Chat route — connects to OpenRouter API using GPT-4o Mini
Fetches all Houston school data from Supabase and injects it
as context into every chat message.

Route:
    POST /api/chat
    Body: { "message": "...", "school_id": null or int }
"""

import sys, os, json, requests


from flask import Blueprint, jsonify, request
from backend.config import SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY
from supabase import create_client

chat_bp = Blueprint("chat", __name__)
client  = create_client(SUPABASE_URL, SUPABASE_KEY)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL          = "openai/gpt-4o-mini"


def get_all_schools_context():
    """Fetch all curated schools with latest data from Supabase."""
    schools   = client.table("colleges").select("*").order("college_name").execute().data
    latest    = client.table("college_latest").select("*").execute().data

    # Build a lookup map for latest data
    latest_map = {row["college_id"]: row for row in latest}

    lines = []
    for s in schools:
        cid = s.get("college_id")
        l   = latest_map.get(cid, {})

        def pct(v):  return f"{round(v * 100)}%" if v is not None else "N/A"
        def usd(v):  return f"${round(v):,}"      if v is not None else "N/A"
        def num(v):  return f"{round(v):,}"        if v is not None else "N/A"

        line = (
            f"- {s.get('college_name')} ({s.get('category')}, {s.get('city')}, {s.get('state')})"
            f" | Ownership: {s.get('ownership')}"
            f" | Predominant Degree: {s.get('predominant_degree')}"
            f" | Graduation Rate: {pct(l.get('graduation_rate'))}"
            f" | Retention Rate: {pct(l.get('retention_rate'))}"
            f" | Acceptance Rate: {pct(l.get('acceptance_rate'))}"
            f" | Net Annual Cost: {usd(l.get('net_annual_cost'))}"
            f" | In-State Tuition: {usd(l.get('in_state_tuition'))}"
            f" | Median Earnings: {usd(l.get('median_earnings'))}"
            f" | Enrollment: {num(l.get('enrollment'))}"
            f" | Median Debt: {usd(l.get('median_debt'))}"
            f" | Pell Grant: {pct(l.get('pell_grant_pct'))}"
            f" | Student/Faculty Ratio: {l.get('student_faculty_ratio', 'N/A')}:1"
            f" | Website: {s.get('website') or 'N/A'}"
        )
        lines.append(line)

    return "\n".join(lines)


def get_school_context(school_id):
    """Fetch detailed data for a specific school."""
    school  = client.table("colleges").select("*").eq("college_id", school_id).single().execute().data
    latest  = client.table("college_latest").select("*").eq("college_id", school_id).single().execute().data
    metrics = client.table("college_metrics").select("*").eq("college_id", school_id).order("year").execute().data

    if not school:
        return ""

    l = latest or {}

    def pct(v):  return f"{round(v * 100)}%" if v is not None else "N/A"
    def usd(v):  return f"${round(v):,}"      if v is not None else "N/A"

    context = f"""
School: {school.get('college_name')}
Category: {school.get('category')}
Location: {school.get('city')}, {school.get('state')}
Ownership: {school.get('ownership')}
Predominant Degree: {school.get('predominant_degree')}
Specialized Mission: {school.get('specialized_mission')}
Website: {school.get('website') or 'N/A'}

Latest Statistics:
- Graduation Rate: {pct(l.get('graduation_rate'))}
- Retention Rate: {pct(l.get('retention_rate'))}
- Acceptance Rate: {pct(l.get('acceptance_rate'))}
- Net Annual Cost: {usd(l.get('net_annual_cost'))} (after grants)
- In-State Tuition: {usd(l.get('in_state_tuition'))}
- Out-of-State Tuition: {usd(l.get('out_state_tuition'))}
- Median Earnings (10yr): {usd(l.get('median_earnings'))}
- Enrollment: {round(l.get('enrollment')) if l.get('enrollment') else 'N/A'}
- Full-Time Students: {pct(l.get('fulltime_pct'))}
- Part-Time Students: {pct(l.get('parttime_pct'))}
- Student/Faculty Ratio: {l.get('student_faculty_ratio', 'N/A')}:1
- Median Debt: {usd(l.get('median_debt'))}
- Monthly Loan Payment: {usd(l.get('monthly_loan_payment'))}
- Loan Default Rate: {pct(l.get('loan_default_rate'))}
- Pell Grant Recipients: {pct(l.get('pell_grant_pct'))}
- Federal Aid Recipients: {pct(l.get('federal_aid_pct'))}
- Graduated 8yr: {pct(l.get('outcome_graduated_pct'))}
- Transferred 8yr: {pct(l.get('outcome_transferred_pct'))}
- Withdrew 8yr: {pct(l.get('outcome_withdrew_pct'))}
- SAT Reading: {l.get('sat_reading_25', 'N/A')} - {l.get('sat_reading_75', 'N/A')}
- SAT Math: {l.get('sat_math_25', 'N/A')} - {l.get('sat_math_75', 'N/A')}
- ACT: {l.get('act_25', 'N/A')} - {l.get('act_75', 'N/A')}
- Cost for $0-30k income: {usd(l.get('cost_income_0_30k'))}
- Cost for $30k-48k income: {usd(l.get('cost_income_30k_48k'))}
- Cost for $48k-75k income: {usd(l.get('cost_income_48k_75k'))}
- Cost for $75k-110k income: {usd(l.get('cost_income_75k_110k'))}
- Cost for $110k+ income: {usd(l.get('cost_income_110k_plus'))}
"""

    if metrics:
        context += "\nHistorical Enrollment Trend:\n"
        for m in metrics:
            context += f"  {m.get('year')}: {round(m.get('enrollment')) if m.get('enrollment') else 'N/A'} students\n"

    return context


def build_system_prompt(school_id=None):
    """Build the system prompt with school data injected."""

    if school_id:
        school_context = get_school_context(school_id)
        return f"""You are Houston Edu Hub Assistant, a helpful AI that helps students learn about Houston-area colleges and universities.

You are currently helping a student who is viewing the following school:

{school_context}

You also have access to all other Houston-area institutions for comparison purposes:

{get_all_schools_context()}

Guidelines:
- Be helpful, friendly, and concise
- Answer questions about costs, admissions, outcomes, financial aid, and diversity
- When comparing schools, use the data provided above
- If a student asks about something not in the data, say you don't have that information
- Always encourage students to visit the school's official website for the most current information
- Data comes from the U.S. Department of Education College Scorecard
- Keep responses under 200 words unless the student asks for detailed information
"""
    else:
        return f"""You are Houston Edu Hub Assistant, a helpful AI that helps students explore and compare Houston-area colleges and universities.

You have access to data for all Houston-area institutions listed below:

{get_all_schools_context()}

Guidelines:
- Be helpful, friendly, and concise
- Help students find the right school based on their needs and preferences
- Answer questions about costs, admissions, outcomes, financial aid, and diversity
- When recommending schools, explain why based on the data
- If a student asks about something not in the data, say you don't have that information
- Always encourage students to visit the school's official website for the most current information
- Data comes from the U.S. Department of Education College Scorecard
- Keep responses under 200 words unless the student asks for detailed information
"""


@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    body       = request.get_json()
    message    = body.get("message", "").strip()
    school_id  = body.get("school_id")
    history    = body.get("history", [])

    if not message:
        return jsonify({"error": "Message is required"}), 400

    system_prompt = build_system_prompt(school_id)

    # Build messages array with conversation history
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-6:]:  # Keep last 6 messages for context
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://houston-edu-hub.com",
        "X-Title":       "Houston Edu Hub",
    }

    payload = {
        "model":       MODEL,
        "messages":    messages,
        "max_tokens":  400,
        "temperature": 0.7,
    }

    resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)

    if resp.status_code != 200:
        return jsonify({"error": "AI service unavailable. Please try again."}), 503

    data    = resp.json()
    reply   = data["choices"][0]["message"]["content"]

    return jsonify({"reply": reply})
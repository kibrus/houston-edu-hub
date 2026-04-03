"""
Metrics and diversity routes
GET /api/metrics/<id>    — all yearly metrics for one school
GET /api/diversity/<id>  — all yearly diversity data for one school
GET /api/metrics/latest/<id> — most recent year metrics only
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from flask import Blueprint, jsonify, request
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

metrics_bp = Blueprint("metrics", __name__)
client     = create_client(SUPABASE_URL, SUPABASE_KEY)


@metrics_bp.route("/api/metrics/<int:college_id>", methods=["GET"])
def get_metrics(college_id):
    """
    Returns all yearly metrics for a school (2018-2023).
    Used for trend charts on the school profile page.
    """
    result = (
        client.table("college_metrics")
        .select("*")
        .eq("college_id", college_id)
        .order("year")
        .execute()
    )
    return jsonify(result.data)


@metrics_bp.route("/api/metrics/latest/<int:college_id>", methods=["GET"])
def get_latest_metrics(college_id):
    """
    Returns only the most recent year of metrics for a school.
    Used for the school card summary and profile header stats.
    """
    result = (
        client.table("college_metrics")
        .select("*")
        .eq("college_id", college_id)
        .order("year", desc=True)
        .limit(1)
        .execute()
    )
    data = result.data[0] if result.data else {}
    return jsonify(data)


@metrics_bp.route("/api/diversity/<int:college_id>", methods=["GET"])
def get_diversity(college_id):
    """
    Returns all yearly diversity data for a school.
    Used for race/ethnicity charts on the school profile page.
    """
    result = (
        client.table("college_diversity")
        .select("*")
        .eq("college_id", college_id)
        .order("year")
        .execute()
    )
    return jsonify(result.data)


@metrics_bp.route("/api/diversity/latest/<int:college_id>", methods=["GET"])
def get_latest_diversity(college_id):
    """
    Returns only the most recent year of diversity data.
    Used for the donut charts on the school profile page.
    """
    result = (
        client.table("college_diversity")
        .select("*")
        .eq("college_id", college_id)
        .order("year", desc=True)
        .limit(1)
        .execute()
    )
    data = result.data[0] if result.data else {}
    return jsonify(data)
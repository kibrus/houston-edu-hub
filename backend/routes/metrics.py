import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from flask import Blueprint, jsonify
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

metrics_bp = Blueprint("metrics", __name__)
client     = create_client(SUPABASE_URL, SUPABASE_KEY)


@metrics_bp.route("/api/metrics/<int:college_id>", methods=["GET"])
def get_metrics(college_id):
    result = client.table("college_metrics").select("*").eq("college_id", college_id).order("year").execute()
    return jsonify(result.data)


@metrics_bp.route("/api/metrics/latest/<int:college_id>", methods=["GET"])
def get_latest_metrics(college_id):
    result = client.table("college_metrics").select("*").eq("college_id", college_id).order("year", desc=True).limit(1).execute()
    return jsonify(result.data[0] if result.data else {})


@metrics_bp.route("/api/latest/<int:college_id>", methods=["GET"])
def get_latest(college_id):
    result = client.table("college_latest").select("*").eq("college_id", college_id).single().execute()
    return jsonify(result.data if result.data else {})


@metrics_bp.route("/api/diversity/<int:college_id>", methods=["GET"])
def get_diversity(college_id):
    result = client.table("college_diversity").select("*").eq("college_id", college_id).order("year").execute()
    return jsonify(result.data)


@metrics_bp.route("/api/diversity/latest/<int:college_id>", methods=["GET"])
def get_latest_diversity(college_id):
    result = client.table("college_diversity").select("*").eq("college_id", college_id).order("year", desc=True).limit(1).execute()
    return jsonify(result.data[0] if result.data else {})


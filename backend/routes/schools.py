import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from flask import Blueprint, jsonify, request
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

schools_bp = Blueprint("schools", __name__)
client     = create_client(SUPABASE_URL, SUPABASE_KEY)
SCHEMA     = "houston_curated"


@schools_bp.route("/api/schools", methods=["GET"])
def get_all_schools():
    query     = client.schema(SCHEMA).table("colleges").select("*")
    category  = request.args.get("category")
    size      = request.args.get("size")
    ownership = request.args.get("ownership")
    if category:  query = query.eq("category", category)
    if size:      query = query.eq("size", size)
    if ownership: query = query.eq("ownership", ownership)
    result = query.order("college_name").execute()
    return jsonify(result.data)


@schools_bp.route("/api/schools/<int:college_id>", methods=["GET"])
def get_school(college_id):
    result = (
        client.schema(SCHEMA).table("colleges")
        .select("*").eq("college_id", college_id).single().execute()
    )
    return jsonify(result.data)


@schools_bp.route("/api/compare", methods=["GET"])
def compare_schools():
    ids_param = request.args.get("ids", "")
    if not ids_param:
        return jsonify({"error": "No school IDs provided"}), 400
    try:
        ids = [int(i) for i in ids_param.split(",")]
    except ValueError:
        return jsonify({"error": "Invalid school IDs"}), 400

    schools   = client.schema(SCHEMA).table("colleges").select("*").in_("college_id", ids).execute()
    metrics   = client.schema(SCHEMA).table("college_metrics").select("*").in_("college_id", ids).order("year", desc=True).execute()
    diversity = client.schema(SCHEMA).table("college_diversity").select("*").in_("college_id", ids).order("year", desc=True).execute()

    return jsonify({
        "schools":   schools.data,
        "metrics":   metrics.data,
        "diversity": diversity.data,
    })
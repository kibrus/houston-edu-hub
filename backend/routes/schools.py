"""
Schools routes
GET /api/schools         — all schools
GET /api/schools/<id>    — single school profile
GET /api/compare         — side by side data for multiple schools
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from flask import Blueprint, jsonify, request
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client

schools_bp = Blueprint("schools", __name__)
client     = create_client(SUPABASE_URL, SUPABASE_KEY)


@schools_bp.route("/api/schools", methods=["GET"])
def get_all_schools():
    """
    Returns all schools with their latest key metrics for the school cards.
    Optional query params:
        category   — filter by Public University, Community College, Private Nonprofit
        size       — filter by Small, Medium, Large
        ownership  — filter by Public, Private Nonprofit, Private For-Profit
    """
    query = client.table("colleges").select("*")

    category  = request.args.get("category")
    size      = request.args.get("size")
    ownership = request.args.get("ownership")

    if category:
        query = query.eq("category", category)
    if size:
        query = query.eq("size", size)
    if ownership:
        query = query.eq("ownership", ownership)

    result = query.order("college_name").execute()
    return jsonify(result.data)


@schools_bp.route("/api/schools/<int:college_id>", methods=["GET"])
def get_school(college_id):
    """
    Returns full static profile for a single school.
    """
    result = (
        client.table("colleges")
        .select("*")
        .eq("college_id", college_id)
        .single()
        .execute()
    )
    return jsonify(result.data)


@schools_bp.route("/api/compare", methods=["GET"])
def compare_schools():
    """
    Returns side by side data for multiple schools.
    Query param: ids=225511,227757,229063
    """
    ids_param = request.args.get("ids", "")
    if not ids_param:
        return jsonify({"error": "No school IDs provided"}), 400

    try:
        ids = [int(i) for i in ids_param.split(",")]
    except ValueError:
        return jsonify({"error": "Invalid school IDs"}), 400

    schools = (
        client.table("colleges")
        .select("*")
        .in_("college_id", ids)
        .execute()
    )

    metrics = (
        client.table("college_metrics")
        .select("*")
        .in_("college_id", ids)
        .order("year", desc=True)
        .execute()
    )

    diversity = (
        client.table("college_diversity")
        .select("*")
        .in_("college_id", ids)
        .order("year", desc=True)
        .execute()
    )

    return jsonify({
        "schools":   schools.data,
        "metrics":   metrics.data,
        "diversity": diversity.data,
    })
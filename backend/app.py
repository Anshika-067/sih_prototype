# app.py
# ─────────────────────────────────────────────────────────────────────────────
# Flask backend for SkillTor – Smart Skill Demand Predictor
#
# How to run:
#   cd backend
#   python app.py
#
# The server starts at: http://127.0.0.1:5000
# ─────────────────────────────────────────────────────────────────────────────

from flask import Flask, jsonify, request
from flask_cors import CORS   # Allow the frontend (different port) to call our API

# Import our custom modules
from data_processor import (
    get_all_roles,
    get_roles_grouped,
    get_role_details,
    perform_skill_gap_analysis,
    get_top_skills,
    get_skill_demand_by_category,
    get_trending_skills,
)
from predictor import SkillPredictor

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

# CORS = Cross-Origin Resource Sharing
# This allows the browser to call our API from a different port (e.g. 5500 → 5000)
CORS(app)

# Train the ML model once at startup (not on every request — that would be slow)
print("\n[SkillTor] Starting up…")
predictor = SkillPredictor()
print("[SkillTor] All systems ready!\n")


# ── Helper ────────────────────────────────────────────────────────────────────
def success(data: dict | list) -> tuple:
    """Wrap any response in a standard success envelope."""
    return jsonify({"status": "success", "data": data}), 200


def error(message: str, code: int = 400) -> tuple:
    """Return a standard error envelope."""
    return jsonify({"status": "error", "message": message}), code


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Health-check / welcome endpoint."""
    return jsonify({
        "message": "SkillTor API is running!",
        "version": "1.0.0",
        "disclaimer": "Dashboard and regional datasets are sample/simulated.",
        "endpoints": [
            "GET  /api/skill-demand",
            "GET  /api/skill-demand/categories",
            "GET  /api/skill-demand/trending",
            "GET  /api/job-roles",
            "GET  /api/job-roles/grouped",
            "GET  /api/job-roles/<role_name>",
            "POST /api/skill-gap",
            "POST /api/recommendations",
            "GET  /api/model-info",
        ],
    })


# ── Skill demand endpoints ────────────────────────────────────────────────────

@app.route("/api/skill-demand", methods=["GET"])
def skill_demand():
    """
    Return the top-N skills by demand score.
    Query param: ?n=15 (default 15)
    """
    n = request.args.get("n", default=15, type=int)
    n = max(5, min(n, 40))   # clamp between 5 and 40
    data = get_top_skills(n)
    return success(data)


@app.route("/api/skill-demand/categories", methods=["GET"])
def skill_demand_categories():
    """Return average skill demand grouped by category."""
    data = get_skill_demand_by_category()
    # Convert dict to list of {category, avg_demand} for easier charting
    result = [{"category": k, "avg_demand": v} for k, v in data.items()]
    return success(result)


@app.route("/api/skill-demand/trending", methods=["GET"])
def trending_skills():
    """Return the top rising / trending skills."""
    data = get_trending_skills()
    return success(data)


# ── Job role endpoints ────────────────────────────────────────────────────────

@app.route("/api/job-roles", methods=["GET"])
def job_roles():
    """Return a list of all available job roles."""
    roles = get_all_roles()
    return success(roles)


@app.route("/api/job-roles/grouped", methods=["GET"])
def grouped_job_roles():
    """Return job roles grouped by sector and domain."""
    return success(get_roles_grouped())


@app.route("/api/job-roles/<string:role_name>", methods=["GET"])
def job_role_detail(role_name: str):
    """
    Return detailed info (required skills, demand score, growth trend)
    for a specific job role.
    """
    details = get_role_details(role_name)
    if details is None:
        return error(f"Role '{role_name}' not found", 404)
    return success(details)


# ── Skill gap & recommendations endpoints ────────────────────────────────────

@app.route("/api/skill-gap", methods=["POST"])
def skill_gap():
    """
    Analyse the gap between a student's current skills and a target job role.

    Request body (JSON):
        {
            "student_skills": ["Python", "SQL", "Git"],
            "target_role": "Data Scientist"
        }
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    student_skills = body.get("student_skills", [])
    target_role = body.get("target_role", "")

    if not target_role:
        return error("'target_role' is required")
    if not isinstance(student_skills, list):
        return error("'student_skills' must be a list of strings")

    result = perform_skill_gap_analysis(student_skills, target_role)
    if "error" in result:
        return error(result["error"], 404)

    return success(result)


@app.route("/api/recommendations", methods=["POST"])
def recommendations():
    """
    Use the ML model to recommend the next best skill to learn.

    Request body (JSON):
        {
            "student_skills": ["Python", "SQL", "Pandas"],
            "target_role": "Data Scientist"   ← optional, used to enrich response
        }

    ⚠️  Disclaimer: predictions are from a model trained on ~50 synthetic samples.
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    student_skills = body.get("student_skills", [])
    target_role = body.get("target_role", "")

    if not isinstance(student_skills, list):
        return error("'student_skills' must be a list of strings")

    # Get ML prediction
    ml_result = predictor.predict(student_skills)

    # If a target role is given, also include the top missing skills from gap analysis
    gap_based_recommendations = []
    if target_role:
        gap = perform_skill_gap_analysis(student_skills, target_role)
        if "missing_skills" in gap:
            # Take top-5 missing skills by demand score
            gap_based_recommendations = gap["missing_skills"][:5]

    return success({
        "ml_recommendation": ml_result,
        "gap_based_recommendations": gap_based_recommendations,
        "disclaimer": (
            "ML recommendations are based on a model trained on ~50 synthetic "
            "sample records. Use these as a starting point, not definitive advice."
        ),
    })


@app.route("/api/model-info", methods=["GET"])
def model_info():
    """Return metadata and accuracy information about the ML model."""
    info = predictor.get_model_info()
    return success(info)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # debug=True enables auto-reload when you edit the code
    # host="0.0.0.0" makes the server accessible on the local network too
    app.run(debug=True, host="0.0.0.0", port=5000)

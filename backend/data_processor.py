# data_processor.py
# ─────────────────────────────────────────────────────────────────────────────
# Handles all data loading and analysis using pandas.
# NOTE: All data is SAMPLE/SIMULATED data for demonstration purposes only.
# It does NOT represent real job-market statistics.
# ─────────────────────────────────────────────────────────────────────────────

import pandas as pd
import os
from typing import Optional

# ── Path helpers ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")


def load_job_roles() -> pd.DataFrame:
    """Load the job roles CSV and parse the skills column into a Python list."""
    path = os.path.join(DATA_DIR, "job_roles.csv")
    df = pd.read_csv(path)

    # Convert comma-separated skills string → clean list of strings
    df["skills_list"] = df["skills_required"].apply(
        lambda s: [skill.strip() for skill in s.split(",")]
    )
    return df


def load_skill_demand() -> pd.DataFrame:
    """Load the skill demand CSV."""
    path = os.path.join(DATA_DIR, "skill_demand.csv")
    return pd.read_csv(path)


def get_all_roles() -> list:
    """Return a sorted list of all job-role names."""
    df = load_job_roles()
    return sorted(df["job_role"].tolist())


def get_roles_grouped() -> dict:
    """
    Return job roles grouped by sector → domain → list of role names.
    Used to populate the cascading sector/domain/role dropdowns on the frontend.

    Structure:
        {
            "IT & Software": {
                "Data Science": ["Data Scientist", "Data Analyst", ...],
                "Web Development": ["Web Developer", ...],
                ...
            },
            "Healthcare": { ... },
            ...
        }
    """
    df = load_job_roles()
    grouped = {}

    for _, row in df.iterrows():
        sector = row["sector"]
        domain = row["domain"]
        role   = row["job_role"]

        if sector not in grouped:
            grouped[sector] = {}
        if domain not in grouped[sector]:
            grouped[sector][domain] = []

        grouped[sector][domain].append(role)

    # Sort everything for consistent ordering
    sorted_grouped = {}
    for sector in sorted(grouped.keys()):
        sorted_grouped[sector] = {}
        for domain in sorted(grouped[sector].keys()):
            sorted_grouped[sector][domain] = sorted(grouped[sector][domain])

    return sorted_grouped


def get_role_details(role_name: str) -> Optional[dict]:
    """
    Return detailed information about a specific job role.
    Returns None if the role is not found.
    """
    df = load_job_roles()
    skill_demand_df = load_skill_demand()

    # Filter for the requested role (case-insensitive match)
    match = df[df["job_role"].str.lower() == role_name.lower()]
    if match.empty:
        return None

    row = match.iloc[0]
    skills = row["skills_list"]

    # Enrich each required skill with its demand score from skill_demand.csv
    enriched_skills = []
    for skill in skills:
        skill_row = skill_demand_df[skill_demand_df["skill"].str.lower() == skill.lower()]
        if not skill_row.empty:
            enriched_skills.append({
                "name": skill,
                "demand_score": int(skill_row.iloc[0]["demand_score"]),
                "category": skill_row.iloc[0]["category"],
                "growth_trend": skill_row.iloc[0]["growth_trend"],
            })
        else:
            # Skill exists in job_roles but not in skill_demand — use defaults
            enriched_skills.append({
                "name": skill,
                "demand_score": 70,
                "category": "General",
                "growth_trend": "stable",
            })

    return {
        "job_role": row["job_role"],
        "sector":   row["sector"],
        "domain":   row["domain"],
        "demand_score": int(row["demand_score"]),
        "growth_trend": row["growth_trend"],
        "skills": enriched_skills,
    }


def perform_skill_gap_analysis(student_skills: list, target_role: str) -> dict:
    """
    Compare student's current skills against the requirements of a target job role.

    Returns a dict with:
      - matched_skills   : skills the student already has
      - missing_skills   : skills the student still needs to learn
      - gap_percentage   : how much of the required skill-set is missing
      - coverage_score   : percentage of required skills the student already covers
    """
    role_details = get_role_details(target_role)
    if not role_details:
        return {"error": f"Role '{target_role}' not found"}

    required_skills = [s["name"].lower() for s in role_details["skills"]]
    student_skills_lower = [s.lower().strip() for s in student_skills]

    matched = []
    missing = []

    for skill_obj in role_details["skills"]:
        skill_name = skill_obj["name"]
        if skill_name.lower() in student_skills_lower:
            matched.append(skill_obj)
        else:
            missing.append(skill_obj)

    total = len(required_skills)
    coverage = round((len(matched) / total) * 100, 1) if total > 0 else 0
    gap = round(100 - coverage, 1)

    # Sort missing skills by demand score descending (learn the most valuable first)
    missing_sorted = sorted(missing, key=lambda x: x["demand_score"], reverse=True)

    return {
        "target_role": role_details["job_role"],
        "sector":      role_details["sector"],
        "domain":      role_details["domain"],
        "total_required_skills": total,
        "matched_skills": matched,
        "missing_skills": missing_sorted,
        "coverage_score": coverage,
        "gap_percentage": gap,
    }


def get_top_skills(n: int = 15) -> list:
    """
    Return the top-N skills by demand score for the dashboard chart.
    Each entry includes the skill name, score, category, and growth trend.
    """
    df = load_skill_demand()
    top = df.nlargest(n, "demand_score")
    return top[["skill", "demand_score", "category", "growth_trend"]].to_dict(orient="records")


def get_skill_demand_by_category() -> dict:
    """
    Group skills by category and compute the average demand score per category.
    Useful for a category-level bar chart on the dashboard.
    """
    df = load_skill_demand()
    grouped = df.groupby("category")["demand_score"].mean().round(1)
    return grouped.sort_values(ascending=False).to_dict()


def get_trending_skills() -> list:
    """Return skills with a 'rising' growth trend, sorted by demand score."""
    df = load_skill_demand()
    rising = df[df["growth_trend"] == "rising"].nlargest(10, "demand_score")
    return rising[["skill", "demand_score", "category"]].to_dict(orient="records")


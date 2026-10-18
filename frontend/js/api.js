// api.js
// ─────────────────────────────────────────────────────────────────────────────
// All communication between the frontend and Flask backend lives here.
// Each function returns the parsed JSON from the API response.
// ─────────────────────────────────────────────────────────────────────────────

// The base URL for the Flask backend.
// If you change the Flask port in app.py, update this too.
const API_BASE = "http://127.0.0.1:5000";

/**
 * Generic GET helper.
 * Throws an Error if the HTTP response is not OK.
 */
async function apiGet(endpoint) {
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach the SkillTor backend at ${API_BASE}. Install the backend requirements and start backend/app.py.`
      );
    }
    throw error;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${response.status}`);
  }
  const json = await response.json();
  return json.data; // our Flask wrapper always puts data inside `data`
}

/**
 * Generic POST helper.
 * Sends a JSON body and returns the `data` field from the response.
 */
async function apiPost(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `HTTP ${response.status}`);
  }
  const json = await response.json();
  return json.data;
}

// ── Public API functions ───────────────────────────────────────────────────

/** Fetch top skills for the dashboard (optional: ?n=N) */
async function fetchTopSkills(n = 15) {
  return apiGet(`/api/skill-demand?n=${n}`);
}

/** Fetch average demand per skill category */
async function fetchSkillCategories() {
  return apiGet("/api/skill-demand/categories");
}

/** Fetch trending (rising) skills */
async function fetchTrendingSkills() {
  return apiGet("/api/skill-demand/trending");
}

/** Fetch all available job role names */
async function fetchJobRoles() {
  return apiGet("/api/job-roles");
}

/** Fetch job roles grouped by sector and specialization */
async function fetchGroupedJobRoles() {
  try {
    return await apiGet("/api/job-roles/grouped");
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "HTTP 404") {
      throw error;
    }

    // Older running backend instances may not expose the grouped endpoint yet.
    const roles = await fetchJobRoles();
    const details = await Promise.all(roles.map(role => fetchRoleDetails(role)));
    return details.reduce((grouped, role) => {
      if (!grouped[role.sector]) grouped[role.sector] = {};
      if (!grouped[role.sector][role.domain]) grouped[role.sector][role.domain] = [];
      grouped[role.sector][role.domain].push(role.job_role);
      return grouped;
    }, {});
  }
}

/** Fetch full details (skills, demand, trend) for a specific role */
async function fetchRoleDetails(roleName) {
  return apiGet(`/api/job-roles/${encodeURIComponent(roleName)}`);
}

/**
 * Send student skills + target role to get a skill gap analysis.
 * @param {string[]} studentSkills
 * @param {string}   targetRole
 */
async function fetchSkillGap(studentSkills, targetRole) {
  try {
    return await apiPost("/api/skill-gap", {
      student_skills: studentSkills,
      target_role: targetRole,
    });
  } catch (error) {
    if (error instanceof TypeError && typeof analyzeSkillGapLocally === "function") {
      return analyzeSkillGapLocally(studentSkills, targetRole);
    }
    throw error;
  }
}

/**
 * Get ML-powered skill recommendations.
 * @param {string[]} studentSkills
 * @param {string}   targetRole  (optional)
 */
async function fetchRecommendations(studentSkills, targetRole = "") {
  return apiPost("/api/recommendations", {
    student_skills: studentSkills,
    target_role: targetRole,
  });
}

/** Fetch ML model metadata (type, accuracy, disclaimer) */
async function fetchModelInfo() {
  return apiGet("/api/model-info");
}

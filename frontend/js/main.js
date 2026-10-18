// main.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point for the SkillTor frontend.
// Handles:
//   • Tab navigation
//   • Dashboard initialisation
//   • Skill gap analysis logic
//   • Recommendation logic
//
// This file depends on: api.js, charts.js, ui.js (all loaded before this)
// ─────────────────────────────────────────────────────────────────────────────

// ── Global state ──────────────────────────────────────────────────────────────
let allRoles       = [];          // all job role names from the API
let allTopSkills   = [];          // top skills (used for radar chart)
let mySkills       = [];          // student skills for gap analysis
let myRecSkills    = [];          // student skills for recommendations

// ── Tab navigation ────────────────────────────────────────────────────────────

/**
 * Switch visible tab section.
 * Called by onclick on the nav buttons.
 */
function switchTab(tabName) {
  // Hide all sections
  document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
  // Deactivate all nav buttons
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  // Show the target section
  document.getElementById(`tab-${tabName}`).classList.add("active");
  // Activate the matching nav button
  const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add("active");
}

// ── App initialisation ────────────────────────────────────────────────────────

/**
 * Main entry point — called once when the page loads.
 * Loads all data needed for the dashboard.
 */
async function init() {
  const results = await Promise.allSettled([
    fetchTopSkills(15),
    fetchSkillCategories(),
    fetchTrendingSkills(),
    fetchJobRoles(),
    fetchGroupedJobRoles(),
  ]);
  const valueOr = (index, fallback) =>
    results[index].status === "fulfilled" ? results[index].value : fallback;
  const topSkills = valueOr(0, LOCAL_DASHBOARD_DATA.topSkills);
  const categories = valueOr(1, LOCAL_DASHBOARD_DATA.categories);
  const trending = valueOr(2, LOCAL_DASHBOARD_DATA.trending);
  const groupedRoles = valueOr(4, getLocalGroupedRoles());
  const roles = valueOr(3, Object.values(groupedRoles).flatMap(domains => Object.values(domains).flat()));

  allTopSkills = topSkills;
  allRoles = roles;

  setKpi("kpi-roles", roles.length);
  setKpi("kpi-skills", "100+");
  setKpi("kpi-trending", trending.length);
  setKpi("kpi-top-skill", topSkills[0]?.skill || "—");

  if (typeof Chart !== "undefined") {
    renderTopSkillsChart(topSkills);
    renderCategoryChart(categories);
  } else {
    renderMetricBars("chart-top-skills-fallback", topSkills.slice(0, 10).map(skill => ({
      label: skill.skill, value: skill.demand_score,
    })));
    renderMetricBars("chart-categories-fallback", categories.map(category => ({
      label: category.category, value: category.avg_demand,
    })));
    document.getElementById("chart-top-skills").classList.add("hidden");
    document.getElementById("chart-categories").classList.add("hidden");
    document.getElementById("chart-top-skills-fallback").classList.remove("hidden");
    document.getElementById("chart-categories-fallback").classList.remove("hidden");
  }
  renderTrendingPills(trending);
  populateRoleSelect("rec-role-select", groupedRoles);
  initGeographicViews();

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.warn(`[SkillTor] Dashboard API request ${index + 1} failed; using sample data.`, result.reason);
    }
  });
}

function getLocalGroupedRoles() {
  const grouped = {};
  document.querySelectorAll("#gap-role-select optgroup[data-domain]").forEach(group => {
    const [sector, domain] = group.dataset.domain.split("::");
    if (!grouped[sector]) grouped[sector] = {};
    grouped[sector][domain] = Array.from(group.querySelectorAll("option"), option => option.value);
  });
  return grouped;
}

function renderMetricBars(containerId, entries) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.replaceChildren();
  entries.forEach(({ label, value }) => {
    const row = document.createElement("div");
    row.className = "metric-bar-row";
    const caption = document.createElement("div");
    caption.className = "metric-bar-caption";
    const name = document.createElement("span");
    name.textContent = label;
    const score = document.createElement("strong");
    score.textContent = value;
    caption.append(name, score);
    const track = document.createElement("div");
    track.className = "metric-bar-track";
    const fill = document.createElement("div");
    fill.className = "metric-bar-fill";
    fill.style.width = `${Math.min(100, Math.max(0, Number(value)))}%`;
    track.appendChild(fill);
    row.append(caption, track);
    container.appendChild(row);
  });
}

function initGeographicViews() {
  const sectorSelect = document.getElementById("state-sector-select");
  const stateSelect = document.getElementById("district-state-select");
  const districtSelect = document.getElementById("district-select");

  LOCAL_DASHBOARD_DATA.sectors.forEach(sector => {
    const option = document.createElement("option");
    option.value = sector;
    option.textContent = sector;
    sectorSelect.appendChild(option);
  });
  LOCAL_DASHBOARD_DATA.states.forEach(state => {
    const option = document.createElement("option");
    option.value = state.name;
    option.textContent = state.name;
    stateSelect.appendChild(option);
  });
  sectorSelect.addEventListener("change", renderStateSectorComparison);
  stateSelect.addEventListener("change", populateDistrictOptions);
  districtSelect.addEventListener("change", renderDistrictAnalysis);

  renderStateSectorComparison();
  populateDistrictOptions();
}

function renderStateSectorComparison() {
  const selectedSector = document.getElementById("state-sector-select").value;
  const sectorIndex = LOCAL_DASHBOARD_DATA.sectors.indexOf(selectedSector);
  const rankedStates = LOCAL_DASHBOARD_DATA.states
    .map(state => ({ name: state.name, value: state.scores[sectorIndex] }))
    .sort((a, b) => b.value - a.value);

  document.getElementById("state-sector-title").textContent = `${selectedSector} demand by state`;
  renderMetricBars("state-sector-bars", rankedStates.map(state => ({
    label: state.name, value: state.value,
  })));

  const tbody = document.getElementById("state-sector-table");
  tbody.replaceChildren();
  rankedStates.forEach((state, index) => {
    const row = tbody.insertRow();
    [index + 1, state.name, selectedSector, state.value].forEach(value => {
      row.insertCell().textContent = value;
    });
  });
}

function populateDistrictOptions() {
  const stateName = document.getElementById("district-state-select").value
    || LOCAL_DASHBOARD_DATA.states[0].name;
  const state = LOCAL_DASHBOARD_DATA.states.find(item => item.name === stateName);
  const select = document.getElementById("district-select");
  select.replaceChildren();
  state.districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district.name;
    option.textContent = district.name;
    select.appendChild(option);
  });
  renderDistrictAnalysis();
}

function renderDistrictAnalysis() {
  const stateName = document.getElementById("district-state-select").value
    || LOCAL_DASHBOARD_DATA.states[0].name;
  const state = LOCAL_DASHBOARD_DATA.states.find(item => item.name === stateName);
  const districtName = document.getElementById("district-select").value;
  const district = state.districts.find(item => item.name === districtName) || state.districts[0];
  const scores = LOCAL_DASHBOARD_DATA.sectors.map((sector, index) => ({
    sector,
    score: Math.max(0, Math.min(100, state.scores[index] + district.adjustments[index])),
  })).sort((a, b) => b.score - a.score);

  document.getElementById("district-demand").textContent = district.demand;
  document.getElementById("district-openings").textContent = district.openings.toLocaleString();
  document.getElementById("district-leading-sector").textContent = scores[0].sector;
  document.getElementById("district-sector-title").textContent = `${district.name}, ${state.name} — sector profile`;
  renderMetricBars("district-sector-bars", scores.map(item => ({
    label: item.sector, value: item.score,
  })));

  const tbody = document.getElementById("district-sector-table");
  tbody.replaceChildren();
  scores.forEach(item => {
    const row = tbody.insertRow();
    row.insertCell().textContent = item.sector;
    row.insertCell().textContent = item.score;
  });
}

/** Filter the preloaded job-role options by the selected industry and specialization. */
function updateGapRoleSelect() {
  const domainSelect = document.getElementById("gap-domain-select");
  const roleSelect = document.getElementById("gap-role-select");
  const selectedDomain = domainSelect.value;
  roleSelect.value = "";
  Array.from(roleSelect.querySelectorAll("optgroup[data-domain]")).forEach(group => {
    group.hidden = Boolean(selectedDomain) && group.dataset.domain !== selectedDomain;
  });
  document.getElementById("gap-results-panel").classList.add("hidden");
}

// ── Skill Gap Analysis ────────────────────────────────────────────────────────

/**
 * Add a skill typed into #skill-input to the mySkills array.
 * Also handles pressing Enter in the input.
 */
function addSkill() {
  const input = document.getElementById("skill-input");
  const skillText = input.value.trim();
  if (!skillText) return;

  // Avoid duplicates (case-insensitive)
  if (mySkills.some(s => s.toLowerCase() === skillText.toLowerCase())) {
    input.value = "";
    return;
  }

  mySkills.push(skillText);
  input.value = "";
  renderSkillPills(mySkills, "my-skills-pills", removeSkill);
}

/** Remove a skill from the gap analysis list. */
function removeSkill(skillName) {
  mySkills = mySkills.filter(s => s !== skillName);
  renderSkillPills(mySkills, "my-skills-pills", removeSkill);
}

/** Clear all skills from the gap analysis list. */
function clearSkills() {
  mySkills = [];
  renderSkillPills(mySkills, "my-skills-pills", removeSkill);
  document.getElementById("gap-results-panel").classList.add("hidden");
}

/** Run the gap analysis and show results. */
async function runGapAnalysis() {
  const targetRole = document.getElementById("gap-role-select").value;
  if (!targetRole) {
    alert("Please select a target job role.");
    return;
  }
  if (mySkills.length === 0) {
    alert("Please add at least one skill before running the analysis.");
    return;
  }

  document.getElementById("gap-results-panel").classList.add("hidden");

  try {
    const gap = await fetchSkillGap(mySkills, targetRole);
    renderGapResults(gap);
  } catch (err) {
    console.error("[Gap Analysis]", err);
    alert(`Analysis failed: ${err.message}`);
  }
}

// Allow pressing Enter in the skill input to add the skill
document.addEventListener("DOMContentLoaded", () => {
  const skillInput = document.getElementById("skill-input");
  if (skillInput) {
    skillInput.addEventListener("keydown", e => {
      if (e.key === "Enter") addSkill();
    });
  }

  const recInput = document.getElementById("rec-skill-input");
  if (recInput) {
    recInput.addEventListener("keydown", e => {
      if (e.key === "Enter") addRecSkill();
    });
  }
});

// ── Recommendations (Tab 4) ───────────────────────────────────────────────────

/** Add a skill to the recommendations panel. */
function addRecSkill() {
  const input = document.getElementById("rec-skill-input");
  const skillText = input.value.trim();
  if (!skillText) return;

  if (myRecSkills.some(s => s.toLowerCase() === skillText.toLowerCase())) {
    input.value = "";
    return;
  }

  myRecSkills.push(skillText);
  input.value = "";
  renderSkillPills(myRecSkills, "rec-skills-pills", removeRecSkill);
}

/** Remove a skill from the recommendation list. */
function removeRecSkill(skillName) {
  myRecSkills = myRecSkills.filter(s => s !== skillName);
  renderSkillPills(myRecSkills, "rec-skills-pills", removeRecSkill);
}

/** Call the ML recommendation API and display results. */
async function getRecommendations() {
  if (myRecSkills.length === 0) {
    alert("Please add at least one skill to get recommendations.");
    return;
  }

  document.getElementById("rec-results").classList.add("hidden");

  const targetRole = document.getElementById("rec-role-select").value;

  try {
    const data = await fetchRecommendations(myRecSkills, targetRole);
    renderRecommendationResults(data);

    // Draw the radar chart using the globally stored top skills
    if (allTopSkills.length > 0) {
      renderRadarChart(myRecSkills, allTopSkills);
    }
  } catch (err) {
    console.error("[Recommendations]", err);
    alert(`Recommendation failed: ${err.message}`);
  }
}

/** Load and display model metadata in the disclaimer card. */
async function loadModelInfo() {
  try {
    const info = await fetchModelInfo();
    renderModelInfo(info);
  } catch (err) {
    document.getElementById("model-info-panel").classList.remove("hidden");
    document.getElementById("model-info-panel").innerHTML =
      `<div class="error-msg">Could not load model info: ${err.message}</div>`;
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
// Start the app as soon as the page is ready
window.addEventListener("DOMContentLoaded", init);

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
  if (tabName === "sector-comparison") {
    requestAnimationFrame(() => {
      chartInstances["chart-state-sector-balance"]?.resize();
      chartInstances["chart-sector-skill-history"]?.resize();
    });
  }
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

function renderStateSectorBalanceFallback(states) {
  const canvas = document.getElementById("chart-state-sector-balance");
  const container = document.getElementById("chart-state-sector-balance-fallback");
  canvas.classList.add("hidden");
  container.classList.remove("hidden");
  container.replaceChildren();

  states.forEach(item => {
    const row = document.createElement("div");
    row.className = "market-fallback-row";
    const label = document.createElement("strong");
    label.textContent = item.label;
    row.appendChild(label);

    [["Demand", item.demand, "demand"], ["Supply", item.supply, "supply"]].forEach(([name, value, type]) => {
      const track = document.createElement("div");
      track.className = `market-fallback-track ${type}`;
      track.setAttribute("aria-label", `${name}: ${value}`);
      const fill = document.createElement("div");
      fill.className = "market-fallback-fill";
      fill.style.width = `${value}%`;
      track.appendChild(fill);
      row.appendChild(track);
    });
    container.appendChild(row);
  });
}

function renderSectorSkillHistoryFallback(years, skills) {
  const canvas = document.getElementById("chart-sector-skill-history");
  const container = document.getElementById("chart-sector-skill-history-fallback");
  canvas.classList.add("hidden");
  container.classList.remove("hidden");
  container.replaceChildren();

  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 1000 440");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Illustrative demand-index trends from ${years[0]} through ${years[years.length - 1]}`);
  const colors = ["#376992", "#299e98", "#61b77a", "#dd9635", "#df604b"];
  const left = 68;
  const right = 970;
  const top = 24;
  const bottom = 320;
  const x = index => left + (right - left) * index / (years.length - 1);
  const y = value => bottom - (bottom - top) * value / 100;

  [0, 25, 50, 75, 100].forEach(value => {
    const line = document.createElementNS(namespace, "line");
    line.setAttribute("x1", left);
    line.setAttribute("x2", right);
    line.setAttribute("y1", y(value));
    line.setAttribute("y2", y(value));
    line.setAttribute("class", "history-grid");
    svg.appendChild(line);
    const label = document.createElementNS(namespace, "text");
    label.setAttribute("x", left - 12);
    label.setAttribute("y", y(value) + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "history-axis-label");
    label.textContent = value;
    svg.appendChild(label);
  });

  years.forEach((year, index) => {
    if (index % 2 !== 0 && index !== years.length - 1) return;
    const label = document.createElementNS(namespace, "text");
    label.setAttribute("x", x(index));
    label.setAttribute("y", bottom + 24);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "history-axis-label");
    label.textContent = year;
    svg.appendChild(label);
  });

  skills.forEach((item, index) => {
    const polyline = document.createElementNS(namespace, "polyline");
    polyline.setAttribute("points", item.values.map((value, yearIndex) =>
      `${x(yearIndex)},${y(value)}`
    ).join(" "));
    polyline.setAttribute("stroke", colors[index % colors.length]);
    polyline.setAttribute("class", "history-series");
    svg.appendChild(polyline);

    const legendX = left + (index % 3) * 300;
    const legendY = 380 + Math.floor(index / 3) * 26;
    const swatch = document.createElementNS(namespace, "line");
    swatch.setAttribute("x1", legendX);
    swatch.setAttribute("x2", legendX + 20);
    swatch.setAttribute("y1", legendY);
    swatch.setAttribute("y2", legendY);
    swatch.setAttribute("stroke", colors[index % colors.length]);
    swatch.setAttribute("class", "history-series");
    svg.appendChild(swatch);

    const label = document.createElementNS(namespace, "text");
    label.setAttribute("x", legendX + 28);
    label.setAttribute("y", legendY + 4);
    label.setAttribute("class", "history-legend-label");
    label.textContent = item.skill;
    svg.appendChild(label);
  });

  container.appendChild(svg);
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
  INDIAN_STATE_DISTRICTS.forEach(state => {
    const option = document.createElement("option");
    option.value = state.state;
    option.textContent = state.state;
    stateSelect.appendChild(option);
  });
  stateSelect.value = LOCAL_DASHBOARD_DATA.states[0]?.name
    || INDIAN_STATE_DISTRICTS[0].state;
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
    .map(state => ({
      name: state.name,
      demand: state.scores[sectorIndex],
      supply: state.supplyScores[sectorIndex],
    }))
    .sort((a, b) => b.demand - a.demand);

  document.getElementById("state-sector-title").textContent = `${selectedSector} demand vs available supply by state`;
  const skillHistory = LOCAL_DASHBOARD_DATA.skillDemandHistory.sectors[selectedSector];
  if (!skillHistory) {
    throw new Error(`No historical skill-demand series found for sector "${selectedSector}".`);
  }
  document.getElementById("sector-history-title").textContent =
    `${selectedSector} skill-demand trends (2016–2025)`;
  if (typeof Chart !== "undefined") {
    renderSectorSkillHistoryChart(LOCAL_DASHBOARD_DATA.skillDemandHistory.years, skillHistory);
  } else {
    renderSectorSkillHistoryFallback(LOCAL_DASHBOARD_DATA.skillDemandHistory.years, skillHistory);
  }

  if (typeof Chart !== "undefined") {
    renderStateSectorBalanceChart(rankedStates.map(state => ({
      label: state.name, demand: state.demand, supply: state.supply,
    })));
  } else {
    renderStateSectorBalanceFallback(rankedStates.map(state => ({
      label: state.name, demand: state.demand, supply: state.supply,
    })));
  }

  const tbody = document.getElementById("state-sector-table");
  tbody.replaceChildren();
  rankedStates.forEach((state, index) => {
    const row = tbody.insertRow();
    [index + 1, state.name, selectedSector, state.demand, state.supply].forEach(value => {
      row.insertCell().textContent = value;
    });
  });
}

function populateDistrictOptions() {
  const stateName = document.getElementById("district-state-select").value;
  const state = INDIAN_STATE_DISTRICTS.find(item => item.state === stateName);
  if (!state) {
    throw new Error(`No district directory found for state or territory "${stateName}".`);
  }

  const select = document.getElementById("district-select");
  const previousDistrict = select.value;
  select.replaceChildren();
  state.districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    select.appendChild(option);
  });
  if (state.districts.includes(previousDistrict)) {
    select.value = previousDistrict;
  } else {
    const sampleDistrict = LOCAL_DASHBOARD_DATA.states
      .find(item => item.name === stateName)?.districts[0]?.name;
    if (sampleDistrict && state.districts.includes(sampleDistrict)) {
      select.value = sampleDistrict;
    }
  }
  renderDistrictAnalysis();
}

function renderDistrictAnalysis() {
  const stateName = document.getElementById("district-state-select").value;
  const state = INDIAN_STATE_DISTRICTS.find(item => item.state === stateName);
  if (!state) {
    throw new Error(`No district directory found for state or territory "${stateName}".`);
  }

  const districtName = document.getElementById("district-select").value;
  const sampleState = LOCAL_DASHBOARD_DATA.states.find(item => item.name === stateName);
  const sampleDistrict = sampleState?.districts.find(item => item.name === districtName);
  const baseScores = sampleState?.scores || LOCAL_DASHBOARD_DATA.sectors.map((_, index) =>
    Math.round(LOCAL_DASHBOARD_DATA.states.reduce((total, item) => total + item.scores[index], 0)
      / LOCAL_DASHBOARD_DATA.states.length));
  const sample = getDistrictSample(stateName, districtName, baseScores, sampleDistrict);
  const scores = LOCAL_DASHBOARD_DATA.sectors.map((sector, index) => ({
    sector,
    score: Math.max(0, Math.min(100, baseScores[index] + sample.adjustments[index])),
  })).sort((a, b) => b.score - a.score);

  document.getElementById("district-demand").textContent = sample.demand;
  document.getElementById("district-openings").textContent = sample.openings.toLocaleString();
  document.getElementById("district-leading-sector").textContent = scores[0].sector;
  document.getElementById("district-sector-title").textContent = `${districtName}, ${stateName} — sector profile`;
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

function getDistrictSample(stateName, districtName, baseScores, sampleDistrict) {
  if (sampleDistrict) return sampleDistrict;

  let hash = 0;
  for (const character of `${stateName}:${districtName}`) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const adjustments = LOCAL_DASHBOARD_DATA.sectors.map((_, index) =>
    ((hash >>> (index * 3)) % 9) - 4);
  const averageScore = baseScores.reduce((total, score) => total + score, 0)
    / baseScores.length;
  const demand = Math.max(50, Math.min(95, Math.round(averageScore + (hash % 15) - 7)));

  return {
    demand,
    openings: Math.round((demand * 180 + (hash % 500)) / 100) * 100,
    adjustments,
  };
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

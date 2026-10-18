// ui.js
// ─────────────────────────────────────────────────────────────────────────────
// DOM helpers — everything that reads/writes the page lives here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show a loading spinner inside an element.
 * @param {string} elementId  - ID of the container element
 */
function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = `<span class="spinner"></span> Loading…`;
}

/**
 * Show an error message inside an element.
 * @param {string} elementId
 * @param {string} message
 */
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = `<div class="error-msg">⚠️ ${message}</div>`;
}

// ── KPI card updaters ─────────────────────────────────────────────────────────

function setKpi(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ── Trending pills ────────────────────────────────────────────────────────────

/**
 * Render trending skills as coloured pills in #trending-pills.
 * @param {Array} skills  - array of { skill, demand_score, category }
 */
function renderTrendingPills(skills) {
  const container = document.getElementById("trending-pills");
  if (!container) return;

  if (!skills || skills.length === 0) {
    container.innerHTML = `<span class="pill-empty">No trending data</span>`;
    return;
  }

  container.innerHTML = skills
    .map(s => `
      <span class="pill rising" title="Demand: ${s.demand_score} | ${s.category}">
        📈 ${s.skill} <small>(${s.demand_score})</small>
      </span>
    `)
    .join("");
}

// ── Role selector population ──────────────────────────────────────────────────

/**
 * Populate a <select> element with job roles grouped by sector and domain.
 * @param {string}   selectId - ID of the <select>
 * @param {Object<string, Object<string, string[]>>} groupedRoles
 */
function populateRoleSelect(selectId, groupedRoles) {
  const select = document.getElementById(selectId);
  if (!select) return;
  // Keep the first placeholder option, remove the rest
  select.innerHTML = select.options[0].outerHTML;

  Object.entries(groupedRoles).forEach(([sector, domains]) => {
    Object.entries(domains).forEach(([domain, roles]) => {
      const group = document.createElement("optgroup");
      group.label = `${sector} — ${domain}`;
      roles.forEach(role => {
        const option = document.createElement("option");
        option.value = role;
        option.textContent = role;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  });
}

// ── Skill pill input helpers ──────────────────────────────────────────────────

/**
 * Render the current list of student skills as removable pills.
 * @param {string[]} skills      - current skills array
 * @param {string}   pillsId     - container element ID
 * @param {Function} onRemove    - callback(skillName) when × is clicked
 */
function renderSkillPills(skills, pillsId, onRemove) {
  const container = document.getElementById(pillsId);
  if (!container) return;

  if (skills.length === 0) {
    container.innerHTML = `<span class="pill-empty">No skills added yet</span>`;
    return;
  }

  container.replaceChildren();
  skills.forEach(skill => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.append(document.createTextNode(skill));

    const removeButton = document.createElement("button");
    removeButton.className = "remove-btn";
    removeButton.type = "button";
    removeButton.title = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${skill}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => onRemove(skill));
    pill.appendChild(removeButton);
    container.appendChild(pill);
  });
}

// ── Gap analysis results ──────────────────────────────────────────────────────

/**
 * Render the full skill gap analysis results panel (tab 3).
 * @param {object} gap - response from /api/skill-gap
 */
function renderGapResults(gap) {
  // Show results panel
  document.getElementById("gap-results-panel").classList.remove("hidden");

  const coverage = gap.coverage_score;

  // Role name
  document.getElementById("gap-role-name").textContent = gap.target_role;

  // Coverage bar
  const bar = document.getElementById("coverage-bar");
  bar.style.width = coverage + "%";
  // Colour: green ≥ 60, amber 30–60, red < 30
  bar.style.background =
    coverage >= 60 ? "linear-gradient(90deg, #16a34a, #4ade80)"
    : coverage >= 30 ? "linear-gradient(90deg, #d97706, #fbbf24)"
    : "linear-gradient(90deg, #dc2626, #f87171)";

  document.getElementById("coverage-label").textContent = coverage + "%";
  document.getElementById("coverage-label").style.color =
    coverage >= 60 ? "#16a34a" : coverage >= 30 ? "#d97706" : "#dc2626";

  // Stats
  document.getElementById("stat-matched").textContent = gap.matched_skills.length;
  document.getElementById("stat-missing").textContent = gap.missing_skills.length;
  document.getElementById("stat-total").textContent   = gap.total_required_skills;

  // Charts are optional: the gap calculation and lists must work without the CDN.
  const donutCard = document.getElementById("chart-gap-donut").closest(".chart-card");
  const missingChartCard = document.getElementById("chart-missing-skills").closest(".chart-card");
  const chartsAvailable = typeof Chart !== "undefined";
  donutCard.closest(".charts-row").classList.toggle("hidden", !chartsAvailable);
  donutCard.classList.toggle("hidden", !chartsAvailable);
  if (chartsAvailable) renderGapDonut(coverage);

  const hasDemandScores = gap.missing_skills.length > 0
    && gap.missing_skills.every(skill => Number.isFinite(skill.demand_score));
  missingChartCard.classList.toggle("hidden", !chartsAvailable || !hasDemandScores);
  if (chartsAvailable && hasDemandScores) {
    renderMissingSkillsChart(gap.missing_skills);
  } else if (typeof destroyChart === "function") {
    destroyChart("chart-missing-skills");
  }

  // Matched skills list
  const matchedList = document.getElementById("matched-skills-list");
  matchedList.innerHTML = gap.matched_skills.length > 0
    ? gap.matched_skills.map(s => `
        <li>
          <span class="skill-name">✅ ${s.name}</span>
          ${Number.isFinite(s.demand_score) ? `<span class="skill-score">Score: ${s.demand_score}</span>` : ""}
        </li>
      `).join("")
    : `<li><span class="pill-empty">None of the required skills matched</span></li>`;

  // Missing skills list
  const missingList = document.getElementById("missing-skills-list");
  missingList.innerHTML = gap.missing_skills.length > 0
    ? gap.missing_skills.map((s, i) => `
        <li>
          <span class="skill-name">${i + 1}. ${s.name}</span>
          ${Number.isFinite(s.demand_score) ? `<span class="skill-score">Score: ${s.demand_score}</span>` : ""}
        </li>
      `).join("")
    : `<li><span class="pill-empty">🎉 You have all required skills!</span></li>`;

  const offlineNote = document.getElementById("gap-offline-note");
  if (offlineNote) offlineNote.classList.toggle("hidden", !gap.offline_mode);
}

// ── Recommendation results ────────────────────────────────────────────────────

/**
 * Render recommendation results (tab 4).
 * @param {object} data - response from /api/recommendations
 */
function renderRecommendationResults(data) {
  document.getElementById("rec-results").classList.remove("hidden");

  const ml = data.ml_recommendation;

  // Top pick
  document.getElementById("top-pick-skill").textContent = ml.recommended_skill || "—";
  document.getElementById("top-pick-confidence").textContent =
    ml.confidence != null ? `${ml.confidence}%` : "—";

  // ML top-3
  const ml3Container = document.getElementById("ml-top3");
  const medals = ["🥇", "🥈", "🥉"];
  if (ml.top_recommendations && ml.top_recommendations.length > 0) {
    ml3Container.innerHTML = ml.top_recommendations
      .map((r, i) => `
        <div class="rec-card">
          <div class="rec-card-rank">${medals[i] || "🔹"}</div>
          <div class="rec-card-skill">${r.skill}</div>
          <div class="rec-card-conf">Confidence: ${r.confidence}% <span class="confidence-note">(sample model)</span></div>
        </div>
      `)
      .join("");
  } else {
    ml3Container.innerHTML = `<p class="pill-empty">No recommendations available</p>`;
  }

  // Gap-based recommendations (only if target role was given)
  const gapContainer = document.getElementById("gap-rec-list");
  const gapCard = document.getElementById("gap-rec-card");
  if (data.gap_based_recommendations && data.gap_based_recommendations.length > 0) {
    gapCard.classList.remove("hidden");
    gapContainer.innerHTML = data.gap_based_recommendations
      .map((s, i) => `
        <div class="rec-card">
          <div class="rec-card-rank">${i + 1}</div>
          <div class="rec-card-skill">${s.name}</div>
          <div class="rec-card-demand">Demand: ${s.demand_score}/100</div>
          <div class="rec-card-category">${s.category} · ${s.growth_trend}</div>
        </div>
      `)
      .join("");
  } else {
    gapCard.classList.add("hidden");
  }
}

// ── Model info panel ──────────────────────────────────────────────────────────

/**
 * Render model metadata inside #model-info-panel.
 * @param {object} info - response from /api/model-info
 */
function renderModelInfo(info) {
  const panel = document.getElementById("model-info-panel");
  panel.classList.remove("hidden");

  const testAcc = info.test_accuracy_percent;
  const accClass = testAcc >= 70 ? "accuracy-good" : "accuracy-warn";

  panel.innerHTML = `
    <p style="font-size:0.8rem;color:#92400e;margin-bottom:.75rem;">
      ⚠️ ${info.data_disclaimer}
    </p>
    <div class="model-info-grid">
      <div class="model-info-item">
        <div class="model-info-key">Model Type</div>
        <div class="model-info-value">${info.model_type}</div>
      </div>
      <div class="model-info-item">
        <div class="model-info-key">Trees (estimators)</div>
        <div class="model-info-value">${info.n_estimators}</div>
      </div>
      <div class="model-info-item">
        <div class="model-info-key">Max Depth</div>
        <div class="model-info-value">${info.max_depth}</div>
      </div>
      <div class="model-info-item">
        <div class="model-info-key">Training Samples</div>
        <div class="model-info-value">${info.training_samples}</div>
      </div>
      <div class="model-info-item">
        <div class="model-info-key">Train Accuracy</div>
        <div class="model-info-value">${info.train_accuracy_percent}%</div>
      </div>
      <div class="model-info-item">
        <div class="model-info-key">Test Accuracy <small>(honest)</small></div>
        <div class="model-info-value ${accClass}">${testAcc}%</div>
      </div>
    </div>
    <p style="font-size:0.78rem;color:#64748b;margin-top:.5rem;">
      Features used: ${info.features.join(", ")}
    </p>
  `;
}

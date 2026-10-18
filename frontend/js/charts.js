// charts.js
// ─────────────────────────────────────────────────────────────────────────────
// All Chart.js chart creation lives here.
// Each function accepts a canvas ID and data, then draws or updates the chart.
// ─────────────────────────────────────────────────────────────────────────────

// Store chart instances so we can destroy/recreate them without memory leaks
const chartInstances = {};

/**
 * Destroy an existing chart before recreating it.
 * This prevents "Canvas is already in use" errors.
 */
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ── Colour helpers ────────────────────────────────────────────────────────────

/** Generate a palette of indigo/blue shades for bar charts. */
function generateBarColors(count) {
  const base = [
    "#4f46e5","#6366f1","#818cf8","#3730a3","#7c3aed",
    "#8b5cf6","#a78bfa","#2563eb","#3b82f6","#60a5fa",
    "#0ea5e9","#38bdf8","#06b6d4","#14b8a6","#10b981",
  ];
  return Array.from({ length: count }, (_, i) => base[i % base.length]);
}

// ── Chart creators ────────────────────────────────────────────────────────────

/**
 * Horizontal bar chart: Top Skills by Demand Score
 * @param {Array} skills  - array of { skill, demand_score, category, growth_trend }
 */
function renderTopSkillsChart(skills) {
  destroyChart("chart-top-skills");
  const ctx = document.getElementById("chart-top-skills").getContext("2d");

  const labels = skills.map(s => s.skill);
  const scores = skills.map(s => s.demand_score);
  const colors = generateBarColors(skills.length);

  chartInstances["chart-top-skills"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Demand Score (sample data)",
        data: scores,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",   // horizontal bar chart
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Score: ${ctx.raw} / 100`,
          },
        },
      },
      scales: {
        x: {
          min: 50,
          max: 100,
          ticks: { font: { size: 11 } },
          grid: { color: "#f1f5f9" },
        },
        y: { ticks: { font: { size: 11 } } },
      },
    },
  });
}

/**
 * Doughnut chart: Skill demand by category
 * @param {Array} categories  - array of { category, avg_demand }
 */
function renderCategoryChart(categories) {
  destroyChart("chart-categories");
  const ctx = document.getElementById("chart-categories").getContext("2d");

  const labels = categories.map(c => c.category);
  const values = categories.map(c => c.avg_demand);

  chartInstances["chart-categories"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: generateBarColors(labels.length),
        borderWidth: 2,
        borderColor: "#fff",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            label: ctx => ` Avg demand: ${ctx.raw}`,
          },
        },
      },
    },
  });
}

/**
 * Line chart: compare estimated demand and available supply by state.
 * @param {Array} states - array of { label, demand, supply }
 */
function renderStateSectorBalanceChart(states) {
  destroyChart("chart-state-sector-balance");
  const ctx = document.getElementById("chart-state-sector-balance").getContext("2d");

  chartInstances["chart-state-sector-balance"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: states.map(item => item.label),
      datasets: [
        {
          label: "Demand",
          data: states.map(item => item.demand),
          borderColor: "#376992",
          backgroundColor: "#376992",
          pointBackgroundColor: "#376992",
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          tension: 0.35,
        },
        {
          label: "Supply",
          data: states.map(item => item.supply),
          borderColor: "#299e98",
          backgroundColor: "#299e98",
          pointBackgroundColor: "#299e98",
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` ${context.dataset.label}: ${Number(context.raw).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", maxRotation: 20, minRotation: 0 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "#64748b",
          },
          grid: { color: "#d7e4ed", borderDash: [4, 4] },
        },
      },
    },
  });
}

/**
 * Line chart: illustrative ten-year demand trends for sector-specific skills.
 * @param {string[]} years - consecutive historical calendar years
 * @param {Array} skills - array of { skill, values }
 */
function renderSectorSkillHistoryChart(years, skills) {
  destroyChart("chart-sector-skill-history");
  const canvas = document.getElementById("chart-sector-skill-history");
  canvas.classList.remove("hidden");
  document.getElementById("chart-sector-skill-history-fallback").classList.add("hidden");

  const colors = ["#376992", "#299e98", "#61b77a", "#dd9635", "#df604b"];
  chartInstances["chart-sector-skill-history"] = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: years,
      datasets: skills.map((item, index) => ({
        label: item.skill,
        data: item.values,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2.5,
        tension: 0.3,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 18, padding: 14 } },
        tooltip: {
          callbacks: {
            label: context => ` ${context.dataset.label}: ${context.raw}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", maxRotation: 0 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Illustrative demand index" },
          ticks: { color: "#64748b", stepSize: 25 },
          grid: { color: "#d7e4ed", borderDash: [4, 4] },
        },
      },
    },
  });
}

/**
 * Doughnut chart: skill gap coverage (have vs missing)
 * @param {number} covered  - percentage of skills covered (0–100)
 */
function renderGapDonut(covered) {
  destroyChart("chart-gap-donut");
  const ctx = document.getElementById("chart-gap-donut").getContext("2d");

  chartInstances["chart-gap-donut"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Skills You Have", "Skills to Learn"],
      datasets: [{
        data: [covered, 100 - covered],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderWidth: 3,
        borderColor: "#fff",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toFixed(1)}%` } },
      },
    },
  });
}

/**
 * Horizontal bar chart: missing skills sorted by demand score
 * @param {Array} missingSkills  - array of { name, demand_score }
 */
function renderMissingSkillsChart(missingSkills) {
  destroyChart("chart-missing-skills");
  const ctx = document.getElementById("chart-missing-skills").getContext("2d");

  const labels = missingSkills.map(s => s.name);
  const scores = missingSkills.map(s => s.demand_score);

  chartInstances["chart-missing-skills"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Demand Score",
        data: scores,
        backgroundColor: "#dc2626",
        borderRadius: 5,
        borderSkipped: false,
        opacity: 0.8,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Score: ${ctx.raw}` } },
      },
      scales: {
        x: { min: 50, max: 100, grid: { color: "#f1f5f9" } },
      },
    },
  });
}

/**
 * Radar chart: compare student skills against top-8 high-demand skills.
 * @param {string[]} studentSkills  - skills the student knows
 * @param {Array}    topSkills      - array of top skill objects { skill, demand_score }
 */
function renderRadarChart(studentSkills, topSkills) {
  destroyChart("chart-radar");
  const ctx = document.getElementById("chart-radar").getContext("2d");

  // Pick top 8 skills for the radar axes
  const top8 = topSkills.slice(0, 8);
  const labels = top8.map(s => s.skill);

  // Student vector: 100 if they know the skill, 0 if not
  const studentLower = studentSkills.map(s => s.toLowerCase());
  const studentValues = top8.map(s =>
    studentLower.includes(s.skill.toLowerCase()) ? 100 : 0
  );

  // Ideal vector: the actual demand score (what the market wants)
  const idealValues = top8.map(s => s.demand_score);

  chartInstances["chart-radar"] = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Your Skills",
          data: studentValues,
          backgroundColor: "rgba(79,70,229,0.15)",
          borderColor: "#4f46e5",
          pointBackgroundColor: "#4f46e5",
          borderWidth: 2,
        },
        {
          label: "Market Demand",
          data: idealValues,
          backgroundColor: "rgba(22,163,74,0.1)",
          borderColor: "#16a34a",
          pointBackgroundColor: "#16a34a",
          borderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 25, font: { size: 10 } },
          grid:  { color: "#e2e8f0" },
          pointLabels: { font: { size: 11 } },
        },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

// Clearly simulated values for dashboard views when no API is available.
const LOCAL_DASHBOARD_DATA = {
  topSkills: [
    ["Python", 95, "Programming", "IT & Software"],
    ["JavaScript", 92, "Programming", "IT & Software"],
    ["Git", 91, "Tools", "IT & Software"],
    ["Machine Learning", 90, "AI/ML", "IT & Software"],
    ["AWS", 89, "Cloud", "IT & Software"],
    ["SQL", 88, "Database", "IT & Software"],
    ["Deep Learning", 88, "AI/ML", "IT & Software"],
    ["React", 87, "Web Framework", "IT & Software"],
    ["Azure", 86, "Cloud", "IT & Software"],
    ["TypeScript", 85, "Programming", "IT & Software"],
    ["REST APIs", 85, "Web", "IT & Software"],
    ["NLP", 85, "AI/ML", "IT & Software"],
    ["Docker", 84, "DevOps", "IT & Software"],
    ["Java", 84, "Programming", "IT & Software"],
    ["Pandas", 84, "Data Science", "IT & Software"],
  ].map(([skill, demand_score, category, sector]) => ({
    skill, demand_score, category, sector, growth_trend: "rising",
  })),
  categories: [
    { category: "Programming", avg_demand: 85 },
    { category: "AI/ML", avg_demand: 86 },
    { category: "Cloud", avg_demand: 85 },
    { category: "Analytics", avg_demand: 80 },
    { category: "Web", avg_demand: 82 },
    { category: "Healthcare", avg_demand: 76 },
    { category: "Finance", avg_demand: 78 },
    { category: "Automation", avg_demand: 76 },
    { category: "Agriculture", avg_demand: 73 },
  ],
  trending: [
    { skill: "Python", demand_score: 95, category: "Programming" },
    { skill: "JavaScript", demand_score: 92, category: "Programming" },
    { skill: "Machine Learning", demand_score: 90, category: "AI/ML" },
    { skill: "AWS", demand_score: 89, category: "Cloud" },
    { skill: "Deep Learning", demand_score: 88, category: "AI/ML" },
    { skill: "Azure", demand_score: 86, category: "Cloud" },
    { skill: "TypeScript", demand_score: 85, category: "Programming" },
    { skill: "NLP", demand_score: 85, category: "AI/ML" },
  ],
  sectors: [
    "IT & Software",
    "Healthcare",
    "Manufacturing",
    "Finance & Banking",
    "Marketing & Business",
    "Agriculture",
  ],
  // Sector score order: IT, healthcare, manufacturing, finance, marketing, agriculture.
  states: [
    { name: "Karnataka", scores: [91, 72, 70, 77, 79, 68], districts: [
      { name: "Bengaluru Urban", demand: 93, openings: 18400, adjustments: [5, 0, -2, 2, 3, -3] },
      { name: "Mysuru", demand: 75, openings: 4200, adjustments: [-4, 2, 0, -2, 1, 4] },
      { name: "Belagavi", demand: 72, openings: 3600, adjustments: [-6, 1, 4, -4, -2, 3] },
    ] },
    { name: "Maharashtra", scores: [87, 78, 79, 88, 83, 71], districts: [
      { name: "Mumbai City", demand: 92, openings: 22100, adjustments: [1, 1, -4, 7, 4, -4] },
      { name: "Pune", demand: 88, openings: 16200, adjustments: [6, 0, 4, -2, 2, -3] },
      { name: "Nagpur", demand: 76, openings: 5100, adjustments: [-5, 2, 2, -1, -1, 5] },
    ] },
    { name: "Tamil Nadu", scores: [82, 76, 88, 73, 77, 75], districts: [
      { name: "Chennai", demand: 89, openings: 17200, adjustments: [5, 3, 1, 0, 2, -4] },
      { name: "Coimbatore", demand: 82, openings: 9600, adjustments: [1, 0, 6, -3, 1, 0] },
      { name: "Madurai", demand: 73, openings: 3900, adjustments: [-4, 2, 1, -2, -2, 4] },
    ] },
    { name: "Telangana", scores: [89, 74, 72, 79, 81, 69], districts: [
      { name: "Hyderabad", demand: 92, openings: 19300, adjustments: [5, 2, -2, 2, 3, -4] },
      { name: "Rangareddy", demand: 86, openings: 10700, adjustments: [4, 0, 1, 1, 2, -2] },
      { name: "Warangal", demand: 71, openings: 3400, adjustments: [-5, 1, 0, -3, -2, 5] },
    ] },
    { name: "Gujarat", scores: [76, 71, 86, 78, 79, 79], districts: [
      { name: "Ahmedabad", demand: 87, openings: 12600, adjustments: [2, 2, 3, 2, 2, -2] },
      { name: "Surat", demand: 84, openings: 10100, adjustments: [-1, -1, 5, 0, 4, 1] },
      { name: "Rajkot", demand: 73, openings: 4300, adjustments: [-4, 0, 3, -2, 0, 4] },
    ] },
    { name: "Kerala", scores: [73, 82, 66, 69, 73, 72], districts: [
      { name: "Ernakulam", demand: 84, openings: 9700, adjustments: [3, 4, -4, 1, 2, -1] },
      { name: "Thiruvananthapuram", demand: 80, openings: 7900, adjustments: [4, 3, -5, 1, 1, 0] },
      { name: "Kozhikode", demand: 74, openings: 4800, adjustments: [-2, 2, -3, -1, 0, 3] },
    ] },
    { name: "Uttar Pradesh", scores: [73, 75, 72, 68, 73, 81], districts: [
      { name: "Lucknow", demand: 81, openings: 10400, adjustments: [2, 4, -2, 1, 2, 0] },
      { name: "Gautam Buddha Nagar", demand: 86, openings: 15300, adjustments: [6, 2, 3, 2, 3, -5] },
      { name: "Varanasi", demand: 70, openings: 3700, adjustments: [-3, 1, -2, -2, -1, 4] },
    ] },
    { name: "Delhi", scores: [88, 81, 65, 86, 87, 60], districts: [
      { name: "Central Delhi", demand: 90, openings: 14600, adjustments: [2, 1, -5, 4, 3, -5] },
      { name: "South Delhi", demand: 88, openings: 11200, adjustments: [3, 1, -5, 3, 4, -5] },
      { name: "New Delhi", demand: 91, openings: 13100, adjustments: [1, 2, -6, 5, 4, -5] },
    ] },
  ],
};

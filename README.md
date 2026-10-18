# SkillTor – Smart Skill Demand Predictor

> ⚠️ **Disclaimer:** Dashboard demand scores, regional estimates, and the ML model use sample/simulated data; model predictions are not career advice.

A beginner-friendly full-stack web application that predicts skill demand, analyses skill gaps, and recommends what to learn next — built with **Flask + pandas + scikit-learn + Chart.js**.

---

## 🗂️ Project Structure

```
SkillTor/
├── backend/
│   ├── app.py              ← Flask API server
│   ├── data_processor.py   ← pandas data loading & gap analysis
│   ├── predictor.py        ← scikit-learn Random Forest model
│   └── data/
│       ├── job_roles.csv        ← sample role and skill vocabulary
│       ├── skill_demand.csv     ← 40 sample skills with demand scores
│       └── training_data.csv    ← 50 synthetic training rows for ML
├── frontend/
│   ├── index.html          ← Single-page dashboard
│   ├── css/style.css
│   └── js/
│       ├── dashboard-data.js ← Clearly labeled offline dashboard samples
│       ├── api.js          ← All fetch() calls
│       ├── charts.js       ← Chart.js rendering
│       ├── ui.js           ← DOM helpers
│       └── main.js         ← App logic & entry point
├── requirements.txt
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.9 or newer
- A modern web browser (Chrome, Edge, Firefox)
- A code editor (VS Code recommended)

### Step 1 – Install Python dependencies

Open a terminal in the **SkillTor root folder** and run:

```bash
pip install -r requirements.txt
```

This installs: Flask, flask-cors, pandas, scikit-learn, numpy.

### Step 2 – Start the Flask backend

From the project root, run:

```bash
cd backend
python app.py
```

You should see output like:
```
[SkillTor] Starting up…
[SkillPredictor] Training model on sample dataset…
[SkillPredictor] Training accuracy : XX%
[SkillPredictor] Test accuracy      : XX%
[SkillPredictor] Ready ✓
[SkillTor] All systems ready!
 * Running on http://127.0.0.1:5000
```

> Keep this terminal open while using the app.

### Step 3 – Open the frontend

**Option A (easiest) – VS Code Live Server:**
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/index.html`
3. Select "Open with Live Server"
4. The app opens at `http://127.0.0.1:5500`

**Option B – Python simple HTTP server:**
```bash
cd frontend
python -m http.server 5500
```
Then open `http://localhost:5500` in your browser.

**Option C – Just open the file:**
Double-click `frontend/index.html` — note that some browsers may block `fetch()` to localhost from `file://` URLs. Use Option A or B for the best experience.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check + endpoint list |
| GET | `/api/skill-demand?n=15` | Top-N skills by demand score |
| GET | `/api/skill-demand/categories` | Average demand per category |
| GET | `/api/skill-demand/trending` | Rising/trending skills |
| GET | `/api/job-roles` | All job role names |
| GET | `/api/job-roles/grouped` | Job roles grouped by sector and domain |
| GET | `/api/job-roles/<role>` | Skills required for a role |
| POST | `/api/skill-gap` | Skill gap analysis |
| POST | `/api/recommendations` | ML-powered recommendations |
| GET | `/api/model-info` | ML model metadata + accuracy |

### Example: Test the API manually

```bash
# Top skills
curl http://127.0.0.1:5000/api/skill-demand

# Role details
curl "http://127.0.0.1:5000/api/job-roles/Data%20Scientist"

# Skill gap (PowerShell)
Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:5000/api/skill-gap" `
  -ContentType "application/json" `
  -Body '{"student_skills":["Python","SQL"],"target_role":"Data Scientist"}'

# Recommendations (PowerShell)
Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:5000/api/recommendations" `
  -ContentType "application/json" `
  -Body '{"student_skills":["Python","SQL","Pandas"],"target_role":"Data Scientist"}'
```

---

## 🎯 Feature Demo Guide

### 1. Dashboard
- Open the app → you land on the **📊 Dashboard** tab
- See 4 KPI cards: job roles count, skills tracked, trending count, top skill
- Two charts: "Top 15 Skills by Demand" (horizontal bar) and "Demand by Category" (doughnut)
- Trending skills shown as green pills at the bottom
- Dashboard cards use bundled sample data when the Flask API is unavailable; charts fall back to in-page bars if Chart.js cannot load.

### 2. State-wise Sector Comparison
- Open **🗺️ State / Sector**
- Select an industry to compare its simulated demand index across the listed states and territories
- Use the ranking table to compare state scores

### 3. District Analysis
- Open **📍 District Analysis**
- Choose a state or territory, then one of its sample districts
- Review its simulated demand index, estimated openings, leading sector, and sector profile
- State and district values are illustrative sample data, not official statistics.

### 4. Skill Gap Analysis
- Click **📈 Skill Gap** tab
- Type skills you know (e.g. `Python`, `SQL`, `Git`) and press **Enter** or click **+ Add**
- Select a target role (e.g. "Data Scientist")
- Click **🔍 Analyse My Skill Gap**
- See: coverage percentage, matched vs missing skills, charts, sorted skill lists
- If the Flask backend is unavailable, the analysis uses the frontend's sample role requirements; demand scores and trends are shown when the backend is running.

### 5. Recommendations
- Click **💡 Recommendations** tab
- Add your known skills
- Optionally select a target role
- Click **💡 Get My Recommendations**
- See: ML model's top pick, top-3 predictions with confidence, gap-based suggestions, radar chart
- Click **📊 Load Model Info** to see accuracy metrics with the honest disclaimer

---

## 🤖 ML Component Details

| Property | Value |
|----------|-------|
| Algorithm | Random Forest Classifier (sklearn) |
| Input features | 20 binary skill columns (1 = knows skill, 0 = doesn't) |
| Output | Recommended next skill to learn |
| Training data | 50 synthetic sample rows |
| Train/test split | 80% / 20% |
| Accuracy | Measured on sample data — see console output or `/api/model-info` |

> The model is intentionally simple for educational clarity. High training accuracy on 50 rows is expected but does **not** mean the model generalises to real-world data.

---

## 🛠️ Common Issues

| Problem | Fix |
|---------|-----|
| "Cannot connect to backend" | Make sure `python backend/app.py` is running |
| Charts not showing | Open browser console (F12) and check for errors |
| CORS error in console | Backend is not running or wrong port — check Step 2 |
| `ModuleNotFoundError` | Re-run `pip install -r requirements.txt` |
| Port 5000 in use | Edit `app.py` last line: change `port=5000` to `port=5001` and update `API_BASE` in `frontend/js/api.js` |

---

## 🎓 College Project Notes

- This project demonstrates a **full-stack pipeline**: CSV data → pandas → Flask API → JavaScript → Charts
- The ML component shows **model training, evaluation, and honest reporting** of accuracy
- Dashboard, regional, and recommendation data are labelled as **simulated/sample**.
- The code is heavily commented for beginner readability

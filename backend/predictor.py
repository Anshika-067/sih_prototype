# predictor.py
# ─────────────────────────────────────────────────────────────────────────────
# Trains a Random Forest Classifier on sample training data to recommend
# the next skill a student should learn.
#
# ⚠️  DISCLAIMER:
#   - The model is trained on ~50 synthetic/sample records.
#   - Accuracy figures reflect performance on this small sample dataset only.
#   - This is a demonstration model — do NOT treat predictions as real advice.
# ─────────────────────────────────────────────────────────────────────────────

import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# ── Feature columns (all known skills used as binary input features) ──────────
FEATURE_COLUMNS = [
    "Python", "SQL", "JavaScript", "Machine Learning", "React", "Docker",
    "AWS", "Git", "Java", "Node.js", "Deep Learning", "HTML", "CSS",
    "Statistics", "Pandas", "NumPy", "Scikit-learn", "TypeScript",
    "Linux", "REST APIs",
]
TARGET_COLUMN = "recommended_skill"


class SkillPredictor:
    """
    A simple Random Forest-based skill recommendation model.

    Usage:
        predictor = SkillPredictor()
        result = predictor.predict(["Python", "SQL", "Pandas"])
    """

    def __init__(self):
        self.model = None          # Will hold the trained RandomForestClassifier
        self.label_encoder = LabelEncoder()
        self.accuracy = None       # Training-set accuracy (reported honestly)
        self.train_accuracy = None
        self.test_accuracy = None
        self._train()              # Train automatically on import

    def _load_training_data(self) -> tuple:
        """Load and prepare training data from CSV."""
        path = os.path.join(DATA_DIR, "training_data.csv")
        df = pd.read_csv(path)

        # X = binary skill matrix (features)
        X = df[FEATURE_COLUMNS].fillna(0).astype(int)

        # y = recommended skill label (encoded as integer for the classifier)
        y_raw = df[TARGET_COLUMN]
        y = self.label_encoder.fit_transform(y_raw)

        return X, y

    def _train(self):
        """Train the Random Forest model and compute accuracy scores."""
        print("[SkillPredictor] Training model on sample dataset…")
        X, y = self._load_training_data()

        # Split into 80% training and 20% test to evaluate honestly
        # random_state=42 makes results reproducible
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42
        )

        # Random Forest: an ensemble of decision trees — easy to interpret
        self.model = RandomForestClassifier(
            n_estimators=100,   # number of trees
            random_state=42,    # reproducibility
            max_depth=5,        # limit tree depth to avoid overfitting small data
        )
        self.model.fit(X_train, y_train)

        # Evaluate on train and test sets
        train_pred = self.model.predict(X_train)
        test_pred = self.model.predict(X_test)

        self.train_accuracy = round(accuracy_score(y_train, train_pred) * 100, 1)
        self.test_accuracy = round(accuracy_score(y_test, test_pred) * 100, 1)

        print(f"[SkillPredictor] Training accuracy : {self.train_accuracy}%")
        print(f"[SkillPredictor] Test accuracy      : {self.test_accuracy}%")
        print("[SkillPredictor] Ready ✓")

    def _skills_to_vector(self, student_skills: list) -> pd.DataFrame:
        """
        Convert a list of skill names into the binary feature vector
        that the model expects.
        """
        # Start with all zeros
        vector = {col: 0 for col in FEATURE_COLUMNS}

        # Set 1 for each skill the student already knows
        for skill in student_skills:
            # Match case-insensitively
            for col in FEATURE_COLUMNS:
                if col.lower() == skill.lower().strip():
                    vector[col] = 1

        return pd.DataFrame([vector])

    def predict(self, student_skills: list) -> dict:
        """
        Predict the single best next skill to learn based on current skills.

        Returns:
            {
                "recommended_skill": str,
                "confidence": float,      ← probability from the forest
                "top_recommendations": [  ← top-3 predictions with probabilities
                    {"skill": str, "confidence": float}, …
                ]
            }
        """
        if self.model is None:
            return {"error": "Model not trained yet"}

        X_input = self._skills_to_vector(student_skills)

        # Get class probabilities for all possible labels
        proba = self.model.predict_proba(X_input)[0]

        # Map probabilities to skill names
        classes = self.label_encoder.classes_
        skill_proba = list(zip(classes, proba))

        # Filter out skills the student already knows
        student_skills_lower = [s.lower().strip() for s in student_skills]
        skill_proba_filtered = [
            (skill, p)
            for skill, p in skill_proba
            if skill.lower() not in student_skills_lower and p > 0
        ]

        if not skill_proba_filtered:
            # Fallback: recommend the highest-demand skill not yet known
            skill_proba_filtered = [(skill, p) for skill, p in skill_proba if p > 0]

        # Sort by probability descending
        skill_proba_filtered.sort(key=lambda x: x[1], reverse=True)

        top3 = [
            {"skill": s, "confidence": round(float(p) * 100, 1)}
            for s, p in skill_proba_filtered[:3]
        ]

        best = top3[0] if top3 else {"skill": "Python", "confidence": 0}

        return {
            "recommended_skill": best["skill"],
            "confidence": best["confidence"],
            "top_recommendations": top3,
        }

    def get_model_info(self) -> dict:
        """Return metadata about the trained model for the /api/model-info endpoint."""
        return {
            "model_type": "Random Forest Classifier",
            "n_estimators": 100,
            "max_depth": 5,
            "feature_count": len(FEATURE_COLUMNS),
            "features": FEATURE_COLUMNS,
            "training_samples": 40,   # approx 80% of 50 rows
            "test_samples": 10,        # approx 20% of 50 rows
            "train_accuracy_percent": self.train_accuracy,
            "test_accuracy_percent": self.test_accuracy,
            "data_disclaimer": (
                "This model is trained on ~50 synthetic sample records. "
                "Accuracy metrics reflect performance on this small dataset only. "
                "Do NOT use these predictions for real career decisions."
            ),
        }


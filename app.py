from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import pandas as pd
import pickle
import joblib
import os

app = Flask(__name__, static_folder=".")
CORS(app)

# --- Load model + scaler (make sure files exist in same folder) ---
MODEL_FILE = "new_reg_model.pkl"
SCALER_FILE = "new_reg.pkl"
CSV_FILE = "new_placement.csv"

if not os.path.exists(MODEL_FILE) or not os.path.exists(SCALER_FILE):
    raise FileNotFoundError(f"Missing model/scaler files. Place {MODEL_FILE} and {SCALER_FILE} here.")

model = pickle.load(open(MODEL_FILE, "rb"))
scaler = joblib.load(SCALER_FILE)

# Health/root
@app.route("/", methods=["GET"])
def root():
    return "PlacementAI backend running."


# Prediction API
@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON:
    { "cgpa": 7.5, "iq": 110, "intern": 1, "projects": 2 }
    Returns:
    { "prediction": 0|1, "probability": 0.1234 }
    """
    data = request.get_json() or {}
    try:
        cgpa = float(data.get("cgpa", 0))
        iq = float(data.get("iq", 0))
        intern = int(data.get("intern", 0))
        projects = int(data.get("projects", 0))
    except Exception as e:
        return jsonify({"error": "Invalid input", "details": str(e)}), 400

    features = np.array([[cgpa, iq, intern, projects]])
    scaled = scaler.transform(features)
    pred = int(model.predict(scaled)[0])
    prob = float(model.predict_proba(scaled)[0][1])

    return jsonify({"prediction": pred, "probability": round(prob, 4)})

# -------------------------
# Analytics API
# -------------------------
@app.route("/analytics", methods=["GET"])
def analytics():
    """
    Loads new_placement.csv and returns KPIs + chart-ready JSON.
    """
    if not os.path.exists(CSV_FILE):
        return jsonify({"error": f"{CSV_FILE} not found on server."}), 500

    df = pd.read_csv(CSV_FILE)

    # normalize column names if needed
    expected = {
        "IQ": "IQ", "CGPA": "CGPA",
        "Internship_Experience": "Internship_Experience",
        "Projects_Completed": "Projects_Completed",
        "Placement": "Placement"
    }
    # If different casing, try to map by lower
    cols_lower = {c.lower(): c for c in df.columns}
    def get_col(name):
        return cols_lower.get(name.lower(), None)

    # map columns
    iq_col = get_col("IQ") or "IQ"
    cgpa_col = get_col("CGPA") or "CGPA"
    intern_col = get_col("Internship_Experience") or "Internship_Experience"
    proj_col = get_col("Projects_Completed") or "Projects_Completed"
    place_col = get_col("Placement") or "Placement"

    # ensure columns exist
    for c in (iq_col, cgpa_col, intern_col, proj_col, place_col):
        if c not in df.columns:
            return jsonify({"error": f"Required column '{c}' not found in CSV."}), 500

    # cast
    df[iq_col] = pd.to_numeric(df[iq_col], errors="coerce").fillna(0)
    df[cgpa_col] = pd.to_numeric(df[cgpa_col], errors="coerce").fillna(0)
    df[intern_col] = pd.to_numeric(df[intern_col], errors="coerce").fillna(0).astype(int)
    df[proj_col] = pd.to_numeric(df[proj_col], errors="coerce").fillna(0).astype(int)
    df[place_col] = pd.to_numeric(df[place_col], errors="coerce").fillna(0).astype(int)

    total = int(len(df))
    avg_cgpa = round(float(df[cgpa_col].mean()), 2)
    avg_iq = round(float(df[iq_col].mean()), 1)
    intern_pct = round(float(df[intern_col].mean() * 100), 1)
    placement_pct = round(float(df[place_col].mean() * 100), 1)

    # distributions
    placement_dist = df[place_col].value_counts().to_dict()
    intern_dist = df[intern_col].value_counts().to_dict()
    proj_hist = df[proj_col].value_counts().sort_index().to_dict()

    # CGPA bins (0.5)
    bins = np.arange(0, 10.5, 0.5)
    cgpa_bin = pd.cut(df[cgpa_col], bins)
    cgpa_group = (df.groupby(cgpa_bin)[place_col].mean() * 100).round(1)
    cgpa_labels = [str(x) for x in cgpa_group.index.astype(str)]
    cgpa_values = cgpa_group.fillna(0).tolist()

    # IQ bins (10 buckets)
    iq_bin = pd.cut(df[iq_col], bins=10)
    iq_group = (df.groupby(iq_bin)[place_col].mean() * 100).round(1)
    iq_labels = [str(x) for x in iq_group.index.astype(str)]
    iq_values = iq_group.fillna(0).tolist()

    # scatter sample (limit size to keep payload small)
    sample = df.sample(min(1500, total), random_state=1)
    scatter = sample[[cgpa_col, iq_col, proj_col, intern_col, place_col]].rename(
        columns={cgpa_col: "cgpa", iq_col: "iq", proj_col: "projects",
                 intern_col: "intern", place_col: "placement"}
    ).to_dict(orient="records")

    # feature importance (static fallback)
    feature_importance = {"features": ["CGPA", "IQ", "Internship", "Projects"],
                          "weights": [0.9, 0.02, 1.3, 0.18]}

    return jsonify({
        "total": total,
        "avg_cgpa": avg_cgpa,
        "avg_iq": avg_iq,
        "intern_pct": intern_pct,
        "placement_pct": placement_pct,
        "placement_dist": {str(k): int(v) for k, v in placement_dist.items()},
        "intern_dist": {str(k): int(v) for k, v in intern_dist.items()},
        "proj_hist": {str(k): int(v) for k, v in proj_hist.items()},
        "cgpa_bins": {"labels": cgpa_labels, "values": cgpa_values},
        "iq_bins": {"labels": iq_labels, "values": iq_values},
        "scatter_points": scatter,
        "feature_importance": feature_importance
    })


# Serve static files if desired (optional)
@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


if __name__ == "__main__":
    print("Flask backend running on http://localhost:5000")
    app.run(debug=True)

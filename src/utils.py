"""Shared helpers for the Student Dropout Risk EDA project.

Every unit script imports this module for: paths, plotting style, data loading,
feature engineering (prepare) and result recording (record -> outputs/results.json).
"""
import os
import json
import warnings

import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")  # headless backend: figures are saved to disk
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings("ignore")

# ----------------------------------------------------------------- paths
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "student_dropout_risk_2026.csv")
FIG = os.path.join(ROOT, "outputs", "figures")
TAB = os.path.join(ROOT, "outputs", "tables")
INTER = os.path.join(ROOT, "interactive")
MODELS = os.path.join(ROOT, "models")
RES = os.path.join(ROOT, "outputs", "results.json")
for _d in (FIG, TAB, INTER, MODELS):
    os.makedirs(_d, exist_ok=True)

# ----------------------------------------------------------------- colours
C_STAY = "#2a9d8f"   # students who stayed
C_DROP = "#e76f51"   # students who dropped out
C_MAIN = "#264653"
PAL = {0: C_STAY, 1: C_DROP}
LABELS = {0: "Stayed", 1: "Dropped out"}

# ----------------------------------------------------------------- column groups
CONT = ["age", "weekly_work_hours", "semester", "admission_grade",
        "previous_qualification_grade", "units_enrolled", "units_passed",
        "units_failed", "gpa_semester_1", "gpa_semester_2", "attendance_rate",
        "assignments_submitted_rate", "library_visits_per_month",
        "lms_logins_per_week", "missed_deadlines", "stress_level",
        "satisfaction_score", "commute_time_mins", "sleep_hours"]
BINARY = ["first_generation", "disability_status", "scholarship_holder",
          "tuition_up_to_date", "part_time_job", "international_student",
          "extracurricular_activities", "mental_health_support"]
CATS = ["gender", "nationality", "family_income_level", "course_type", "study_mode"]
TARGET = "dropout"


def setup_style():
    sns.set_theme(style="whitegrid", context="notebook")
    plt.rcParams.update({
        "figure.dpi": 100, "savefig.dpi": 130, "axes.titleweight": "bold",
        "axes.titlesize": 11, "axes.labelsize": 9.5, "legend.fontsize": 8.5,
        "xtick.labelsize": 8.5, "ytick.labelsize": 8.5,
    })


setup_style()


# ----------------------------------------------------------------- I/O helpers
def load_raw():
    """Load the CSV exactly as supplied (UTF-8)."""
    return pd.read_csv(DATA, encoding="utf-8")


def prepare(df):
    """Feature engineering used from Unit 1 onwards (kept separate from raw data)."""
    d = df.copy()
    d["dropout_label"] = d[TARGET].map(LABELS)
    d["pass_rate"] = 100 * d.units_passed / d.units_enrolled
    d["gpa_change"] = d.gpa_semester_2 - d.gpa_semester_1
    d["avg_gpa"] = (d.gpa_semester_1 + d.gpa_semester_2) / 2
    d["age_group"] = pd.cut(d.age, [14, 17, 20, 24, 30],
                            labels=["15-17", "18-20", "21-24", "25-30"])
    d["work_load"] = pd.cut(d.weekly_work_hours, [-1, 0, 20, 40],
                            labels=["No work", "Light (1-20h)", "Heavy (21-40h)"])
    d["gpa_band"] = pd.cut(d.avg_gpa, [-0.01, 1.5, 2.0, 2.5, 3.0, 4.0],
                           labels=["<1.5", "1.5-2.0", "2.0-2.5", "2.5-3.0", "3.0-4.0"])
    d["attendance_band"] = pd.cut(d.attendance_rate, [-0.01, 50, 65, 80, 90, 100],
                                  labels=["<50%", "50-65%", "65-80%", "80-90%", "90-100%"])
    d["failed_band"] = pd.cut(d.units_failed, [-1, 0, 2, 4, 20],
                              labels=["0", "1-2", "3-4", "5+"])
    d["income_ord"] = d.family_income_level.map({"Low": 0, "Middle": 1, "High": 2})
    for c in ["missed_deadlines", "commute_time_mins", "library_visits_per_month"]:
        d["log_" + c] = np.log1p(d[c])
    z = lambda s: (s - s.mean()) / s.std()
    d["engagement_index"] = (z(d.attendance_rate) + z(d.assignments_submitted_rate)
                             + z(d.lms_logins_per_week) + z(d.log_library_visits_per_month)) / 4
    d["risk_flags"] = ((d.units_failed >= 4).astype(int) + (d.attendance_rate < 60).astype(int)
                       + (d.assignments_submitted_rate < 50).astype(int)
                       + (d.missed_deadlines >= 4).astype(int)
                       + (d.gpa_semester_2 < 1.5).astype(int)
                       + (d.tuition_up_to_date == 0).astype(int))
    return d


def savefig(name):
    plt.tight_layout()
    path = os.path.join(FIG, name + ".png")
    plt.savefig(path, bbox_inches="tight")
    plt.close("all")
    print("  saved figure:", name)
    return path


def save_table(df, name, index=True):
    df.to_csv(os.path.join(TAB, name + ".csv"), index=index)
    print("  saved table :", name)


def _conv(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, (pd.Series,)):
        return o.to_dict()
    return str(o)


def record(section, **kv):
    """Merge key results into outputs/results.json (read later by the report builder)."""
    data = {}
    if os.path.exists(RES):
        with open(RES, encoding="utf-8") as f:
            data = json.load(f)
    data.setdefault(section, {}).update(kv)
    with open(RES, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=_conv)


def pct(x, nd=1):
    return round(100 * float(x), nd)

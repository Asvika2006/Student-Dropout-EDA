"""LIVE DEMO - predict dropout risk for a student using the trained model.

Usage:
    python src/predict_demo.py                 # runs 3 example students
    python src/predict_demo.py --interactive   # type your own values
"""
import os, sys, joblib
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bundle = joblib.load(os.path.join(ROOT, "models", "best_model.joblib"))
model, FEATS = bundle["model"], bundle["features"]

BASE = dict(age=21, gender="Female", nationality="India", first_generation=0, disability_status=0,
            family_income_level="Middle", scholarship_holder=1, tuition_up_to_date=1, part_time_job=0,
            weekly_work_hours=0, course_type="STEM", study_mode="Full-time", semester=3, international_student=0,
            admission_grade=135, previous_qualification_grade=140, units_enrolled=13, units_passed=11, units_failed=2,
            gpa_semester_1=2.9, gpa_semester_2=2.4, attendance_rate=80, assignments_submitted_rate=75,
            library_visits_per_month=4, lms_logins_per_week=7, extracurricular_activities=1, missed_deadlines=2,
            stress_level=6, mental_health_support=0, satisfaction_score=7, commute_time_mins=20, sleep_hours=7)

EXAMPLES = {
    "A: steady student": {},
    "B: struggling + working + low income": dict(family_income_level="Low", scholarship_holder=0, tuition_up_to_date=0, part_time_job=1,
                                                 weekly_work_hours=30, units_failed=6, units_passed=7, gpa_semester_1=1.6, gpa_semester_2=1.2,
                                                 attendance_rate=48, assignments_submitted_rate=42, missed_deadlines=7, stress_level=9),
    "C: high achiever": dict(family_income_level="High", gpa_semester_1=3.7, gpa_semester_2=3.5, units_failed=0, units_passed=13,
                             attendance_rate=95, assignments_submitted_rate=94, library_visits_per_month=9, lms_logins_per_week=11, missed_deadlines=0),
}

def band(p):
    return "HIGH RISK - recommend early advising" if p >= .6 else "MEDIUM RISK - monitor" if p >= .3 else "LOW RISK"

def predict(row):
    r = dict(BASE); r.update(row)
    r["units_failed"] = int(r["units_failed"]); r["units_passed"] = int(r["units_enrolled"]) - r["units_failed"]
    p = float(model.predict_proba(pd.DataFrame([r])[FEATS])[0, 1])
    return p

if "--interactive" in sys.argv:
    row = {}
    print("Press Enter to keep the default value shown in brackets.")
    for k in ["gpa_semester_1", "gpa_semester_2", "units_failed", "attendance_rate", "assignments_submitted_rate", "missed_deadlines",
              "weekly_work_hours", "family_income_level", "tuition_up_to_date", "stress_level"]:
        v = input(f"{k} [{BASE[k]}]: ").strip()
        if v:
            row[k] = type(BASE[k])(v)
    if row.get("weekly_work_hours", 0) > 0:
        row["part_time_job"] = 1
    p = predict(row); print(f"\nPredicted dropout probability: {p:.1%} -> {band(p)}")
else:
    print(f"Model: {bundle['best']}\n")
    for name, row in EXAMPLES.items():
        p = predict(row); print(f"{name:42s} dropout probability = {p:6.1%}  -> {band(p)}")

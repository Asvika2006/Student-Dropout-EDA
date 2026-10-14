"""UNIT 1 - Exploratory Data Analysis
Loading, inspection (missing, duplicates, encoding), slicing, transformation,
grouping, and classical vs Bayesian analysis.
"""
# %% imports
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import *
from scipy import stats

print("UNIT 1: Exploratory Data Analysis")

# %% 1. Loading and initial inspection
df = load_raw()
print(df.shape)
print(df.dtypes.value_counts())
raw_bytes = open(DATA, "rb").read()
try:
    raw_bytes.decode("ascii"); is_ascii = True
except UnicodeDecodeError:
    is_ascii = False
record("u1", rows=df.shape[0], cols=df.shape[1], file_mb=round(len(raw_bytes) / 1e6, 2),
       n_float=int((df.dtypes == "float64").sum()), n_int=int((df.dtypes == "int64").sum()),
       n_str=int(df.shape[1] - (df.dtypes == "float64").sum() - (df.dtypes == "int64").sum()),
       ascii_only=is_ascii)

overview = pd.DataFrame({"dtype": df.dtypes.astype(str), "n_unique": df.nunique(),
                         "missing": df.isna().sum(),
                         "example": df.iloc[0].astype(str)})
save_table(overview, "u1_column_overview")
save_table(df.head(8), "u1_head", index=False)
save_table(df.describe().T.round(3), "u1_describe")

# %% 2. Missing values, duplicates, impossible values
checks = []
n_missing = int(df.isna().sum().sum())
checks.append(("Missing cells", n_missing, "None - no imputation needed"))
checks.append(("Duplicate rows", int(df.duplicated().sum()), "None dropped"))
checks.append(("Duplicate person_id", int(df.person_id.duplicated().sum()), "ID is a unique key"))
v = int((df.units_passed + df.units_failed != df.units_enrolled).sum())
checks.append(("units_passed + units_failed != units_enrolled", v, "Logic holds for all rows"))
v = int(((df.gpa_semester_1 < 0) | (df.gpa_semester_1 > 4) | (df.gpa_semester_2 < 0) | (df.gpa_semester_2 > 4)).sum())
checks.append(("GPA outside 0-4", v, "All valid"))
v = int(((df.attendance_rate < 0) | (df.attendance_rate > 100) | (df.assignments_submitted_rate < 0) | (df.assignments_submitted_rate > 100)).sum())
checks.append(("Rates outside 0-100%", v, "All valid"))
v = int(((df.admission_grade > 200) | (df.previous_qualification_grade > 200)).sum())
checks.append(("Grades above 200", v, "All valid (0-200 scale)"))
v = int(((df.part_time_job == 0) & (df.weekly_work_hours > 0)).sum() + ((df.part_time_job == 1) & (df.weekly_work_hours == 0)).sum())
checks.append(("part_time_job inconsistent with weekly_work_hours", v, "Consistent"))
checks.append(("Students aged under 18", int((df.age < 18).sum()), "Kept - plausible early-entry/dual-enrolment, flagged"))
checks.append(("attendance_rate capped at 100", int((df.attendance_rate == 100).sum()), "Ceiling effect noted"))
checks.append(("admission_grade capped at 200", int((df.admission_grade == 200).sum()), "Ceiling effect noted"))
checks.append(("gpa_semester_1 exactly 0.0", int((df.gpa_semester_1 == 0).sum()), "Floor effect noted"))
cq = pd.DataFrame(checks, columns=["Check", "Result", "Action / observation"])
save_table(cq, "u1_quality_checks", index=False)
print(cq.to_string())
record("u1", n_missing=n_missing, dup_rows=int(df.duplicated().sum()),
       under18=int((df.age < 18).sum()), att100=int((df.attendance_rate == 100).sum()),
       adm200=int((df.admission_grade == 200).sum()), gpa1_zero=int((df.gpa_semester_1 == 0).sum()))

# %% 3. Dataset slicing
d = prepare(df)
print(df.loc[:4, ["person_id", "course_type", "gpa_semester_1"]])   # label slice
print(df.iloc[0:5, 11:15])                                           # position slice
slices = {
    "STEM students": d[d.course_type == "STEM"],
    "Semester 1 students": d[d.semester == 1],
    "Online learners": d[d.study_mode == "Online"],
    "International students": d[d.international_student == 1],
    "Low income and no scholarship": d[(d.family_income_level == "Low") & (d.scholarship_holder == 0)],
    "Tuition not up to date": d[d.tuition_up_to_date == 0],
    ">=5 failed units and attendance < 60%": d[(d.units_failed >= 5) & (d.attendance_rate < 60)],
}
rows = [(k, len(s), pct(s.dropout.mean()), round(s.gpa_semester_2.mean(), 2), round(s.attendance_rate.mean(), 1))
        for k, s in slices.items()]
sl = pd.DataFrame(rows, columns=["Slice", "Students", "Dropout %", "Mean GPA S2", "Mean attendance %"])
sl.loc[len(sl)] = ["All students", len(d), pct(d.dropout.mean()), round(d.gpa_semester_2.mean(), 2), round(d.attendance_rate.mean(), 1)]
save_table(sl, "u1_slices", index=False)
print(sl.to_string())

# %% 4. Transformation: derived features, log, scaling, encoding
skew_tbl = []
for c in ["missed_deadlines", "commute_time_mins", "library_visits_per_month", "units_failed"]:
    skew_tbl.append((c, round(d[c].skew(), 2), round(np.log1p(d[c]).skew(), 2)))
skew_tbl = pd.DataFrame(skew_tbl, columns=["Variable", "Skew (raw)", "Skew (log1p)"])
save_table(skew_tbl, "u1_log_skew", index=False)

fig, ax = plt.subplots(2, 4, figsize=(13, 5.2))
for i, c in enumerate(skew_tbl.Variable):
    ax[0, i].hist(d[c], bins=30, color=C_DROP, alpha=.85)
    ax[0, i].set_title(f"{c}\nskew = {skew_tbl.iloc[i, 1]}", fontsize=9)
    ax[1, i].hist(np.log1p(d[c]), bins=30, color=C_STAY, alpha=.85)
    ax[1, i].set_title(f"log1p({c})\nskew = {skew_tbl.iloc[i, 2]}", fontsize=9)
ax[0, 0].set_ylabel("Raw"); ax[1, 0].set_ylabel("log1p")
savefig("u1_log_transform")

# z-score and min-max scaling check
zs = (d.attendance_rate - d.attendance_rate.mean()) / d.attendance_rate.std()
mm = (d.attendance_rate - d.attendance_rate.min()) / (d.attendance_rate.max() - d.attendance_rate.min())
enc_ohe = pd.get_dummies(d[CATS], drop_first=False)
record("u1", skew_missed=skew_tbl.iloc[0, 1], skew_missed_log=skew_tbl.iloc[0, 2],
       skew_commute=skew_tbl.iloc[1, 1], skew_commute_log=skew_tbl.iloc[1, 2],
       skew_library=skew_tbl.iloc[2, 1], skew_library_log=skew_tbl.iloc[2, 2],
       z_mean=round(zs.mean(), 6), z_std=round(zs.std(), 4), mm_min=float(mm.min()), mm_max=float(mm.max()),
       ohe_cols=int(enc_ohe.shape[1]), n_derived=len(prepare(df).columns) - df.shape[1])
print("one-hot columns:", enc_ohe.shape[1])

# %% 5. Grouping
def grp(col):
    g = d.groupby(col, observed=True).agg(
        students=("dropout", "size"), dropout_pct=("dropout", lambda s: 100 * s.mean()),
        gpa_s1=("gpa_semester_1", "mean"), gpa_s2=("gpa_semester_2", "mean"),
        attendance=("attendance_rate", "mean"), units_failed=("units_failed", "mean")).round(2)
    return g

for col in ["course_type", "study_mode", "family_income_level", "semester", "gender", "scholarship_holder", "tuition_up_to_date"]:
    g = grp(col)
    save_table(g, "u1_group_" + col)
piv = d.pivot_table(index="family_income_level", columns="study_mode", values="dropout", aggfunc="mean") * 100
save_table(piv.round(2), "u1_pivot_income_mode")
print(grp("family_income_level"))

fig, ax = plt.subplots(2, 3, figsize=(13, 6.4))
overall = 100 * d.dropout.mean()
for a, col in zip(ax.ravel(), ["family_income_level", "course_type", "study_mode", "tuition_up_to_date", "scholarship_holder", "semester"]):
    g = d.groupby(col)["dropout"].mean() * 100
    if col == "family_income_level":
        g = g.reindex(["Low", "Middle", "High"])
    a.bar(g.index.astype(str), g.values, color=sns.color_palette("viridis", len(g)))
    a.axhline(overall, color="k", ls="--", lw=1, label=f"overall {overall:.1f}%")
    a.set_title("Dropout % by " + col); a.set_ylabel("Dropout %")
    a.tick_params(axis="x", rotation=25)
    for i, v in enumerate(g.values):
        a.text(i, v + .5, f"{v:.1f}", ha="center", fontsize=7.5)
ax[0, 0].legend()
savefig("u1_group_dropout")

# %% 6. Classical vs Bayesian analysis
n = len(d); s = int(d.dropout.sum()); p = s / n
se = np.sqrt(p * (1 - p) / n)
wald = (p - 1.96 * se, p + 1.96 * se)
post = stats.beta(s + 1, n - s + 1)
cred = post.ppf([.025, .975])
record("u1", n=n, dropouts=s, p=p, wald_lo=wald[0], wald_hi=wald[1], bayes_mean=post.mean(),
       bayes_lo=cred[0], bayes_hi=cred[1])

# effect of sample size (posterior narrows, prior matters less)
rng = np.random.default_rng(42)
rows = []
for m in [10, 50, 500, 5000, 100000]:
    idx = rng.choice(n, m, replace=False)
    ss = int(d.dropout.values[idx].sum()); pp = ss / m
    w = 1.96 * np.sqrt(pp * (1 - pp) / m)
    b = stats.beta(ss + 1, m - ss + 1)
    lo, hi = b.ppf([.025, .975])
    rows.append((m, ss, pct(pp, 2), f"{100*max(pp-w,0):.1f} - {100*min(pp+w,1):.1f}",
                 pct(b.mean(), 2), f"{100*lo:.1f} - {100*hi:.1f}"))
bs = pd.DataFrame(rows, columns=["Sample size", "Dropouts", "Observed %", "Classical 95% CI (%)",
                                 "Posterior mean %", "Bayesian 95% CrI (%)"])
save_table(bs, "u1_bayes_sample_size", index=False)
print(bs.to_string())

# two-group comparisons: scholarship and income
def beta_post(sub):
    return stats.beta(int(sub.dropout.sum()) + 1, len(sub) - int(sub.dropout.sum()) + 1)

draws = 200000
rs = np.random.default_rng(7)
comp = []
for name, a_mask, b_mask, la, lb in [
    ("Scholarship vs no scholarship", d.scholarship_holder == 1, d.scholarship_holder == 0, "scholarship", "no scholarship"),
    ("Low vs High family income", d.family_income_level == "Low", d.family_income_level == "High", "low income", "high income"),
    ("Tuition up to date vs not", d.tuition_up_to_date == 1, d.tuition_up_to_date == 0, "tuition paid", "tuition unpaid"),
]:
    pa, pb = beta_post(d[a_mask]), beta_post(d[b_mask])
    da, db = pa.rvs(draws, random_state=rs), pb.rvs(draws, random_state=rs)
    diff = da - db
    lo, hi = np.percentile(diff, [2.5, 97.5])
    # classical two-proportion z-test
    x1, n1, x2, n2 = int(d[a_mask].dropout.sum()), int(a_mask.sum()), int(d[b_mask].dropout.sum()), int(b_mask.sum())
    pp = (x1 + x2) / (n1 + n2)
    z = (x1 / n1 - x2 / n2) / np.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2))
    comp.append((name, f"{100*x1/n1:.1f}% vs {100*x2/n2:.1f}%", f"{100*diff.mean():+.2f} pp",
                 f"[{100*lo:+.2f}, {100*hi:+.2f}]", f"{(diff > 0).mean():.4f}", f"{2*stats.norm.sf(abs(z)):.2e}"))
cmp_df = pd.DataFrame(comp, columns=["Comparison", "Dropout rates", "Posterior mean diff", "95% CrI of diff",
                                     "P(first group higher)", "Classical z-test p"])
save_table(cmp_df, "u1_bayes_comparisons", index=False)
print(cmp_df.to_string())

fig, ax = plt.subplots(1, 2, figsize=(12, 4))
xs = np.linspace(.25, .45, 600)
for lbl, mask, col in [("Low income", d.family_income_level == "Low", C_DROP),
                       ("Middle income", d.family_income_level == "Middle", "#e9c46a"),
                       ("High income", d.family_income_level == "High", C_STAY)]:
    pdf = beta_post(d[mask]).pdf(np.linspace(.15, .5, 800))
    ax[0].plot(np.linspace(.15, .5, 800), pdf, color=col, lw=2, label=lbl)
    ax[0].fill_between(np.linspace(.15, .5, 800), pdf, color=col, alpha=.2)
ax[0].set_title("Posterior of dropout probability by family income")
ax[0].set_xlabel("Dropout probability"); ax[0].set_ylabel("Density"); ax[0].legend()
xs = np.linspace(.0, .75, 1200)
for m, col in [(10, "#999999"), (50, "#e9c46a"), (500, C_DROP), (100000, C_STAY)]:
    idx = np.random.default_rng(42).choice(n, m, replace=False)
    ss = int(d.dropout.values[idx].sum())
    pdf = stats.beta(ss + 1, m - ss + 1).pdf(xs)
    ax[1].plot(xs, pdf, color=col, lw=2, label=f"n = {m:,}")
ax[1].axvline(p, color="k", ls="--", lw=1)
ax[1].set_title("Posterior narrows as sample size grows (Beta(1,1) prior)")
ax[1].set_xlabel("Dropout probability"); ax[1].legend()
savefig("u1_bayesian")
print("Unit 1 done.")

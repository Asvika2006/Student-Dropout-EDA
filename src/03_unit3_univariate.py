"""UNIT 3 - Univariate Analysis
Numerical: histograms, box plots, density plots, summary statistics, skewness, outliers.
Categorical: bar charts, pie charts, frequency tables.
"""
# %% imports
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import *
from scipy import stats

print("UNIT 3: Univariate analysis")
d = prepare(load_raw())

# %% 5.1 Summary statistics
def summary(s):
    q1, q3 = s.quantile([.25, .75]); iqr = q3 - q1
    return pd.Series({"count": s.count(), "mean": s.mean(), "median": s.median(),
                      "mode": s.mode().iloc[0], "std": s.std(), "variance": s.var(),
                      "min": s.min(), "Q1": q1, "Q3": q3, "IQR": iqr, "max": s.max(),
                      "CV %": 100 * s.std() / s.mean() if s.mean() else np.nan,
                      "skewness": s.skew(), "kurtosis": s.kurt()})

stat = pd.DataFrame({c: summary(d[c]) for c in CONT}).T
save_table(stat.round(3), "u3_summary_all")
save_table(summary(d.gpa_semester_2).round(3).to_frame("gpa_semester_2"), "u3_summary_gpa2")
print(stat[["mean", "median", "std", "skewness"]].round(2))
record("u3", gpa2_mean=d.gpa_semester_2.mean(), gpa2_median=d.gpa_semester_2.median(),
       gpa2_std=d.gpa_semester_2.std(), gpa2_skew=d.gpa_semester_2.skew(), gpa2_kurt=d.gpa_semester_2.kurt(),
       gpa2_q1=d.gpa_semester_2.quantile(.25), gpa2_q3=d.gpa_semester_2.quantile(.75),
       most_skewed=stat.skewness.abs().idxmax(), most_skewed_val=stat.loc[stat.skewness.abs().idxmax(), "skewness"],
       n_strong_skew=int((stat.skewness.abs() > 1).sum()))

# %% 5.2 Histograms, density plots, box plots
fig, axs = plt.subplots(5, 4, figsize=(16, 15))
for a, c in zip(axs.ravel(), CONT):
    sns.histplot(d[c], bins=30, kde=True, ax=a, color=C_MAIN, edgecolor="white")
    a.axvline(d[c].mean(), color=C_DROP, ls="--", lw=1.2); a.axvline(d[c].median(), color=C_STAY, ls="-", lw=1.2)
    a.set_title(f"{c} (skew {d[c].skew():.2f})", fontsize=9); a.set_xlabel(""); a.set_ylabel("")
for a in axs.ravel()[len(CONT):]:
    a.axis("off")
axs.ravel()[-1].plot([], [], color=C_DROP, ls="--", label="mean"); axs.ravel()[-1].plot([], [], color=C_STAY, label="median")
axs.ravel()[-1].legend(loc="center", fontsize=11)
savefig("u3_histograms_all")

fig, axs = plt.subplots(5, 4, figsize=(16, 13))
for a, c in zip(axs.ravel(), CONT):
    sns.boxplot(x=d[c], ax=a, color="#8ecae6", fliersize=1.5, flierprops=dict(markerfacecolor=C_DROP, markeredgecolor="none"))
    a.set_title(c, fontsize=9); a.set_xlabel("")
for a in axs.ravel()[len(CONT):]:
    a.axis("off")
savefig("u3_boxplots_all")

# key variables: histogram + box + density together
key = ["gpa_semester_2", "attendance_rate", "missed_deadlines"]
fig, axs = plt.subplots(3, 3, figsize=(13, 9))
for j, c in enumerate(key):
    axs[0, j].hist(d[c], bins=35, color=C_MAIN, alpha=.85); axs[0, j].set_title(f"Histogram: {c}")
    sns.boxplot(x=d[c], ax=axs[1, j], color="#8ecae6"); axs[1, j].set_title(f"Box plot: {c}")
    sns.kdeplot(d[c], ax=axs[2, j], fill=True, color=C_DROP, bw_adjust=1.2); axs[2, j].set_title(f"Density: {c}")
savefig("u3_key_variables")

# Q-Q plots
fig, axs = plt.subplots(1, 4, figsize=(15, 3.6))
for a, c in zip(axs, ["gpa_semester_2", "attendance_rate", "missed_deadlines", "commute_time_mins"]):
    stats.probplot(d[c].sample(5000, random_state=1), dist="norm", plot=a)
    a.set_title(f"Q-Q plot: {c}", fontsize=9); a.get_lines()[0].set_markersize(3)
    a.get_lines()[1].set_color(C_DROP)
savefig("u3_qq")

# %% 5.3 Skewness and outlier detection (IQR rule)
rows = []
for c in CONT:
    s = d[c]; q1, q3 = s.quantile([.25, .75]); iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    n_lo, n_hi = int((s < lo).sum()), int((s > hi).sum())
    sk = s.skew()
    shape = "Strong right skew" if sk > 1 else "Moderate right skew" if sk > .5 else "Strong left skew" if sk < -1 else \
            "Moderate left skew" if sk < -.5 else "Approx. symmetric"
    rows.append((c, round(sk, 2), shape, round(lo, 2), round(hi, 2), n_lo, n_hi, round(100 * (n_lo + n_hi) / len(s), 2)))
out = pd.DataFrame(rows, columns=["Variable", "Skewness", "Shape", "Lower fence", "Upper fence", "Below", "Above", "Outlier %"])
save_table(out, "u3_outliers", index=False)
print(out.to_string())
top = out.sort_values("Outlier %", ascending=False).head(5)
record("u3", total_outliers=int(out.Below.sum() + out.Above.sum()),
       top_outlier_var=top.iloc[0].Variable, top_outlier_pct=top.iloc[0]["Outlier %"],
       n_vars_with_outliers=int(((out.Below + out.Above) > 0).sum()))
# outliers are real behaviours, not errors: keep, but test effect of winsorising
w = d.missed_deadlines.clip(upper=d.missed_deadlines.quantile(.99))
record("u3", missed_mean_raw=d.missed_deadlines.mean(), missed_mean_wins=w.mean(), missed_p99=d.missed_deadlines.quantile(.99))

fig, ax = plt.subplots(1, 2, figsize=(12, 4))
o = out.sort_values("Outlier %")
ax[0].barh(o.Variable, o["Outlier %"], color=C_DROP); ax[0].set_title("Share of IQR outliers per variable (%)")
ax[1].barh(out.sort_values("Skewness").Variable, out.sort_values("Skewness").Skewness, color=C_MAIN)
ax[1].axvline(1, color="grey", ls="--"); ax[1].axvline(-1, color="grey", ls="--"); ax[1].set_title("Skewness of each numeric variable")
savefig("u3_outliers_skew")

# %% 5.4 Single categorical variables
def freq(col):
    f = d[col].value_counts()
    return pd.DataFrame({"Count": f, "Percent": (100 * f / len(d)).round(2), "Cumulative %": (100 * f.cumsum() / len(d)).round(2)})

for c in CATS + ["dropout_label", "scholarship_holder", "tuition_up_to_date", "first_generation", "disability_status"]:
    save_table(freq(c), "u3_freq_" + c)
print(freq("nationality"))
record("u3", top_nat=freq("nationality").index[0], top_nat_pct=freq("nationality").Percent.iloc[0],
       nat_top3=float(freq("nationality").Percent.iloc[:3].sum()), stem_pct=freq("course_type").loc["STEM", "Percent"],
       fulltime_pct=freq("study_mode").loc["Full-time", "Percent"], female_pct=freq("gender").loc["Female", "Percent"],
       other_pct=freq("gender").loc["Other", "Percent"], low_inc_pct=freq("family_income_level").loc["Low", "Percent"],
       sch_pct=100 * d.scholarship_holder.mean(), tuition_pct=100 * d.tuition_up_to_date.mean(),
       firstgen_pct=100 * d.first_generation.mean(), disab_pct=100 * d.disability_status.mean(),
       intl_pct=100 * d.international_student.mean())

fig, axs = plt.subplots(2, 3, figsize=(15, 8.5))
f = d.nationality.value_counts()
axs[0, 0].barh(f.index[::-1], f.values[::-1], color=sns.color_palette("viridis", len(f))); axs[0, 0].set_title("Bar chart: students by nationality")
f = d.course_type.value_counts(); b = axs[0, 1].bar(f.index, f.values, color=sns.color_palette("Set2", 5)); axs[0, 1].bar_label(b)
axs[0, 1].set_title("Bar chart: students by course type"); axs[0, 1].tick_params(axis="x", rotation=25)
f = d.family_income_level.value_counts().reindex(["Low", "Middle", "High"]); b = axs[0, 2].bar(f.index, f.values, color=[C_DROP, "#e9c46a", C_STAY]); axs[0, 2].bar_label(b)
axs[0, 2].set_title("Bar chart: family income level")
axs[1, 0].pie(d.course_type.value_counts(), labels=d.course_type.value_counts().index, autopct="%1.1f%%", startangle=90,
              colors=sns.color_palette("Set2", 5), textprops=dict(fontsize=8)); axs[1, 0].set_title("Pie chart: course type")
axs[1, 1].pie(d.study_mode.value_counts(), labels=d.study_mode.value_counts().index, autopct="%1.1f%%", startangle=90,
              colors=sns.color_palette("pastel", 3)); axs[1, 1].set_title("Pie chart: study mode")
axs[1, 2].pie(d.dropout.value_counts().sort_index(), labels=["Stayed", "Dropped out"], autopct="%1.1f%%", startangle=90,
              colors=[C_STAY, C_DROP], explode=(0, .06)); axs[1, 2].set_title("Pie chart: target variable (dropout)")
savefig("u3_categorical")

fig, axs = plt.subplots(1, 4, figsize=(15, 3.6))
for a, c, t in zip(axs, ["gender", "scholarship_holder", "tuition_up_to_date", "first_generation"],
                   ["Gender", "Scholarship holder", "Tuition up to date", "First-generation"]):
    f = d[c].value_counts(normalize=True).sort_index() * 100
    b = a.bar(f.index.astype(str), f.values, color=sns.color_palette("mako", len(f))); a.bar_label(b, fmt="%.1f%%"); a.set_title(t)
savefig("u3_binary_bars")
print("Unit 3 done.")

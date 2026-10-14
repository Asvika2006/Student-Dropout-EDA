"""UNIT 4 - Bivariate Analysis
Numerical-numerical (scatter, Pearson, Spearman), categorical-categorical
(cross-tab, stacked/grouped bars, chi-square), numerical-categorical (box, violin, tests).
"""
# %% imports
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import *
from scipy import stats

print("UNIT 4: Bivariate analysis")
d = prepare(load_raw())
smp = d.sample(5000, random_state=42)

# %% 6.1 Two numerical variables
pairs = [("attendance_rate", "assignments_submitted_rate"), ("gpa_semester_1", "gpa_semester_2"),
         ("attendance_rate", "gpa_semester_2"), ("units_failed", "gpa_semester_2"),
         ("admission_grade", "previous_qualification_grade"), ("admission_grade", "gpa_semester_1"),
         ("stress_level", "sleep_hours"), ("weekly_work_hours", "gpa_semester_2"),
         ("lms_logins_per_week", "library_visits_per_month"), ("missed_deadlines", "assignments_submitted_rate")]
rows = []
for a, b in pairs:
    r, pr = stats.pearsonr(d[a], d[b]); rho, ps = stats.spearmanr(d[a], d[b])
    lr = stats.linregress(d[a], d[b])
    rows.append((a, b, round(r, 3), round(rho, 3), round(lr.slope, 4), round(lr.intercept, 3), round(r ** 2, 3),
                 "<0.001" if pr < 1e-3 else round(pr, 3)))
cor = pd.DataFrame(rows, columns=["Variable X", "Variable Y", "Pearson r", "Spearman rho", "Slope", "Intercept", "R-squared", "p-value"])
save_table(cor, "u4_numeric_pairs", index=False)
print(cor.to_string())

fig, axs = plt.subplots(2, 3, figsize=(15, 8.5))
sel = [pairs[0], pairs[1], pairs[2], pairs[3], pairs[6], pairs[7]]
for a, (x, y) in zip(axs.ravel(), sel):
    jit = lambda s: s + np.random.default_rng(1).normal(0, .12, len(s)) if s.name in ("units_failed", "stress_level") else s
    a.scatter(jit(smp[x]), smp[y], s=6, alpha=.3, color=C_MAIN, edgecolor="none")
    lr = stats.linregress(d[x], d[y]); xs = np.linspace(d[x].min(), d[x].max(), 50)
    a.plot(xs, lr.intercept + lr.slope * xs, color=C_DROP, lw=2)
    r = d[x].corr(d[y]); rho = d[x].corr(d[y], method="spearman")
    a.set_title(f"{x} vs {y}\nr = {r:.3f}, rho = {rho:.3f}", fontsize=9); a.set_xlabel(x); a.set_ylabel(y)
savefig("u4_scatter_pairs")
c = {f"{a}|{b}": cor.iloc[i] for i, (a, b) in enumerate(pairs)}
record("u4", r_att_assign=cor.iloc[0]["Pearson r"], r_g1g2=cor.iloc[1]["Pearson r"], r_att_gpa2=cor.iloc[2]["Pearson r"],
       rho_att_gpa2=cor.iloc[2]["Spearman rho"], r_fail_gpa2=cor.iloc[3]["Pearson r"], r_adm_prev=cor.iloc[4]["Pearson r"],
       r_adm_gpa1=cor.iloc[5]["Pearson r"], r_stress_sleep=cor.iloc[6]["Pearson r"], r_work_gpa2=cor.iloc[7]["Pearson r"],
       slope_att_gpa2=cor.iloc[2]["Slope"], r2_att_gpa2=cor.iloc[2]["R-squared"], r_lms_lib=cor.iloc[8]["Pearson r"],
       r_missed_assign=cor.iloc[9]["Pearson r"])

# correlation of every numeric variable with the target
num_all = CONT + BINARY
tc = pd.DataFrame({"pearson_r": [d[c].corr(d.dropout) for c in num_all],
                   "spearman_rho": [d[c].corr(d.dropout, method="spearman") for c in num_all]}, index=num_all)
tc = tc.sort_values("pearson_r")
save_table(tc.round(3), "u4_corr_with_dropout")
fig, ax = plt.subplots(figsize=(8, 8))
ax.barh(tc.index, tc.pearson_r, color=[C_STAY if v < 0 else C_DROP for v in tc.pearson_r])
ax.axvline(0, color="k", lw=.8); ax.set_title("Pearson correlation of each variable with dropout")
ax.set_xlabel("r (negative = protects against dropout, positive = raises risk)")
savefig("u4_corr_with_dropout")
record("u4", top_neg=tc.index[0], top_neg_r=tc.pearson_r.iloc[0], top_neg2=tc.index[1], top_neg2_r=tc.pearson_r.iloc[1],
       top_pos=tc.index[-1], top_pos_r=tc.pearson_r.iloc[-1], top_pos2=tc.index[-2], top_pos2_r=tc.pearson_r.iloc[-2],
       top_pos3=tc.index[-3], top_pos3_r=tc.pearson_r.iloc[-3],
       r_age=tc.loc["age", "pearson_r"], r_commute=tc.loc["commute_time_mins", "pearson_r"], r_intl=tc.loc["international_student", "pearson_r"])

# %% 6.2 Two categorical variables
def cramers(ct):
    chi2 = stats.chi2_contingency(ct)[0]; n = ct.values.sum()
    return np.sqrt(chi2 / (n * (min(ct.shape) - 1)))

cat_all = ["gender", "nationality", "family_income_level", "course_type", "study_mode", "scholarship_holder", "tuition_up_to_date",
           "first_generation", "disability_status", "part_time_job", "international_student", "extracurricular_activities",
           "mental_health_support", "work_load", "age_group"]
rows = []
for c in cat_all:
    ct = pd.crosstab(d[c], d.dropout)
    chi2, p, dof, _ = stats.chi2_contingency(ct)
    rows.append((c, round(chi2, 1), dof, "<0.001" if p < 1e-3 else round(p, 3), round(cramers(ct), 3)))
cv = pd.DataFrame(rows, columns=["Variable", "Chi-square", "dof", "p-value", "Cramer's V"]).sort_values("Cramer's V", ascending=False)
save_table(cv, "u4_chi_square", index=False)
print(cv.to_string())
record("u4", cv_top=cv.iloc[0].Variable, cv_top_val=cv.iloc[0]["Cramer's V"], cv_2=cv.iloc[1].Variable, cv_2_val=cv.iloc[1]["Cramer's V"],
       cv_3=cv.iloc[2].Variable, cv_3_val=cv.iloc[2]["Cramer's V"],
       cv_course=float(cv.set_index("Variable").loc["course_type", "Cramer's V"]),
       p_course=str(cv.set_index("Variable").loc["course_type", "p-value"]),
       cv_gender=float(cv.set_index("Variable").loc["gender", "Cramer's V"]),
       p_gender=str(cv.set_index("Variable").loc["gender", "p-value"]),
       cv_nat=float(cv.set_index("Variable").loc["nationality", "Cramer's V"]),
       p_nat=str(cv.set_index("Variable").loc["nationality", "p-value"]),
       cv_income=float(cv.set_index("Variable").loc["family_income_level", "Cramer's V"]),
       cv_tuition=float(cv.set_index("Variable").loc["tuition_up_to_date", "Cramer's V"]))

ct_inc = pd.crosstab(d.family_income_level, d.dropout_label).reindex(["Low", "Middle", "High"])
save_table(ct_inc, "u4_crosstab_income")
ct_inc_pct = pd.crosstab(d.family_income_level, d.dropout_label, normalize="index").reindex(["Low", "Middle", "High"]) * 100
save_table(ct_inc_pct.round(2), "u4_crosstab_income_pct")
ct_tu = pd.crosstab(d.tuition_up_to_date, d.dropout_label)
save_table(ct_tu, "u4_crosstab_tuition")
chi_inc = stats.chi2_contingency(ct_inc)
record("u4", chi2_income=chi_inc[0], dof_income=int(chi_inc[2]))

fig, axs = plt.subplots(1, 3, figsize=(16, 4.8))
ct_inc.plot(kind="bar", ax=axs[0], color=[C_DROP, C_STAY], rot=0)  # grouped bar
axs[0].set_title("Grouped bar: outcome counts by income"); axs[0].set_ylabel("Students")
ct_inc_pct.plot(kind="bar", stacked=True, ax=axs[1], color=[C_DROP, C_STAY], rot=0)  # stacked bar
axs[1].set_title("Stacked bar (100%): outcome by income"); axs[1].set_ylabel("%")
for p_ in axs[1].patches:
    axs[1].text(p_.get_x() + p_.get_width() / 2, p_.get_y() + p_.get_height() / 2, f"{p_.get_height():.1f}", ha="center", va="center", color="white", fontsize=8)
ct_c = pd.crosstab(d.course_type, d.dropout_label, normalize="index") * 100
ct_c.plot(kind="barh", stacked=True, ax=axs[2], color=[C_DROP, C_STAY]); axs[2].set_title("Stacked bar (100%): outcome by course type")
axs[2].set_xlabel("%")
savefig("u4_catcat_bars")

fig, axs = plt.subplots(1, 2, figsize=(14, 4.6))
gr = d.groupby(["family_income_level", "study_mode"]).dropout.mean().mul(100).unstack().reindex(["Low", "Middle", "High"])
gr.plot(kind="bar", ax=axs[0], rot=0, color=sns.color_palette("crest", 3)); axs[0].set_title("Grouped bar: dropout % by income and study mode")
axs[0].set_ylabel("Dropout %")
gr2 = d.groupby(["tuition_up_to_date", "scholarship_holder"]).dropout.mean().mul(100).unstack()
gr2.index = ["Tuition unpaid", "Tuition paid"]; gr2.columns = ["No scholarship", "Scholarship"]
gr2.plot(kind="bar", ax=axs[1], rot=0, color=["#e9c46a", C_MAIN]); axs[1].set_title("Grouped bar: dropout % by tuition and scholarship")
axs[1].set_ylabel("Dropout %")
for a in axs:
    for cnt in a.containers:
        a.bar_label(cnt, fmt="%.1f", fontsize=8)
savefig("u4_grouped_bars")

fig, ax = plt.subplots(figsize=(8, 5.5))
ax.barh(cv["Variable"][::-1], cv["Cramer's V"][::-1], color=sns.color_palette("flare", len(cv))[::-1])
ax.set_title("Cramer's V: strength of association with dropout"); ax.set_xlabel("Cramer's V (0 = none, 1 = perfect)")
savefig("u4_cramers_v")

# %% 6.3 Numerical vs categorical
fig, axs = plt.subplots(2, 4, figsize=(18, 8))
bx = [("gpa_semester_2", "dropout_label"), ("attendance_rate", "dropout_label"), ("units_failed", "dropout_label"), ("missed_deadlines", "dropout_label")]
order = ["Stayed", "Dropped out"]; pal = {"Stayed": C_STAY, "Dropped out": C_DROP}
for j, (y, x) in enumerate(bx):
    sns.boxplot(data=d, x=x, y=y, order=order, palette=pal, ax=axs[0, j], hue=x, legend=False); axs[0, j].set_title(f"Box plot: {y}")
    sns.violinplot(data=d, x=x, y=y, order=order, palette=pal, ax=axs[1, j], inner="quartile", hue=x, legend=False, cut=0); axs[1, j].set_title(f"Violin plot: {y}")
savefig("u4_box_violin_dropout")

fig, axs = plt.subplots(2, 3, figsize=(16, 8))
io = ["Low", "Middle", "High"]
sns.boxplot(data=d, x="family_income_level", y="gpa_semester_2", order=io, palette="RdYlGn", hue="family_income_level", legend=False, ax=axs[0, 0]); axs[0, 0].set_title("GPA sem 2 by income")
sns.boxplot(data=d, x="study_mode", y="weekly_work_hours", palette="crest", hue="study_mode", legend=False, ax=axs[0, 1]); axs[0, 1].set_title("Work hours by study mode")
sns.boxplot(data=d, x="course_type", y="gpa_semester_2", palette="Set2", hue="course_type", legend=False, ax=axs[0, 2]); axs[0, 2].set_title("GPA sem 2 by course"); axs[0, 2].tick_params(axis="x", rotation=20)
sns.violinplot(data=d, x="family_income_level", y="attendance_rate", order=io, palette="RdYlGn", hue="family_income_level", legend=False, ax=axs[1, 0], inner="quartile", cut=0); axs[1, 0].set_title("Attendance by income")
sns.violinplot(data=d, x="study_mode", y="lms_logins_per_week", palette="crest", hue="study_mode", legend=False, ax=axs[1, 1], inner="quartile", cut=0); axs[1, 1].set_title("LMS logins by study mode")
sns.violinplot(data=d, x="semester", y="gpa_semester_1", palette="viridis", hue="semester", legend=False, ax=axs[1, 2], inner=None, cut=0); axs[1, 2].set_title("GPA sem 1 by semester")
savefig("u4_box_violin_groups")

# tests: continuous vs dropout (Welch t, Mann-Whitney, Cohen's d)
rows = []
for c in CONT:
    a, b = d[d.dropout == 1][c], d[d.dropout == 0][c]
    t, pt = stats.ttest_ind(a, b, equal_var=False)
    u, pu = stats.mannwhitneyu(a, b)
    sp = np.sqrt(((len(a) - 1) * a.var() + (len(b) - 1) * b.var()) / (len(a) + len(b) - 2))
    dd = (a.mean() - b.mean()) / sp
    mag = "large" if abs(dd) >= .8 else "medium" if abs(dd) >= .5 else "small" if abs(dd) >= .2 else "negligible"
    rows.append((c, round(b.mean(), 2), round(a.mean(), 2), round(t, 1), "<0.001" if pt < 1e-3 else round(pt, 3),
                 "<0.001" if pu < 1e-3 else round(pu, 3), round(dd, 2), mag))
tt = pd.DataFrame(rows, columns=["Variable", "Mean (stayed)", "Mean (dropped)", "Welch t", "t-test p", "Mann-Whitney p", "Cohen's d", "Effect size"])
tt = tt.reindex(tt["Cohen's d"].abs().sort_values(ascending=False).index)
save_table(tt, "u4_ttests", index=False)
print(tt.to_string())
record("u4", d_gpa1=float(tt.set_index("Variable").loc["gpa_semester_1", "Cohen's d"]), d_gpa2=float(tt.set_index("Variable").loc["gpa_semester_2", "Cohen's d"]),
       d_fail=float(tt.set_index("Variable").loc["units_failed", "Cohen's d"]), d_att=float(tt.set_index("Variable").loc["attendance_rate", "Cohen's d"]),
       d_missed=float(tt.set_index("Variable").loc["missed_deadlines", "Cohen's d"]), d_age=float(tt.set_index("Variable").loc["age", "Cohen's d"]),
       n_large=int((tt["Effect size"] == "large").sum()), n_medium=int((tt["Effect size"] == "medium").sum()),
       n_small=int((tt["Effect size"] == "small").sum()), n_negl=int((tt["Effect size"] == "negligible").sum()),
       n_sig=int((tt["t-test p"].astype(str) == "<0.001").sum()),
       mean_gpa2_stay=float(tt.set_index("Variable").loc["gpa_semester_2", "Mean (stayed)"]),
       mean_gpa2_drop=float(tt.set_index("Variable").loc["gpa_semester_2", "Mean (dropped)"]),
       mean_fail_stay=float(tt.set_index("Variable").loc["units_failed", "Mean (stayed)"]),
       mean_fail_drop=float(tt.set_index("Variable").loc["units_failed", "Mean (dropped)"]),
       mean_att_stay=float(tt.set_index("Variable").loc["attendance_rate", "Mean (stayed)"]),
       mean_att_drop=float(tt.set_index("Variable").loc["attendance_rate", "Mean (dropped)"]))

# ANOVA / Kruskal-Wallis across groups
rows = []
for num, grp in [("gpa_semester_2", "family_income_level"), ("gpa_semester_2", "course_type"), ("attendance_rate", "study_mode"),
                 ("weekly_work_hours", "study_mode"), ("gpa_semester_1", "semester"), ("units_failed", "family_income_level"),
                 ("admission_grade", "course_type"), ("stress_level", "work_load")]:
    groups = [g[num].values for _, g in d.groupby(grp, observed=True)]
    F, pf = stats.f_oneway(*groups); H, ph = stats.kruskal(*groups)
    grand = d[num].mean(); ssb = sum(len(g) * (g.mean() - grand) ** 2 for g in groups); sst = ((d[num] - grand) ** 2).sum()
    rows.append((num, grp, round(F, 1), "<0.001" if pf < 1e-3 else round(pf, 3), round(H, 1), "<0.001" if ph < 1e-3 else round(ph, 3), round(ssb / sst, 4)))
an = pd.DataFrame(rows, columns=["Numeric variable", "Grouped by", "ANOVA F", "ANOVA p", "Kruskal H", "Kruskal p", "Eta-squared"])
save_table(an, "u4_anova_kruskal", index=False)
print(an.to_string())
record("u4", eta_gpa2_income=an.iloc[0]["Eta-squared"], eta_gpa2_course=an.iloc[1]["Eta-squared"], p_gpa2_course=str(an.iloc[1]["ANOVA p"]),
       eta_work_mode=an.iloc[3]["Eta-squared"], eta_fail_income=an.iloc[5]["Eta-squared"], eta_att_mode=an.iloc[2]["Eta-squared"],
       eta_stress_work=an.iloc[7]["Eta-squared"])
print("Unit 4 done.")

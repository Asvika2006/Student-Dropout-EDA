"""UNIT 2 - Visualizing using Matplotlib (and Seaborn)
Line, bar, scatter (legend, colour, annotation), histogram, density, contour,
error bars, subplots and 3-D plots. Plotly/Bokeh are in 06_interactive.py.
"""
# %% imports
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import *
from scipy import stats
from scipy.stats import gaussian_kde
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401  (registers the 3d projection)

print("UNIT 2: Matplotlib visualization")
d = prepare(load_raw())
smp = d.sample(3000, random_state=42)   # sample keeps scatter plots readable

# %% 4.1 Line plot and basic bar plots
sem = d.groupby("semester").agg(drop=("dropout", "mean"), g1=("gpa_semester_1", "mean"),
                                g2=("gpa_semester_2", "mean"), fail=("units_failed", "mean"))
fig, ax = plt.subplots(1, 2, figsize=(11, 4))
ax[0].plot(sem.index, 100 * sem["drop"], marker="o", lw=2, color=C_DROP, label="Dropout %")
pk = (100 * sem["drop"]).idxmax()
ax[0].annotate(f"Peak: semester {pk}\n{100*sem['drop'].max():.1f}%", (pk, 100 * sem["drop"].max()),
               xytext=(pk + 1.2, 100 * sem["drop"].max() - .2), arrowprops=dict(arrowstyle="->"))
ax[0].set_xlabel("Semester"); ax[0].set_ylabel("Dropout rate (%)"); ax[0].set_title("Line plot: dropout rate by semester")
ax[0].legend()
ax[1].plot(sem.index, sem.g1, marker="s", lw=2, color=C_MAIN, label="GPA semester 1")
ax[1].plot(sem.index, sem.g2, marker="^", lw=2, ls="--", color=C_STAY, label="GPA semester 2")
ax[1].set_xlabel("Semester"); ax[1].set_ylabel("Mean GPA"); ax[1].set_title("Line plot: mean GPA by semester"); ax[1].legend()
savefig("u2_line_semester")
record("u2", peak_sem=int(pk), peak_rate=100 * sem["drop"].max(), min_rate=100 * sem["drop"].min(),
       min_sem=int((sem["drop"]).idxmin()), gpa1_mean=d.gpa_semester_1.mean(), gpa2_mean=d.gpa_semester_2.mean())

fig, ax = plt.subplots(1, 2, figsize=(11, 4))
g = (d.groupby("family_income_level").dropout.mean() * 100).reindex(["Low", "Middle", "High"])
b = ax[0].bar(g.index, g.values, color=[C_DROP, "#e9c46a", C_STAY]); ax[0].bar_label(b, fmt="%.1f%%")
ax[0].set_title("Bar plot: dropout % by family income"); ax[0].set_ylabel("Dropout %")
g = (d.groupby("study_mode").dropout.mean() * 100).sort_values()
b = ax[1].barh(g.index, g.values, color=sns.color_palette("crest", 3)); ax[1].bar_label(b, fmt="%.1f%%")
ax[1].set_title("Horizontal bar: dropout % by study mode"); ax[1].set_xlabel("Dropout %")
savefig("u2_bar_basic")

# %% 4.2 Scatter plot with legend, colours and annotation
fig, ax = plt.subplots(figsize=(8, 5.2))
for k in (0, 1):
    s = smp[smp.dropout == k]
    ax.scatter(s.attendance_rate, s.gpa_semester_2, s=14, alpha=.55, color=PAL[k], label=LABELS[k], edgecolor="none")
ax.set_xlabel("Attendance rate (%)"); ax.set_ylabel("GPA semester 2")
ax.set_title("Scatter: attendance vs semester-2 GPA, coloured by outcome")
ax.annotate("High-risk zone:\nlow attendance + low GPA", xy=(52, .6), xytext=(4, 3.1), fontsize=9,
            arrowprops=dict(arrowstyle="->", color="k"), bbox=dict(boxstyle="round", fc="white", ec="grey"))
ax.annotate("Safe zone: high attendance + high GPA", xy=(93, 3.4), xytext=(46, 3.8), fontsize=9,
            arrowprops=dict(arrowstyle="->", color="k"))
ax.legend(title="Outcome", loc="lower right")
savefig("u2_scatter")

# %% 4.3 Histogram, density plot and contour plot
fig, ax = plt.subplots(1, 3, figsize=(14, 3.9))
for k in (0, 1):
    ax[0].hist(d[d.dropout == k].gpa_semester_2, bins=35, alpha=.6, color=PAL[k], label=LABELS[k])
    sns.kdeplot(d[d.dropout == k].attendance_rate, ax=ax[1], color=PAL[k], fill=True, alpha=.3, label=LABELS[k], clip=(0, 100))
    sns.kdeplot(d[d.dropout == k].assignments_submitted_rate, ax=ax[2], color=PAL[k], fill=True, alpha=.3, label=LABELS[k], clip=(0, 100))
ax[0].set_title("Histogram: GPA semester 2"); ax[0].set_xlabel("GPA"); ax[0].set_ylabel("Students"); ax[0].legend()
ax[1].set_title("Density (KDE): attendance rate"); ax[1].set_xlabel("Attendance %"); ax[1].legend()
ax[2].set_title("Density (KDE): assignments submitted"); ax[2].set_xlabel("Assignments submitted %"); ax[2].legend()
savefig("u2_hist_density")

x, y = smp.attendance_rate.values, smp.gpa_semester_2.values
kde = gaussian_kde(np.vstack([x, y]))
xx, yy = np.mgrid[0:100:120j, 0:4:120j]
zz = kde(np.vstack([xx.ravel(), yy.ravel()])).reshape(xx.shape)
fig, ax = plt.subplots(1, 2, figsize=(12, 4.6))
cf = ax[0].contourf(xx, yy, zz, levels=14, cmap="viridis")
plt.colorbar(cf, ax=ax[0], label="Density")
ax[0].set_title("Filled contour: joint density (all students)")
ax[0].set_xlabel("Attendance %"); ax[0].set_ylabel("GPA semester 2")
for k in (0, 1):
    s = smp[smp.dropout == k]
    kd = gaussian_kde(np.vstack([s.attendance_rate, s.gpa_semester_2]))
    z2 = kd(np.vstack([xx.ravel(), yy.ravel()])).reshape(xx.shape)
    ax[1].contour(xx, yy, z2, levels=6, colors=PAL[k], linewidths=1.4)
ax[1].plot([], [], color=C_STAY, label="Stayed"); ax[1].plot([], [], color=C_DROP, label="Dropped out")
ax[1].legend(); ax[1].set_title("Contour lines by outcome")
ax[1].set_xlabel("Attendance %"); ax[1].set_ylabel("GPA semester 2")
savefig("u2_contour")

# %% 4.4 Error bars (95% confidence intervals)
def prop_ci(s):
    p = s.mean(); se = np.sqrt(p * (1 - p) / len(s)); return p, 1.96 * se

fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
order = ["STEM", "Business", "Arts & Humanities", "Health Sciences", "Law & Social Sciences"]
vals = [prop_ci(d[d.course_type == c].dropout) for c in order]
ax[0].errorbar(range(5), [100 * v[0] for v in vals], yerr=[100 * v[1] for v in vals], fmt="o", color=C_MAIN, capsize=5, lw=2)
ax[0].set_xticks(range(5)); ax[0].set_xticklabels([c.replace(" & ", " &\n") for c in order], fontsize=8)
ax[0].set_ylim(28, 36); ax[0].set_ylabel("Dropout rate (%)"); ax[0].set_title("Error bars: dropout % by course (95% CI)")
ax[0].axhline(100 * d.dropout.mean(), color="grey", ls="--", lw=1)
lv = ["Low", "Middle", "High"]
m = [d[d.family_income_level == c].gpa_semester_2.mean() for c in lv]
e = [1.96 * d[d.family_income_level == c].gpa_semester_2.std() / np.sqrt((d.family_income_level == c).sum()) for c in lv]
ax[1].errorbar(lv, m, yerr=e, fmt="s", color=C_DROP, capsize=5, lw=2)
ax[1].set_ylabel("Mean GPA semester 2"); ax[1].set_title("Error bars: mean GPA by family income (95% CI)")
savefig("u2_errorbars")
record("u2", course_min=min(100 * v[0] for v in vals), course_max=max(100 * v[0] for v in vals),
       gpa2_low=m[0], gpa2_mid=m[1], gpa2_high=m[2])

# %% 4.5 Subplots
fig, axs = plt.subplots(2, 2, figsize=(11, 7.5))
g = d.groupby("attendance_band", observed=True).dropout.mean() * 100
axs[0, 0].bar(g.index.astype(str), g.values, color=sns.color_palette("RdYlGn_r", 5)); axs[0, 0].set_title("Dropout % by attendance band")
axs[0, 1].plot(sem.index, sem.fail, marker="o", color=C_DROP); axs[0, 1].set_title("Mean failed units by semester")
axs[0, 1].set_xlabel("Semester")
axs[1, 0].scatter(smp.assignments_submitted_rate, smp.attendance_rate, s=8, alpha=.35, c=smp.dropout.map(PAL))
axs[1, 0].set_title("Assignments vs attendance"); axs[1, 0].set_xlabel("Assignments %"); axs[1, 0].set_ylabel("Attendance %")
axs[1, 1].hist(d.units_failed, bins=range(0, 18), color=C_MAIN, alpha=.85, rwidth=.9); axs[1, 1].set_title("Distribution of failed units")
fig.suptitle("Subplots: four views in one figure", fontweight="bold")
savefig("u2_subplots")

# %% 4.6 Three-dimensional plotting
s3 = d.sample(2500, random_state=1)
fig = plt.figure(figsize=(8, 6)); ax = fig.add_subplot(111, projection="3d")
for k in (0, 1):
    s = s3[s3.dropout == k]
    ax.scatter(s.attendance_rate, s.gpa_semester_2, s.units_failed, s=9, alpha=.55, color=PAL[k], label=LABELS[k])
ax.set_xlabel("Attendance %"); ax.set_ylabel("GPA sem 2"); ax.set_zlabel("Units failed")
ax.set_title("3-D scatter: attendance, GPA and failed units"); ax.legend(); ax.view_init(22, -58)
savefig("u2_3d")

# 3-D surface of dropout probability (attendance x GPA bins)
t = d.assign(ab=pd.cut(d.attendance_rate, np.linspace(30, 100, 8), include_lowest=True),
             gb=pd.cut(d.gpa_semester_2, np.linspace(0, 4, 9), include_lowest=True))
pv = t.pivot_table(index="gb", columns="ab", values="dropout", aggfunc="mean", observed=True) * 100
X, Y = np.meshgrid(np.arange(pv.shape[1]) * 10 + 35, np.arange(pv.shape[0]) * .5 + .25)
fig = plt.figure(figsize=(8, 6)); ax = fig.add_subplot(111, projection="3d")
sf = ax.plot_surface(X, Y, pv.values, cmap="RdYlGn_r", edgecolor="none")
fig.colorbar(sf, shrink=.6, label="Dropout %")
ax.set_xlabel("Attendance %"); ax.set_ylabel("GPA sem 2"); ax.set_zlabel("Dropout %", labelpad=8); ax.set_title("3-D surface: dropout % over attendance x GPA (attendance >= 30%)")
ax.view_init(28, -125)
savefig("u2_3d_surface")

# %% 4.7 Seaborn
fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
sns.histplot(data=d, x="gpa_semester_1", hue="dropout_label", kde=True, ax=ax[0], palette={"Stayed": C_STAY, "Dropped out": C_DROP}, bins=35)
ax[0].set_title("Seaborn histplot + KDE")
sns.regplot(data=smp, x="attendance_rate", y="gpa_semester_2", ax=ax[1], scatter_kws=dict(s=6, alpha=.25, color=C_MAIN), line_kws=dict(color=C_DROP))
ax[1].set_title("Seaborn regplot with confidence band")
sns.countplot(data=d, x="study_mode", hue="dropout_label", ax=ax[2], palette={"Stayed": C_STAY, "Dropped out": C_DROP})
ax[2].set_title("Seaborn countplot by study mode")
savefig("u2_seaborn")
print("Unit 2 done.")

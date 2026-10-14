"""UNIT 5 - Multivariate Analysis and Insights
Pair plots, correlation heatmaps, grouped visualizations, PCA, K-Means,
scikit-learn model development (+ cross-validation, lift analysis, fairness audit).
"""
# %% imports
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import *
import joblib
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
                             confusion_matrix, roc_curve, silhouette_score, average_precision_score)
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.inspection import permutation_importance

print("UNIT 5: Multivariate analysis")
d = prepare(load_raw())
NUMF = CONT + BINARY  # 27 numeric/binary features

# %% 7.1 Pair plot
pp_vars = ["gpa_semester_1", "gpa_semester_2", "attendance_rate", "assignments_submitted_rate", "units_failed"]
s = d.sample(1500, random_state=42)[pp_vars + ["dropout_label"]]
g = sns.pairplot(s, hue="dropout_label", corner=True, palette={"Stayed": C_STAY, "Dropped out": C_DROP},
                 plot_kws=dict(s=9, alpha=.45, edgecolor="none"), diag_kind="kde", height=2.1)
g.figure.suptitle("Pair plot of key academic variables coloured by outcome", y=1.01, fontweight="bold")
savefig("u5_pairplot")

# %% 7.2 Correlation heatmaps
corr = d[NUMF + [TARGET]].corr()
fig, ax = plt.subplots(figsize=(15, 12.5))
sns.heatmap(corr, cmap="coolwarm", center=0, vmin=-1, vmax=1, annot=True, fmt=".2f", annot_kws=dict(size=6), linewidths=.3, ax=ax,
            cbar_kws=dict(shrink=.7))
ax.set_title("Pearson correlation heatmap (27 variables + dropout)")
savefig("u5_heatmap_full")

focus = ["dropout", "gpa_semester_1", "gpa_semester_2", "units_failed", "units_passed", "attendance_rate", "assignments_submitted_rate",
         "missed_deadlines", "library_visits_per_month", "lms_logins_per_week", "weekly_work_hours", "stress_level", "tuition_up_to_date"]
fig, ax = plt.subplots(1, 2, figsize=(16, 6.5))
sns.heatmap(d[focus].corr("pearson"), cmap="coolwarm", center=0, annot=True, fmt=".2f", annot_kws=dict(size=7), ax=ax[0], cbar=False)
ax[0].set_title("Pearson (linear)")
sns.heatmap(d[focus].corr("spearman"), cmap="coolwarm", center=0, annot=True, fmt=".2f", annot_kws=dict(size=7), ax=ax[1], cbar=False)
ax[1].set_title("Spearman (rank)")
savefig("u5_heatmap_focus")
cp = corr.where(np.triu(np.ones(corr.shape), 1).astype(bool)).stack().dropna().reset_index()
cp.columns = ["A", "B", "r"]
cp = cp.reindex(cp.r.abs().sort_values(ascending=False).index)
save_table(cp.head(12).round(3), "u5_top_correlations", index=False)
print(cp.head(8))
no_t = cp[(cp.A != "dropout") & (cp.B != "dropout")]
record("u5", top_pairs=[(r.A, r.B, round(r.r, 3)) for r in cp.head(5).itertuples()],
       top_nontarget=[(r.A, r.B, round(r.r, 3)) for r in no_t.head(4).itertuples()],
       max_abs_offdiag_nontarget=float(no_t.r.abs().max()),
       n_pairs_above_05=int((no_t.r.abs() > .5).sum()), n_pairs=int(len(no_t)))

# %% 7.3 Grouped multivariate visualizations
fig, axs = plt.subplots(1, 3, figsize=(17, 4.8))
p1 = d.pivot_table(index="family_income_level", columns="study_mode", values="dropout", aggfunc="mean").reindex(["Low", "Middle", "High"]) * 100
sns.heatmap(p1, annot=True, fmt=".1f", cmap="YlOrRd", ax=axs[0], cbar_kws=dict(label="Dropout %")); axs[0].set_title("Dropout %: income x study mode"); axs[0].set_ylabel("")
p2 = d.pivot_table(index="attendance_band", columns="gpa_band", values="dropout", aggfunc="mean", observed=True) * 100
sns.heatmap(p2.iloc[::-1], annot=True, fmt=".0f", cmap="YlOrRd", ax=axs[1], cbar_kws=dict(label="Dropout %")); axs[1].set_title("Dropout %: attendance band x GPA band")
p3 = d.pivot_table(index="failed_band", columns="work_load", values="dropout", aggfunc="mean", observed=True) * 100
sns.heatmap(p3, annot=True, fmt=".0f", cmap="YlOrRd", ax=axs[2], cbar_kws=dict(label="Dropout %")); axs[2].set_title("Dropout %: failed units x work load")
savefig("u5_grouped_heatmaps")
save_table(p2.round(1), "u5_pivot_att_gpa"); save_table(p3.round(1), "u5_pivot_failed_work"); save_table(p1.round(1), "u5_pivot_income_mode")
record("u5", pv_att_gpa_max=float(p2.values.max()), pv_att_gpa_min=float(p2.values.min()),
       pv_fail_work_max=float(p3.values.max()), pv_fail_work_min=float(p3.values.min()),
       risk_low_low=float(p2.loc["<50%", "<1.5"]), risk_hi_hi=float(p2.loc["90-100%", "3.0-4.0"]))

# risk flags and cumulative stacking
rf = d.groupby("risk_flags").dropout.agg(["size", "mean"]); rf["mean"] *= 100
save_table(rf.round(2), "u5_risk_flags")
fig, axs = plt.subplots(1, 2, figsize=(13, 4.4))
b = axs[0].bar(rf.index.astype(str), rf["mean"], color=sns.color_palette("YlOrRd", len(rf))); axs[0].bar_label(b, fmt="%.0f%%")
axs[0].set_xlabel("Number of risk flags (0-6)"); axs[0].set_ylabel("Dropout %"); axs[0].set_title("Grouped view: dropout % rises with each risk flag")
axs[1].bar(rf.index.astype(str), rf["size"], color=C_MAIN); axs[1].set_title("Number of students at each flag count"); axs[1].set_xlabel("Number of risk flags")
savefig("u5_risk_flags")
record("u5", flag0=float(rf.loc[0, "mean"]), flag_max=float(rf["mean"].iloc[-1]), flag_max_n=int(rf.index[-1]), flag_max_size=int(rf["size"].iloc[-1]),
       flag3=float(rf.loc[3, "mean"]) if 3 in rf.index else None)

# profile heatmap: standardized means for stayed vs dropped
prof = d.groupby("dropout")[CONT].mean().T
prof_z = (prof.sub(d[CONT].mean(), axis=0)).div(d[CONT].std(), axis=0)
fig, ax = plt.subplots(figsize=(5.5, 8))
sns.heatmap(prof_z.rename(columns=LABELS), cmap="coolwarm", center=0, annot=True, fmt=".2f", ax=ax, cbar_kws=dict(label="Z-score vs overall mean"))
ax.set_title("Group profile (standardised means)")
savefig("u5_profile_heatmap")

# %% 7.4 PCA
Xs = StandardScaler().fit_transform(d[NUMF])
pca = PCA().fit(Xs)
ev = pca.explained_variance_ratio_
cum = np.cumsum(ev)
n80, n90 = int(np.argmax(cum >= .8) + 1), int(np.argmax(cum >= .9) + 1)
save_table(pd.DataFrame({"Component": [f"PC{i+1}" for i in range(10)], "Explained %": (100 * ev[:10]).round(2), "Cumulative %": (100 * cum[:10]).round(2)}), "u5_pca_variance", index=False)
load = pd.DataFrame(pca.components_[:3].T, index=NUMF, columns=["PC1", "PC2", "PC3"])
save_table(load.round(3), "u5_pca_loadings")
Z = pca.transform(Xs)[:, :2]
fig, axs = plt.subplots(1, 3, figsize=(17, 4.8))
axs[0].bar(range(1, 16), 100 * ev[:15], color=C_MAIN, label="Individual"); axs[0].plot(range(1, 16), 100 * cum[:15], "o-", color=C_DROP, label="Cumulative")
axs[0].axhline(80, color="grey", ls="--"); axs[0].set_xlabel("Principal component"); axs[0].set_ylabel("Explained variance %"); axs[0].set_title("Scree plot"); axs[0].legend()
idx = np.random.default_rng(3).choice(len(d), 5000, replace=False)
for k in (0, 1):
    m = d.dropout.values[idx] == k
    axs[1].scatter(Z[idx][m, 0], Z[idx][m, 1], s=6, alpha=.4, color=PAL[k], label=LABELS[k])
axs[1].set_xlabel(f"PC1 ({100*ev[0]:.1f}%)"); axs[1].set_ylabel(f"PC2 ({100*ev[1]:.1f}%)"); axs[1].set_title("PCA projection coloured by outcome"); axs[1].legend()
topf = load[["PC1", "PC2"]].abs().sum(axis=1).sort_values(ascending=False).head(10).index
for f in topf:
    axs[2].arrow(0, 0, load.loc[f, "PC1"], load.loc[f, "PC2"], head_width=.012, color=C_MAIN)
    axs[2].text(load.loc[f, "PC1"] * 1.08, load.loc[f, "PC2"] * 1.08, f, fontsize=7.5)
axs[2].set_xlim(-.6, .6); axs[2].set_ylim(-.6, .6); axs[2].axhline(0, color="grey", lw=.5); axs[2].axvline(0, color="grey", lw=.5)
axs[2].set_title("Loading plot (top 10 variables)"); axs[2].set_xlabel("PC1"); axs[2].set_ylabel("PC2")
savefig("u5_pca")
pc1 = load.PC1.abs().sort_values(ascending=False).head(4).index.tolist()
pc2 = load.PC2.abs().sort_values(ascending=False).head(4).index.tolist()
corr_pc1 = np.corrcoef(Z[:, 0], d.dropout)[0, 1]
corr_pc2 = np.corrcoef(Z[:, 1], d.dropout)[0, 1]
record("u5", pca_ev1=100 * ev[0], pca_ev2=100 * ev[1], pca_ev3=100 * ev[2], pca_cum2=100 * cum[1], pca_cum3=100 * cum[2], n80=n80, n90=n90,
       n_feat=len(NUMF), pc1_top=pc1, pc2_top=pc2, pc1_dropout_r=corr_pc1, pc2_dropout_r=corr_pc2,
       pc1_loadings={k: round(load.loc[k, "PC1"], 3) for k in pc1}, pc2_loadings={k: round(load.loc[k, "PC2"], 3) for k in pc2})

# %% 7.5 K-Means clustering
kf = ["gpa_semester_1", "gpa_semester_2", "attendance_rate", "assignments_submitted_rate", "units_failed",
      "missed_deadlines", "lms_logins_per_week", "library_visits_per_month"]
Xk = StandardScaler().fit_transform(d[kf])
ks = range(2, 9); inertia, sil = [], []
sub = np.random.default_rng(5).choice(len(d), 6000, replace=False)
for k in ks:
    km = KMeans(n_clusters=k, n_init=5, random_state=42).fit(Xk)
    inertia.append(km.inertia_); sil.append(silhouette_score(Xk[sub], km.labels_[sub]))
fig, ax = plt.subplots(1, 2, figsize=(11, 3.9))
ax[0].plot(list(ks), inertia, "o-", color=C_MAIN); ax[0].set_title("Elbow method"); ax[0].set_xlabel("k"); ax[0].set_ylabel("Inertia")
ax[1].plot(list(ks), sil, "s-", color=C_DROP); ax[1].set_title("Silhouette score"); ax[1].set_xlabel("k"); ax[1].set_ylabel("Silhouette")
savefig("u5_kmeans_selection")
K = 4
km = KMeans(n_clusters=K, n_init=10, random_state=42).fit(Xk)
d["cluster"] = km.labels_
prof = d.groupby("cluster").agg(students=("dropout", "size"), dropout_pct=("dropout", lambda x: 100 * x.mean()),
                                gpa_s1=("gpa_semester_1", "mean"), gpa_s2=("gpa_semester_2", "mean"), attendance=("attendance_rate", "mean"),
                                assignments=("assignments_submitted_rate", "mean"), failed=("units_failed", "mean"),
                                missed=("missed_deadlines", "mean"), lms=("lms_logins_per_week", "mean"), library=("library_visits_per_month", "mean")).round(2)
prof = prof.sort_values("dropout_pct", ascending=False)
names = ["High-risk", "At-risk", "Moderate", "Low-risk"]
prof["segment"] = names[:K]
save_table(prof, "u5_cluster_profile")
print(prof.to_string())
cmap = {c: n for c, n in zip(prof.index, prof.segment)}
d["segment"] = d.cluster.map(cmap)
fig, axs = plt.subplots(1, 3, figsize=(17, 4.8))
cols = dict(zip(names[:K], ["#d62828", C_DROP, "#e9c46a", C_STAY]))
for sgm in names[:K]:
    m = d.segment.values[idx] == sgm
    axs[0].scatter(Z[idx][m, 0], Z[idx][m, 1], s=6, alpha=.45, color=cols[sgm], label=sgm)
axs[0].set_title(f"K-Means (k={K}) clusters in PCA space"); axs[0].set_xlabel("PC1"); axs[0].set_ylabel("PC2"); axs[0].legend(markerscale=2)
b = axs[1].bar(prof.segment, prof.dropout_pct, color=[cols[s] for s in prof.segment]); axs[1].bar_label(b, fmt="%.1f%%"); axs[1].set_title("Dropout rate per cluster"); axs[1].set_ylabel("Dropout %")
cz = pd.DataFrame(km.cluster_centers_, columns=kf).loc[prof.index]; cz.index = prof.segment
sns.heatmap(cz.T, cmap="coolwarm", center=0, annot=True, fmt=".2f", ax=axs[2], cbar=False, annot_kws=dict(size=8)); axs[2].set_title("Cluster centres (z-scores)")
savefig("u5_kmeans_clusters")
record("u5", k_best_sil=int(list(ks)[int(np.argmax(sil))]), sil_best=float(max(sil)), sil_k4=float(sil[2]), K=K,
       cl_hi=float(prof.dropout_pct.iloc[0]), cl_lo=float(prof.dropout_pct.iloc[-1]), cl_hi_n=int(prof.students.iloc[0]), cl_lo_n=int(prof.students.iloc[-1]),
       cl_sizes=prof.students.tolist(), cl_drop=prof.dropout_pct.tolist())

# %% 7.6 Scikit-learn model development
FEATS = [c for c in d.columns if c in CONT + BINARY + CATS]
X, y = d[FEATS], d[TARGET]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=.2, stratify=y, random_state=42)
cat_cols = [c for c in CATS]
num_cols = [c for c in FEATS if c not in cat_cols]

def make_pre(scale):
    return ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
                              ("num", StandardScaler() if scale else "passthrough", num_cols)])

models = {
    "Logistic Regression": Pipeline([("pre", make_pre(True)), ("clf", LogisticRegression(max_iter=1000))]),
    "Random Forest": Pipeline([("pre", make_pre(False)), ("clf", RandomForestClassifier(n_estimators=120, max_depth=12, min_samples_leaf=20, n_jobs=-1, random_state=42))]),
    "Gradient Boosting": Pipeline([("pre", make_pre(False)), ("clf", HistGradientBoostingClassifier(max_iter=200, learning_rate=.08, random_state=42))]),
}
skf = StratifiedKFold(5, shuffle=True, random_state=42)
rows, fitted, probs = [], {}, {}
base_acc = 1 - y_te.mean()
for name, mdl in models.items():
    print("  training", name)
    mdl.fit(X_tr, y_tr); fitted[name] = mdl
    pr = mdl.predict_proba(X_te)[:, 1]; probs[name] = pr; pred = (pr >= .5).astype(int)
    cv = cross_val_score(mdl, X_tr, y_tr, cv=skf, scoring="roc_auc")
    rows.append((name, accuracy_score(y_te, pred), precision_score(y_te, pred), recall_score(y_te, pred), f1_score(y_te, pred),
                 roc_auc_score(y_te, pr), average_precision_score(y_te, pr), cv.mean(), cv.std(), roc_auc_score(y_tr, mdl.predict_proba(X_tr)[:, 1])))
res = pd.DataFrame(rows, columns=["Model", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC", "PR-AUC", "CV AUC mean", "CV AUC std", "Train AUC"])
res.loc[len(res)] = ["Majority-class baseline", base_acc, 0, 0, 0, .5, y_te.mean(), np.nan, np.nan, np.nan]
save_table(res.round(4), "u5_model_results", index=False)
print(res.round(4).to_string())
best = res.iloc[:3].sort_values("ROC-AUC", ascending=False).iloc[0].Model
bm = fitted[best]; pb = probs[best]
joblib.dump({"model": bm, "features": FEATS, "best": best}, os.path.join(MODELS, "best_model.joblib"), compress=3)

# threshold tuning for recall
thr_rows = []
for t in [.2, .3, .4, .5, .6]:
    pr_ = (pb >= t).astype(int)
    thr_rows.append((t, accuracy_score(y_te, pr_), precision_score(y_te, pr_), recall_score(y_te, pr_), f1_score(y_te, pr_)))
thr = pd.DataFrame(thr_rows, columns=["Threshold", "Accuracy", "Precision", "Recall", "F1"])
save_table(thr.round(3), "u5_thresholds", index=False)

fig, axs = plt.subplots(1, 3, figsize=(17, 4.8))
for name, pr in probs.items():
    fpr, tpr, _ = roc_curve(y_te, pr); axs[0].plot(fpr, tpr, lw=2, label=f"{name} (AUC {roc_auc_score(y_te, pr):.3f})")
axs[0].plot([0, 1], [0, 1], "k--", lw=1); axs[0].set_title("ROC curves (20% test set)"); axs[0].set_xlabel("False positive rate"); axs[0].set_ylabel("True positive rate"); axs[0].legend(loc="lower right")
cm = confusion_matrix(y_te, (pb >= .5).astype(int))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=axs[1], xticklabels=["Stayed", "Dropped"], yticklabels=["Stayed", "Dropped"], cbar=False)
axs[1].set_title(f"Confusion matrix: {best}"); axs[1].set_xlabel("Predicted"); axs[1].set_ylabel("Actual")
axs[2].plot(thr.Threshold, thr.Precision, "o-", label="Precision", color=C_MAIN); axs[2].plot(thr.Threshold, thr.Recall, "s-", label="Recall", color=C_DROP)
axs[2].plot(thr.Threshold, thr.F1, "^-", label="F1", color=C_STAY); axs[2].set_xlabel("Decision threshold"); axs[2].set_title("Precision-recall trade-off"); axs[2].legend()
savefig("u5_model_evaluation")

# permutation importance
Xs_te = X_te.sample(8000, random_state=1); ys_te = y_te.loc[Xs_te.index]
pi = permutation_importance(bm, Xs_te, ys_te, n_repeats=3, random_state=42, scoring="roc_auc")
imp = pd.Series(pi.importances_mean, index=FEATS).sort_values(ascending=False)
save_table(imp.round(4).to_frame("AUC drop when shuffled"), "u5_feature_importance")
fig, ax = plt.subplots(figsize=(8, 7))
t = imp.head(15)[::-1]; ax.barh(t.index, t.values, color=C_MAIN); ax.set_title(f"Permutation importance ({best})"); ax.set_xlabel("Drop in ROC-AUC when feature is shuffled")
savefig("u5_feature_importance")

# lift / risk deciles
dec = pd.DataFrame({"p": pb, "y": y_te.values}); dec["decile"] = pd.qcut(dec.p.rank(method="first"), 10, labels=range(1, 11))
lift = dec.groupby("decile", observed=True).agg(students=("y", "size"), avg_risk=("p", "mean"), actual_dropout=("y", "mean"))
lift["actual_dropout"] *= 100; lift["avg_risk"] *= 100
save_table(lift.round(2), "u5_risk_deciles")
fig, ax = plt.subplots(figsize=(7.5, 4.2))
ax.bar(lift.index.astype(str), lift.actual_dropout, color=sns.color_palette("YlOrRd", 10)); ax.set_xlabel("Predicted-risk decile (1 = lowest, 10 = highest)"); ax.set_ylabel("Actual dropout %")
ax.axhline(100 * y_te.mean(), color="k", ls="--", lw=1); ax.set_title("Risk deciles: actual dropout rate")
savefig("u5_risk_deciles")
top20 = dec.sort_values("p", ascending=False).head(int(.2 * len(dec)))
cap20 = top20.y.sum() / dec.y.sum()

# fairness audit on the test set
audit_rows = []
tdf = X_te.copy(); tdf["y"] = y_te.values; tdf["pred"] = (pb >= .5).astype(int)
tdf["intl"] = tdf.international_student.map({0: "Domestic", 1: "International"}); tdf["dis"] = tdf.disability_status.map({0: "No disability", 1: "Disability"})
tdf["fg"] = tdf.first_generation.map({0: "Not first-gen", 1: "First-gen"})
for attr in ["gender", "family_income_level", "intl", "dis", "fg"]:
    for grpn, gdf in tdf.groupby(attr):
        tn = ((gdf.y == 0) & (gdf.pred == 0)).sum(); fp = ((gdf.y == 0) & (gdf.pred == 1)).sum()
        tp = ((gdf.y == 1) & (gdf.pred == 1)).sum(); fn = ((gdf.y == 1) & (gdf.pred == 0)).sum()
        audit_rows.append((attr, grpn, len(gdf), 100 * gdf.y.mean(), 100 * gdf.pred.mean(), 100 * tp / max(tp + fn, 1), 100 * fp / max(fp + tn, 1),
                           100 * (tp + tn) / len(gdf)))
au = pd.DataFrame(audit_rows, columns=["Attribute", "Group", "n", "Actual dropout %", "Flagged %", "Recall (TPR) %", "False-positive rate %", "Accuracy %"]).round(1)
save_table(au, "u5_fairness_audit", index=False)
print(au.to_string())
fig, axs = plt.subplots(1, 2, figsize=(13, 4.6))
lab = au.Attribute.map({"gender": "Gender", "family_income_level": "Income", "intl": "Origin", "dis": "Disability", "fg": "Generation"}) + ": " + au.Group.astype(str)
axs[0].barh(lab[::-1], au["Recall (TPR) %"][::-1], color=C_STAY); axs[0].set_title("Recall (true-positive rate) by group"); axs[0].set_xlabel("%"); axs[0].set_xlim(0, 100)
axs[1].barh(lab[::-1], au["False-positive rate %"][::-1], color=C_DROP); axs[1].set_title("False-positive rate by group"); axs[1].set_xlabel("%")
savefig("u5_fairness")
inc = au[au.Attribute == "family_income_level"].set_index("Group")
rec_gap = au["Recall (TPR) %"].max() - au["Recall (TPR) %"].min()
gen = au[au.Attribute == "gender"]
record("u5", n_train=len(X_tr), n_test=len(X_te), n_features=len(FEATS), base_acc=100 * base_acc, best=best,
       **{f"m_{r.Model.split()[0].lower()}_{k}": float(v) for r in res.iloc[:3].itertuples() for k, v in
          zip(["acc", "prec", "rec", "f1", "auc", "prauc", "cv", "cvstd", "trainauc"], [r.Accuracy, r.Precision, r.Recall, r.F1, getattr(r, "_6"), getattr(r, "_7"), getattr(r, "_8"), getattr(r, "_9"), getattr(r, "_10")])},
       top_feats=imp.head(8).index.tolist(), top_imp=[round(v, 4) for v in imp.head(8).values], top1_imp=float(imp.iloc[0]),
       lift_top=float(lift.actual_dropout.iloc[-1]), lift_bottom=float(lift.actual_dropout.iloc[0]), cap20=float(cap20),
       rec_gap_max=float(rec_gap), inc_rec_low=float(inc.loc["Low", "Recall (TPR) %"]), inc_rec_high=float(inc.loc["High", "Recall (TPR) %"]),
       inc_fpr_low=float(inc.loc["Low", "False-positive rate %"]), inc_fpr_high=float(inc.loc["High", "False-positive rate %"]),
       inc_flag_low=float(inc.loc["Low", "Flagged %"]), inc_flag_high=float(inc.loc["High", "Flagged %"]),
       gen_rec_min=float(gen["Recall (TPR) %"].min()), gen_rec_max=float(gen["Recall (TPR) %"].max()),
       tn=int(cm[0, 0]), fp=int(cm[0, 1]), fn=int(cm[1, 0]), tp=int(cm[1, 1]),
       thr_rec_03=float(thr.set_index("Threshold").loc[.3, "Recall"]), thr_prec_03=float(thr.set_index("Threshold").loc[.3, "Precision"]),
       thr_rec_05=float(thr.set_index("Threshold").loc[.5, "Recall"]), thr_prec_05=float(thr.set_index("Threshold").loc[.5, "Precision"]))

# %% 7.7 Ablation: remove sensitive attributes ("fairness through unawareness") and compare
SENS = ["gender", "nationality", "international_student", "disability_status", "first_generation"]
F2 = [f for f in FEATS if f not in SENS]
cat2 = [c for c in cat_cols if c in F2]; num2 = [c for c in F2 if c not in cat2]
m2 = Pipeline([("pre", ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), cat2), ("num", StandardScaler(), num2)])),
               ("clf", LogisticRegression(max_iter=1000))]).fit(X_tr[F2], y_tr)
p2 = m2.predict_proba(X_te[F2])[:, 1]
t2 = X_te.copy(); t2["y"] = y_te.values; t2["pred"] = (p2 >= .5).astype(int)
rec2 = {g: 100 * ((x.y == 1) & (x.pred == 1)).sum() / max((x.y == 1).sum(), 1) for g, x in t2.groupby("family_income_level")}
abl = pd.DataFrame({"Model": ["With all 32 features", f"Without {len(SENS)} sensitive attributes"],
                    "ROC-AUC": [roc_auc_score(y_te, probs["Logistic Regression"]), roc_auc_score(y_te, p2)],
                    "Accuracy": [accuracy_score(y_te, (probs["Logistic Regression"] >= .5).astype(int)), accuracy_score(y_te, t2.pred)],
                    "Recall (Low income) %": [inc_rec_low_all := au[(au.Attribute == "family_income_level") & (au.Group == "Low")]["Recall (TPR) %"].iloc[0], rec2["Low"]],
                    "Recall (High income) %": [au[(au.Attribute == "family_income_level") & (au.Group == "High")]["Recall (TPR) %"].iloc[0], rec2["High"]]})
save_table(abl.round(4), "u5_ablation_sensitive", index=False)
print(abl.round(4).to_string())
record("u5", abl_auc_full=float(abl["ROC-AUC"].iloc[0]), abl_auc_wo=float(abl["ROC-AUC"].iloc[1]),
       abl_acc_full=float(abl.Accuracy.iloc[0]), abl_acc_wo=float(abl.Accuracy.iloc[1]), n_sens=len(SENS))
print("Unit 5 done. Best model:", best)

const L = require('./lib');
const { R, f0, f1, f2, f3, f4, pc, H1, H2, P, bullets, obs, code, fig, table, tcap, gap, csvTable, num, int } = L;
const u1 = R.u1, u2 = R.u2, u3 = R.u3, u4 = R.u4, u5 = R.u5;

module.exports = function partC() {
  const c = [];
  // ------------------------------------------------------------------ 6 BIVARIATE
  c.push(H1('6. Bivariate Analysis'));
  c.push(H2('6.1 Two Numerical Variables'));
  c.push(P(`The relationship between pairs of numeric variables is studied with scatter plots, fitted regression lines and two correlation coefficients. **Pearson's r** measures linear association and is sensitive to outliers; **Spearman's rho** measures monotonic association from ranks and is robust to outliers.`));
  c.push(...code(`from scipy import stats
r, p   = stats.pearsonr(df["attendance_rate"], df["gpa_semester_2"])
rho, p = stats.spearmanr(df["attendance_rate"], df["gpa_semester_2"])
fit    = stats.linregress(df["attendance_rate"], df["gpa_semester_2"])
print(r, rho, fit.slope, fit.intercept, fit.rvalue ** 2)`));
  c.push(tcap('Pearson and Spearman correlation for selected numeric pairs'));
  c.push(csvTable('u4_numeric_pairs', { widths: [20, 22, 9, 10, 9, 10, 10, 10], left: [0, 1], size: 15 }));
  c.push(gap());
  c.push(...fig('u4_scatter_pairs', 'Scatter plots with fitted regression lines for six numeric pairs (5,000-student sample)', 620, 370));
  c.push(obs(`The strongest relationships are between the two GPAs (r = ${f3(u4.r_g1g2)}) and between failed units and GPA (r = ${f3(u4.r_fail_gpa2)}); failing units lowers GPA directly. Attendance and assignment submission are only moderately related (r = ${f3(u4.r_att_assign)}), and attendance explains just ${f1(100 * u4.r2_att_gpa2)}% of the variance in GPA. Several pairs one might expect to be linked are almost independent: admission grade and previous qualification grade (r = ${f3(u4.r_adm_prev)}), and LMS logins and library visits (r = ${f3(u4.r_lms_lib)}). Pearson and Spearman agree closely for every pair because the variables are not heavily skewed. Working hours reduce GPA slightly (r = ${f3(u4.r_work_gpa2)}).`));
  c.push(P(`The most important numeric relationship for this project is between each variable and the target. For a binary target the Pearson correlation is the point-biserial correlation.`));
  c.push(...fig('u4_corr_with_dropout', 'Correlation of every numeric variable with dropout', 400, 400));
  c.push(obs(`Protective factors (negative r) are semester-1 GPA (${f3(u4.top_neg_r)}), semester-2 GPA (${f3(u4.top_neg2_r)}), attendance, assignment submission, units passed, library visits and LMS activity. Risk factors (positive r) are failed units (+${f3(u4.top_pos_r)}), missed deadlines (+${f3(u4.top_pos2_r)}), weekly work hours (+${f3(u4.top_pos3_r)}), part-time job, stress and first-generation status. Age (${f3(u4.r_age)}), commute time (${f3(u4.r_commute)}) and international status (${f3(u4.r_intl)}) have essentially zero correlation with dropout. These correlations describe association, not causation: low GPA may cause dropout, but a student who is about to leave may also stop studying.`));

  c.push(H2('6.2 Two Categorical Variables'));
  c.push(P(`Two categorical variables are compared with a contingency table (cross-tab), grouped and stacked bar charts, the chi-square test of independence and Cramér's V, which rescales chi-square to a 0-1 strength measure (about 0.1 is small, 0.3 medium and 0.5 large).`));
  c.push(...code(`ct = pd.crosstab(df["family_income_level"], df["dropout"])
chi2, p, dof, expected = stats.chi2_contingency(ct)
cramers_v = np.sqrt(chi2 / (ct.values.sum() * (min(ct.shape) - 1)))
pd.crosstab(df["family_income_level"], df["dropout"], normalize="index") * 100
ct_pct.plot(kind="bar", stacked=True)        # stacked bar
ct.plot(kind="bar")                          # grouped bar`));
  c.push(tcap('Cross-tabulation of family income and dropout (counts and row percentages)'));
  {
    const a = L.csv('u4_crosstab_income').rows, b = L.csv('u4_crosstab_income_pct').rows;
    const hdr = L.csv('u4_crosstab_income').headers;
    const di = hdr.indexOf('Dropped out'), si = hdr.indexOf('Stayed');
    c.push(table(['Family income', 'Dropped out', 'Stayed', 'Dropped out %', 'Stayed %'],
      a.map((r, i) => [r[0], f0(Number(r[di])), f0(Number(r[si])), f1(Number(b[i][1])), f1(Number(b[i][2]))]), { widths: [24, 19, 19, 19, 19], size: 18 }));
  }
  c.push(gap());
  c.push(tcap('Chi-square tests and Cramér\'s V of each categorical/binary variable against dropout'));
  c.push(csvTable('u4_chi_square', { widths: [36, 16, 8, 14, 16], left: [0], fmt: { 1: num(1) }, size: 17 }));
  c.push(gap());
  c.push(...fig('u4_catcat_bars', 'Grouped bar (left) and stacked 100% bars (middle, right) of outcome by income and course type', 620, 220));
  c.push(...fig('u4_grouped_bars', 'Grouped bars: dropout rate by income and study mode (left), and by tuition status and scholarship (right)', 580, 230));
  c.push(...fig('u4_cramers_v', "Cramér's V: strength of association of each variable with dropout", 400, 300));
  c.push(obs(`Family income gives chi-square = ${f1(u4.chi2_income)} with ${u4.dof_income} degrees of freedom and Cramér's V = ${f3(u4.cv_income)}, the largest association among the categorical variables, followed by work load (${f3(u4.cv_2_val)}), having a part-time job (${f3(u4.cv_3_val)}), unpaid tuition (${f3(u4.cv_tuition)}) and first-generation status (0.099). The variables with no association at all are course type (V = ${f3(u4.cv_course)}, p = ${u4.p_course}), gender (V = ${f3(u4.cv_gender)}, p = ${u4.p_gender}) and nationality (V = ${f3(u4.cv_nat)}, p = ${u4.p_nat}), together with international status and age group. The grouped bars show that the income effect is the same in every study mode, and that tuition and scholarship effects are separate: unpaid-tuition students without a scholarship drop out most. Even the largest V is only about 0.19, which is a small-to-moderate effect, so no single categorical variable is a strong predictor on its own.`));

  c.push(H2('6.3 Numerical and Categorical Variables'));
  c.push(P(`Box plots and violin plots compare the distribution of a numeric variable across the groups of a categorical variable; a violin plot adds a kernel density outline to the box. Differences between two groups are tested with the Welch t-test and the non-parametric Mann-Whitney U test, and quantified with Cohen's d (0.2 small, 0.5 medium, 0.8 large). Differences across more than two groups use one-way ANOVA and Kruskal-Wallis with eta-squared as the effect size.`));
  c.push(...code(`sns.boxplot(data=d, x="dropout_label", y="gpa_semester_2")
sns.violinplot(data=d, x="dropout_label", y="gpa_semester_2", inner="quartile", cut=0)
a, b = d[d.dropout == 1].gpa_semester_2, d[d.dropout == 0].gpa_semester_2
print(stats.ttest_ind(a, b, equal_var=False), stats.mannwhitneyu(a, b))
cohen_d = (a.mean() - b.mean()) / np.sqrt(((len(a)-1)*a.var() + (len(b)-1)*b.var()) / (len(a)+len(b)-2))
print(stats.f_oneway(*groups), stats.kruskal(*groups))`));
  c.push(...fig('u4_box_violin_dropout', 'Box plots (top) and violin plots (bottom) of four variables by outcome', 620, 300));
  c.push(tcap('Students who stayed versus dropped out: tests and effect sizes (top 12 by |Cohen\'s d|)'));
  c.push(csvTable('u4_ttests', { limit: 12, widths: [24, 10, 10, 9, 10, 12, 11, 12], left: [0], size: 15 }));
  c.push(gap());
  c.push(obs(`${u4.n_sig} of the 19 variables differ significantly (p < 0.001) between the two groups, but significance is not importance: with 100,000 students even a difference of 0.4 units of units_enrolled is "significant". Cohen's d separates the variables clearly: ${u4.n_large} have a large effect (semester-1 GPA d = ${f2(u4.d_gpa1)}, semester-2 GPA d = ${f2(u4.d_gpa2)}, failed units d = +${f2(u4.d_fail)}), ${u4.n_medium} medium (attendance, missed deadlines, assignment submission, units passed), ${u4.n_small} small and ${u4.n_negl} negligible, including age, commute time and units enrolled. On average dropouts have a semester-2 GPA of ${f2(u4.mean_gpa2_drop)} against ${f2(u4.mean_gpa2_stay)}, ${f2(u4.mean_fail_drop)} failed units against ${f2(u4.mean_fail_stay)}, and attendance of ${f1(u4.mean_att_drop)}% against ${f1(u4.mean_att_stay)}%. The Mann-Whitney results agree with the t-tests, so the conclusions do not depend on normality.`));
  c.push(...fig('u4_box_violin_groups', 'Box and violin plots of numeric variables across income, study mode, course and semester', 620, 310));
  c.push(tcap('ANOVA and Kruskal-Wallis tests across groups'));
  c.push(csvTable('u4_anova_kruskal', { widths: [22, 22, 11, 11, 11, 11, 12], left: [0, 1], size: 16 }));
  c.push(gap());
  c.push(obs(`Semester-2 GPA differs strongly across income groups (F = 1,626, eta-squared = ${f4(u4.eta_gpa2_income)}, so income explains about 3% of GPA variance), but not at all across course types (p = ${u4.p_gpa2_course}, eta-squared = ${f4(u4.eta_gpa2_course)}) and admission grade does not differ by course. Attendance differs by study mode (eta-squared ${f3(u4.eta_att_mode)}), and stress differs by work load (${f3(u4.eta_stress_work)}). Both ANOVA and Kruskal-Wallis lead to the same conclusions. All eta-squared values are small (below 0.04): group membership explains little of the variation within any single variable.`));

  // ------------------------------------------------------------------ 7 MULTIVARIATE
  c.push(H1('7. Multivariate Analysis and Insights'));
  c.push(H2('7.1 Pair Plot (Scatter Matrix)'));
  c.push(P(`A pair plot draws all pairwise scatter plots of several variables and the distribution of each variable on the diagonal. Five key academic variables are plotted for a random sample of 1,500 students, coloured by outcome. Only the lower triangle is drawn (corner=True) because the matrix is symmetric.`));
  c.push(...code(`s = d.sample(1500, random_state=42)[pp_vars + ["dropout_label"]]
sns.pairplot(s, hue="dropout_label", corner=True, diag_kind="kde", palette={"Stayed": "#2a9d8f", "Dropped out": "#e76f51"})`));
  c.push(...fig('u5_pairplot', 'Pair plot of key academic variables coloured by outcome', 560, 560));
  c.push(obs(`The diagonal KDEs show that the two groups are best separated on GPA (both semesters) and failed units, and only partially on attendance and assignment submission. The GPA1-GPA2 panel shows a tight upward band and the failed-units panels show a downward trend. In every panel the orange (dropout) points occupy the lower-left or lower region but overlap heavily with the green points: dropout is a probabilistic outcome, not a deterministic one.`));

  c.push(H2('7.2 Correlation Heatmaps'));
  c.push(P(`A correlation heatmap summarises all pairwise correlations in a colour-coded matrix. The figures below show the full Pearson matrix of 27 variables plus the target, and a focused Pearson and Spearman comparison for 13 key variables.`));
  c.push(...code(`corr = d[num_cols + ["dropout"]].corr()
sns.heatmap(corr, cmap="coolwarm", center=0, vmin=-1, vmax=1, annot=True, fmt=".2f")
sns.heatmap(d[focus].corr("spearman"), cmap="coolwarm", center=0, annot=True)`));
  c.push(...fig('u5_heatmap_full', 'Full Pearson correlation heatmap (27 variables and dropout)', 600, 520));
  c.push(...fig('u5_heatmap_focus', 'Pearson (left) and Spearman (right) correlation heatmaps of 13 key variables', 620, 280));
  c.push(tcap('Strongest correlations in the dataset'));
  c.push(csvTable('u5_top_correlations', { limit: 10, rename: ['Variable A', 'Variable B', 'Pearson r'], widths: [38, 38, 24], left: [0, 1], size: 18 }));
  c.push(gap());
  c.push(obs(`Most variable pairs are only weakly correlated: only 5 of the 351 pairs of predictors exceed |r| = 0.5. The strongest are structural: weekly_work_hours with part_time_job (r = 0.886, because hours are 0 when there is no job) and units_enrolled with units_passed (0.825). The meaningful ones are GPA1 with GPA2 (0.830) and failed units with GPA1 (-0.746). The three strongest correlations with the target are semester-1 GPA, semester-2 GPA and failed units. Because predictor-predictor correlation is low apart from these academic variables, multicollinearity is only a mild concern for models, in contrast with datasets of nested counts. Spearman and Pearson matrices are nearly identical.`));

  c.push(H2('7.3 Grouped Multivariate Visualizations'));
  c.push(P(`Grouping by two or three variables at once reveals interactions that single-variable views hide. Heatmaps of the dropout rate over attendance band by GPA band, failed-unit band by work load, and income by study mode are shown below.`));
  c.push(...code(`p2 = d.pivot_table(index="attendance_band", columns="gpa_band", values="dropout", aggfunc="mean") * 100
sns.heatmap(p2.iloc[::-1], annot=True, fmt=".0f", cmap="YlOrRd")
rf = d.groupby("risk_flags").dropout.agg(["size", "mean"])`));
  c.push(...fig('u5_grouped_heatmaps', 'Dropout rate (%) over pairs of grouping variables', 620, 215));
  c.push(obs(`Risk compounds. Students with attendance below 50% and an average GPA below 1.5 drop out ${f1(u5.risk_low_low)}% of the time, while those with attendance of 90-100% and GPA of 3.0-4.0 drop out only ${f1(u5.risk_hi_hi)}% of the time. GPA dominates attendance: within the lowest GPA band even 90-100% attendance leaves a 67% dropout rate, but within the highest GPA band even attendance below 50% leaves only 5.7%. Failed units and work load add together: with no failed units a heavy workload raises dropout only from 3.1% to 8.4%, but with five or more failed units it raises it from 58.0% to 78.4%. Income and study mode simply add (no interaction).`));
  c.push(tcap('Dropout rate by number of risk flags (0-6)'));
  c.push(csvTable('u5_risk_flags', { rename: ['Risk flags', 'Students', 'Dropout %'], widths: [30, 35, 35], fmt: { 1: int, 2: num(1) }, size: 18 }));
  c.push(gap());
  c.push(...fig('u5_risk_flags', 'Dropout rate rises with each additional risk flag', 560, 200));
  c.push(obs(`A simple rule-based count of six warning signs (at least 4 failed units, attendance below 60%, assignments below 50%, at least 4 missed deadlines, semester-2 GPA below 1.5, unpaid tuition) already separates students very well: ${f1(u5.flag0)}% dropout with no flags, ${f1(u5.flag3)}% with three flags and ${f1(u5.flag_max)}% with all six. This is an interpretable early-warning rule that advisers could apply without any machine-learning model.`));
  c.push(...fig('u5_profile_heatmap', 'Standardised group profile: students who stayed versus dropped out', 300, 400));

  c.push(H2('7.4 Dimensionality Reduction using PCA'));
  c.push(P(`Principal Component Analysis rotates the data into new, uncorrelated axes (principal components) ordered by the variance they explain. The ${u5.n_feat} numeric and binary variables were standardised (mean 0, standard deviation 1) because PCA is sensitive to scale, and the target was excluded.`));
  c.push(...code(`from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
Xs  = StandardScaler().fit_transform(d[num_cols])      # 27 features
pca = PCA().fit(Xs); print(pca.explained_variance_ratio_)
Z   = PCA(n_components=2).fit_transform(Xs)`));
  c.push(tcap('Variance explained by the first ten principal components'));
  c.push(csvTable('u5_pca_variance', { widths: [30, 35, 35], size: 18 }));
  c.push(gap());
  c.push(...fig('u5_pca', 'Scree plot, PCA projection coloured by outcome, and loading plot', 620, 200));
  c.push(obs(`PC1 explains only ${f1(u5.pca_ev1)}% and PC2 ${f1(u5.pca_ev2)}% of the variance, ${f1(u5.pca_cum2)}% together, and ${u5.n80} components are needed to reach 80% (${u5.n90} for 90%). The variables are therefore not redundant, and PCA is of limited use for compressing this dataset. It is still informative: PC1 is an academic-performance axis (loadings: GPA1 ${f2(u5.pc1_loadings.gpa_semester_1)}, GPA2 ${f2(u5.pc1_loadings.gpa_semester_2)}, failed units ${f2(u5.pc1_loadings.units_failed)}) and correlates r = ${f2(u5.pc1_dropout_r)} with dropout, while PC2 is a work and stress axis (work hours ${f2(u5.pc2_loadings.weekly_work_hours)}, part-time job ${f2(u5.pc2_loadings.part_time_job)}, stress ${f2(u5.pc2_loadings.stress_level)}) that is uncorrelated with dropout (r = ${f2(u5.pc2_dropout_r)}). In the projection the two outcomes separate mainly along PC1 but overlap in the middle, which previews the limit of any classifier.`));

  c.push(H2('7.5 K-Means Clustering'));
  c.push(P(`K-Means groups observations into k clusters by minimising the distance to the cluster centres. It was applied to the eight standardised academic and engagement variables (both GPAs, attendance, assignment submission, failed units, missed deadlines, LMS logins, library visits). The outcome was not used for clustering, so dropout rates per cluster are an independent check.`));
  c.push(...code(`from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
for k in range(2, 9):
    km = KMeans(n_clusters=k, n_init=5, random_state=42).fit(Xk)
    inertia.append(km.inertia_); sil.append(silhouette_score(Xk[sub], km.labels_[sub]))
km = KMeans(n_clusters=4, n_init=10, random_state=42).fit(Xk)
d["cluster"] = km.labels_
d.groupby("cluster").dropout.agg(["size", "mean"])`));
  c.push(...fig('u5_kmeans_selection', 'Elbow method and silhouette scores for k = 2 to 8', 480, 180));
  c.push(P(`The elbow curve has no sharp bend and the silhouette score is highest for k = ${u5.k_best_sil} (${f2(u5.sil_best)}) and low overall (${f2(u5.sil_k4)} for k = 4), which means that the students form a continuum rather than naturally separated groups. k = 4 was nevertheless chosen because it gives segments that are interpretable and useful for intervention; this is a pragmatic segmentation, not proof of four true groups.`));
  c.push(tcap('Profile of the four K-Means segments (sorted by dropout rate)'));
  c.push(csvTable('u5_cluster_profile', { cols: [11, 1, 2, 3, 4, 5, 6, 7, 8], rename: ['Segment', 'Students', 'Dropout %', 'GPA S1', 'GPA S2', 'Attend. %', 'Assign. %', 'Failed', 'Missed'],
    widths: [16, 12, 12, 9, 9, 11, 11, 10, 10], fmt: { 1: int }, size: 16 }));
  c.push(gap());
  c.push(...fig('u5_kmeans_clusters', 'K-Means segments in PCA space, dropout rate per segment and standardised cluster centres', 620, 200));
  c.push(obs(`The segments differ greatly in outcome although the algorithm never saw the target. The high-risk segment (${f0(u5.cl_sizes[0])} students, ${f1(u5.cl_drop[0])}% dropout) has the lowest GPA, the most failed units and weak attendance. The low-risk segment (${f0(u5.cl_sizes[3])} students, only ${f1(u5.cl_drop[3])}% dropout) has high GPA, almost no failures and heavy use of the library and LMS. The two middle segments are the most interesting: the "at-risk" segment has acceptable grades but poor attendance (61%) and assignment submission (58%) with ${f1(u5.cl_drop[1])}% dropout, while the "moderate" segment attends well but fails more units, with ${f1(u5.cl_drop[2])}% dropout. They need different interventions: engagement support for the first, academic tutoring for the second.`));

  c.push(H2('7.6 Scikit-learn Model Development'));
  c.push(P(`Three classifiers were trained to predict dropout from the ${u5.n_features} predictors: logistic regression (scaled numerics, one-hot categoricals), a random forest (120 trees, depth 12) and a histogram gradient-boosting classifier. The data were split 80/20 with stratification on the target (${f0(u5.n_train)} training and ${f0(u5.n_test)} test students, random_state = 42). Because the target is imbalanced, models are judged on precision, recall, F1 and ROC-AUC as well as accuracy, with the majority-class baseline (${f1(u5.base_acc)}% accuracy) as reference. Five-fold stratified cross-validation of ROC-AUC on the training set checks stability.`));
  c.push(...code(`from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.20, stratify=y, random_state=42)
model = Pipeline([("pre", ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
                                              ("num", StandardScaler(), num_cols)])),
                  ("clf", LogisticRegression(max_iter=1000))]).fit(X_tr, y_tr)
proba = model.predict_proba(X_te)[:, 1]
print(roc_auc_score(y_te, proba), accuracy_score(y_te, proba >= .5))
skf = StratifiedKFold(5, shuffle=True, random_state=42)
print(cross_val_score(model, X_tr, y_tr, cv=skf, scoring="roc_auc"))`));
  c.push(tcap('Model results on the 20% test set and 5-fold cross-validation'));
  c.push(csvTable('u5_model_results', { cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rename: ['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC', 'PR-AUC', 'CV AUC', 'CV std', 'Train AUC'],
    widths: [24, 9, 9, 9, 8, 9, 9, 9, 8, 9], left: [0], fmt: { 1: num(3), 2: num(3), 3: num(3), 4: num(3), 5: num(3), 6: num(3), 7: num(3), 8: num(4), 9: num(3) }, size: 15 }));
  c.push(gap());
  c.push(...fig('u5_model_evaluation', 'ROC curves, confusion matrix of the best model and precision-recall trade-off', 620, 200));
  c.push(obs(`All three models are far better than the baseline (accuracy 0.84 against 0.68) and very close to one another (AUC 0.894 to 0.903). **The simplest model, logistic regression, is the best** (AUC ${f3(u5.m_logistic_auc)}, accuracy ${f3(u5.m_logistic_acc)}, precision ${f3(u5.m_logistic_prec)}, recall ${f3(u5.m_logistic_rec)}, F1 ${f3(u5.m_logistic_f1)}). The random forest and gradient boosting do no better and show a larger gap between training AUC (0.92) and test AUC (0.89-0.90), a sign of mild over-fitting, whereas for logistic regression train AUC (${f3(u5.m_logistic_trainauc)}) and test AUC match. This indicates that the relationships are largely additive and linear and that there are no strong hidden interactions to exploit. Cross-validation (${f3(u5.m_logistic_cv)} +/- ${f4(u5.m_logistic_cvstd)}) agrees with the test score, so the result is stable and not an accident of one split. Remaining errors (${f0(u5.fn)} missed dropouts and ${f0(u5.fp)} false alarms among ${f0(u5.n_test)} test students) reflect the heavy overlap seen in all earlier plots.`));
  c.push(tcap('Effect of the decision threshold (best model)'));
  c.push(csvTable('u5_thresholds', { widths: [20, 20, 20, 20, 20], size: 18 }));
  c.push(gap());
  c.push(P(`The default threshold of 0.5 gives recall of ${pc(u5.thr_rec_05)} at precision ${pc(u5.thr_prec_05)}. For an early-warning system, missing a student who will drop out is usually worse than a false alarm, so a lower threshold is sensible: at 0.3 recall rises to ${pc(u5.thr_rec_03)} while precision falls to ${pc(u5.thr_prec_03)}. The right threshold depends on the cost of support and the capacity of advisers.`));
  c.push(...fig('u5_feature_importance', 'Permutation importance of the best model (drop in ROC-AUC when a feature is shuffled)', 400, 340));
  c.push(obs(`Semester-1 GPA is by far the most important feature (AUC falls by ${f3(u5.top1_imp)} when it is shuffled), followed by semester-2 GPA, attendance, tuition status, failed units, LMS logins, family income and missed deadlines. Permutation importance understates features that share information, such as the two GPAs and failed units, so the real weight of academic performance is larger than the individual bars suggest. The ranking agrees with the correlation and effect-size analysis of Unit 4.`));
  c.push(tcap('Risk deciles of the best model on the test set'));
  c.push(csvTable('u5_risk_deciles', { rename: ['Decile (10 = highest risk)', 'Students', 'Predicted risk %', 'Actual dropout %'], widths: [34, 20, 23, 23], fmt: { 1: int }, size: 17 }));
  c.push(gap());
  c.push(...fig('u5_risk_deciles', 'Actual dropout rate by predicted-risk decile', 400, 230));
  c.push(obs(`Ranking students by predicted risk works very well. Actual dropout rises from ${f1(u5.lift_bottom)}% in the lowest-risk decile to ${f1(u5.lift_top)}% in the highest, and the predicted risk is well calibrated (for example 57.2% observed against 56.8% predicted in decile 8). If advisers could contact only the 20% of students with the highest predicted risk, they would reach ${pc(u5.cap20)} of all students who actually drop out, against 20% by random selection (a lift of 2.7).`));

  c.push(H2('7.7 Fairness Audit and Sensitive Attributes'));
  c.push(P(`A model that is accurate on average can still treat groups differently. The best model's predictions on the test set were therefore compared across gender, family income, origin, disability and first-generation status. For each group the table reports the actual dropout rate, the share of students flagged, recall (true-positive rate) and false-positive rate.`));
  c.push(tcap('Fairness audit of the best model (threshold 0.5)'));
  c.push(csvTable('u5_fairness_audit', { widths: [20, 18, 9, 13, 11, 13, 14, 10], left: [0, 1], fmt: { 2: int }, size: 15, rename: ['Attribute', 'Group', 'n', 'Actual dropout %', 'Flagged %', 'Recall %', 'False-pos. %', 'Accuracy %'] }));
  c.push(gap());
  c.push(...fig('u5_fairness', 'Recall and false-positive rate of the model by group', 560, 220));
  c.push(tcap('Does removing sensitive attributes change the model?'));
  c.push(csvTable('u5_ablation_sensitive', { widths: [34, 14, 14, 19, 19], left: [0], fmt: { 1: num(4), 2: num(4), 3: num(1), 4: num(1) }, size: 17 }));
  c.push(gap());
  c.push(obs(`Accuracy is almost identical for men, women and other genders (83.9% to 87.0%), domestic and international students and students with and without disabilities, and the recall for gender differs by only ${f1(u5.gen_rec_max - u5.gen_rec_min)} points. Income is different: the model flags ${f1(u5.inc_flag_low)}% of low-income students but only ${f1(u5.inc_flag_high)}% of high-income students, catching ${f1(u5.inc_rec_low)}% of low-income dropouts but only ${f1(u5.inc_rec_high)}% of high-income dropouts, and it raises more false alarms for low-income students (${f1(u5.inc_fpr_low)}% against ${f1(u5.inc_fpr_high)}%). Part of this is legitimate because the real dropout rates differ (42.9% against 20.0%), but it means high-income students who are at risk are more likely to be overlooked. First-generation students and students with disabilities are also flagged more often. Removing the five most sensitive attributes (gender, nationality, international status, disability, first-generation) costs almost nothing (AUC ${f4(u5.abl_auc_full)} to ${f4(u5.abl_auc_wo)}) but does not remove the income gap, because income and finance carry real signal. Excluding sensitive attributes is therefore a free and sensible precaution but not a complete fairness solution.`));
  return c;
};

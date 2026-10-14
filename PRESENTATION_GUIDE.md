# How to present / demo this project (5–8 minutes)

1. **Problem (30 s):** "We explore a 100,000-student dataset to find who drops out and why, and test whether it can be predicted fairly."
2. **Unit 1 (1 min):** show `outputs/tables/u1_quality_checks.csv` – no missing/duplicates, 12,758 under-18 flagged. Explain log1p on skewed counts and Classical vs Bayesian (Fig: u1_bayesian).
3. **Unit 2 (1 min):** show `u2_scatter.png`, `u2_contour.png`, `u2_3d_surface.png`; open `interactive/offline_interactive_scatter.html` (hover demo).
4. **Unit 3 (1 min):** `u3_histograms_all.png`, skew table: only 3 skewed variables; outliers kept on purpose.
5. **Unit 4 (1 min):** `u4_corr_with_dropout.png`, `u4_cramers_v.png`. Message: with 100k rows p-values are always tiny → use effect sizes (Cohen's d).
6. **Unit 5 (2 min):** `u5_grouped_heatmaps.png`, PCA, K-Means segments, `u5_model_evaluation.png`.
7. **Live demo (1 min):** `python src/predict_demo.py` → 3 students: low / high risk.
8. **Ethics (30 s):** fairness audit (`u5_fairness.png`) – support not punishment.

## Likely viva questions
* *Why logistic regression instead of random forest?* It scored best (AUC 0.903 vs 0.894) – relationships are mostly additive; also more explainable.
* *Why not just use accuracy?* Target is 68/32; baseline already 68 %. We use AUC, recall, precision.
* *Why log1p?* Skewness 1.7 → 0.1 for missed deadlines; log1p handles zeros.
* *Why effect sizes?* n = 100,000 makes tiny differences "significant".
* *Why did you keep outliers?* They are real behaviour (many missed deadlines), not errors; winsorising barely changes the mean.
* *Why k = 4 for K-Means?* Silhouette is low for all k (continuum); k = 4 chosen for interpretable segments.
* *Is the model fair?* Equal accuracy by gender/origin/disability, but recall gap by income – discussed in Section 7.7 / 8.2.
* *Limitation?* Source unknown/likely simulated; GPA may be partly a consequence of leaving; correlation ≠ causation.

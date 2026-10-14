# Student Dropout Risk – Exploratory Data Analysis and Visualization
Mini project for **24UAD512 – Data Exploration and Visualization** (Units 1–5).

Dataset: `data/student_dropout_risk_2026.csv` – 100,000 students × 34 columns, target `dropout` (32.0 % = 1).

## Folder structure
```
data/                 the CSV
src/
  utils.py            shared helpers (paths, style, feature engineering, result recording)
  01_unit1_eda.py     Unit 1 – loading, quality checks, slicing, transformation, grouping, classical vs Bayesian
  02_unit2_matplotlib.py  Unit 2 – line, bar, scatter, hist, density, contour, error bars, subplots, 3D, Seaborn
  06_interactive.py   Unit 2 – Plotly + Bokeh (+ dependency-free offline HTML)
  03_unit3_univariate.py  Unit 3 – summary stats, skewness, outliers, bar/pie/frequency tables
  04_unit4_bivariate.py   Unit 4 – Pearson/Spearman, chi-square, Cramér's V, t-test, ANOVA, Kruskal
  05_unit5_multivariate.py Unit 5 – pair plot, heatmaps, PCA, K-Means, ML models, fairness audit
  predict_demo.py     live demo using the trained model
  run_all.py          runs everything (~3-4 min)
outputs/figures/      40 PNG figures        outputs/tables/   CSV tables        outputs/results.json  key numbers
interactive/          HTML interactive plots
models/best_model.joblib   trained logistic-regression pipeline
report/               Student_Dropout_EDA_Report.docx (+ PDF) and the Node script that builds it
```

## How to run
```bash
python -m venv venv
venv\Scripts\activate            # Windows   (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
python src/run_all.py            # regenerates every figure, table and the model
python src/predict_demo.py       # demo: predicts risk for 3 example students
python src/predict_demo.py --interactive   # type your own student values
```
Each script can also be run alone (e.g. `python src/03_unit3_univariate.py`) and works cell-by-cell
in VS Code (`# %%` markers). Open `interactive/*.html` in a browser.

## Key results
* Dropout 32.0 % (95 % CI 31.7–32.3 %). GPA (sem 1 & 2) and failed units are the strongest signals.
* Low income 42.9 % vs high income 20.0 %; unpaid tuition 44.2 % vs 28.7 %.
* Course type, gender, nationality, age: no association with dropout.
* Logistic regression: ROC-AUC 0.903, accuracy 84.0 % (baseline 68.0 %), 5-fold CV AUC 0.904.
* Top-20 % highest-risk students contain 54 % of all dropouts.
* Fairness audit: recall 76.8 % (low income) vs 55.7 % (high income).

## Notes
* The CSV has no stated source and looks simulated – add the source/link in report section 1.5 if your faculty gave one.
* Rebuild the report: `cd report && node build_report.js` (needs Node + `npm i docx`).

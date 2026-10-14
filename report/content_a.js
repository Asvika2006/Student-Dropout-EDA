const L = require('./lib');
const { R, f0, f1, f2, f3, f4, pc, H1, H2, P, bullets, obs, code, fig, table, tcap, gap, csvTable, num, int } = L;
const u1 = R.u1, u2 = R.u2, u3 = R.u3, u4 = R.u4, u5 = R.u5;

module.exports = function partA() {
  const c = [];

  // ------------------------------------------------------------------ ABSTRACT
  c.push(H1('Abstract'));
  c.push(P(`Student dropout is one of the most costly problems in higher education, and the data that could explain it are usually messy, skewed and full of weak signals. This capstone project applies the complete Data Exploration and Visualization syllabus (Units 1 to 5) to a student-level dataset named student_dropout_risk_2026.csv. The dataset contains ${f0(u1.rows)} students, ${u1.cols} variables and a binary target, dropout, which equals 1 for ${pc(u1.p)} of the students (${f0(u1.dropouts)} students).`));
  c.push(P(`The workflow follows the five units. Unit 1 covers loading, inspection, data-quality checks, slicing, transformation, grouping and a comparison of classical and Bayesian analysis. Unit 2 covers Matplotlib visualization (line, bar, scatter, histogram, density, contour, error-bar, subplot, annotation and 3D plots) together with Seaborn, Plotly and Bokeh. Unit 3 covers univariate analysis of numerical and categorical variables. Unit 4 covers bivariate analysis with Pearson and Spearman correlation, chi-square with Cramér's V, Welch t-test, Mann-Whitney, ANOVA and Kruskal-Wallis tests with effect sizes. Unit 5 covers multivariate analysis with pair plots, heatmaps, grouped visualizations, Principal Component Analysis (PCA), K-Means clustering and scikit-learn classification models with cross-validation, a fairness audit and a risk-decile (lift) analysis.`));
  c.push(P(`The main findings are: (1) the data are structurally clean, with no missing values and no duplicates; (2) academic performance is the strongest signal, because semester-1 GPA (r = ${f3(u4.top_neg_r)}), semester-2 GPA (r = ${f3(u4.top_neg2_r)}) and the number of failed units (r = +${f3(u4.top_pos_r)}) are the three variables most related to dropout, each with a large effect size (Cohen's d from ${f2(Math.abs(u4.d_fail))} to ${f2(Math.abs(u4.d_gpa1))}); (3) socio-economic and financial factors matter, with dropout of ${pc(0.4292)} among low-income students against ${pc(0.1999)} among high-income students, and ${pc(0.4422)} when tuition is not up to date against ${pc(0.2865)} when it is paid; (4) course type, gender, nationality, age and international status show essentially no association with dropout (Cramér's V below 0.01); (5) risk compounds sharply, since a student with attendance below 50% and GPA below 1.5 drops out ${f1(u5.risk_low_low)}% of the time against ${f1(u5.risk_hi_hi)}% for a student with high attendance and a GPA above 3.0; (6) PCA shows that the variables are not very redundant (${u5.n80} of ${u5.n_feat} components are needed for 80% of the variance); (7) K-Means separates four student segments whose dropout rates range from ${f1(u5.cl_lo)}% to ${f1(u5.cl_hi)}%; and (8) a logistic regression model reaches ROC-AUC ${f3(u5.m_logistic_auc)} and accuracy ${pc(u5.m_logistic_acc)} against a majority-class baseline of ${f1(u5.base_acc)}%, with a stable five-fold cross-validated AUC of ${f3(u5.m_logistic_cv)}. The students in the highest-risk decile drop out ${f1(u5.lift_top)}% of the time against ${f1(u5.lift_bottom)}% in the lowest decile. A fairness audit shows that the model is equally accurate across gender, origin and disability groups but flags a much larger share of low-income students, which is discussed in the ethics section. All code, figures, tables, interactive outputs and a trained model are organised in a GitHub-ready project folder.`));

  // ------------------------------------------------------------------ 1 INTRODUCTION
  c.push(H1('1. Introduction'));
  c.push(H2('1.1 Background and Motivation'));
  c.push(P(`Every student who leaves a degree programme before finishing represents lost opportunity for the student and lost resources for the institution. Dropout is rarely caused by a single reason. Poor academic performance, financial pressure, heavy part-time work, low engagement, stress and a lack of family experience with university can all contribute, and they often interact. Universities increasingly collect data on grades, attendance, learning-platform activity and background in order to build early-warning systems that identify students who need support before they leave.`));
  c.push(P(`Exploratory Data Analysis (EDA), a term popularised by John Tukey, is the first and most decisive step in building such a system. EDA combines numerical summaries with visualization so that distributions, outliers, data-quality problems and relationships become visible before any model is trained. Python libraries such as Pandas, Matplotlib, Seaborn, Plotly, Bokeh, SciPy and scikit-learn make it possible to run a complete and reproducible EDA, and a script or notebook shared on GitHub allows every figure in this report to be regenerated.`));
  c.push(P(`This project chooses a large and analytically rich dataset: ${f0(u1.rows)} students described by ${u1.cols - 2} predictors covering demographics, finances, study behaviour, academic results, engagement and wellbeing. It contains both strong and weak predictors, a mildly imbalanced target, skewed variables with real outliers, sensitive attributes that raise ethical questions, and enough rows for stable statistics. This makes it possible to demonstrate every technique in the syllabus meaningfully.`));
  c.push(H2('1.2 Problem Statement'));
  c.push(P(`Given a student-level dataset with a dropout label, the goal is to explore the data systematically and answer the following questions with Python code, statistics and visualizations: How common is dropout and how certain is that estimate? Is the data clean and which variables need transformation? Which academic, financial, behavioural and demographic factors are related to dropout, how strongly, and which are not? Do variables combine to create very high-risk or very low-risk groups? Can dropout be predicted reliably from the available variables, and is such a prediction fair to different groups of students?`));
  c.push(P(`A particular challenge is that with ${f0(u1.rows)} observations almost every statistical test returns a p-value below 0.001, even for trivial differences. The analysis therefore reports effect sizes (Cohen's d, Cramér's V, eta-squared) next to p-values, so that statistical significance is not confused with practical importance.`));
  c.push(H2('1.3 Objectives'));
  c.push(...bullets([
    'To load, inspect and clean a real-world-style dataset using Python and Pandas, documenting missing values, duplicates, data types, encoding and logical consistency.',
    'To transform and group the data (derived performance and engagement features, log transformation, scaling, encoding, group summaries).',
    'To produce all visualization types listed in the syllabus using Matplotlib, Seaborn, Plotly and Bokeh.',
    'To perform univariate, bivariate and multivariate analysis with appropriate statistical measures, tests and effect sizes.',
    'To apply PCA for dimensionality reduction and K-Means for student segmentation.',
    'To develop, evaluate and critically assess scikit-learn classification models using a stratified train/test split, cross-validation, threshold analysis and a risk-decile (lift) analysis.',
    'To audit the model for fairness across gender, income, origin, disability and first-generation status, and to discuss ethical use.',
    'To communicate the findings through observations, conclusions and a reproducible GitHub repository with a runnable demo.',
  ]));
  c.push(H2('1.4 Scope of the Project'));
  c.push(P(`The project is descriptive and exploratory with a supervised prediction demonstration. It analyses one student-level CSV file; it does not use time-stamped histories, course-level records or free-text data, and it makes no causal claims. The classification model is an academic demonstration of the scikit-learn workflow and is not intended for operational decision-making without validation on real institutional data. All five units are covered, and the coverage matrix in Section 1.6 maps every syllabus topic to the section and figure where it is demonstrated.`));
  c.push(H2('1.5 Dataset Source and Supporting Document'));
  c.push(P(`The CSV supplied for this project (file name student_dropout_risk_2026.csv, ${f2(u1.file_mb)} MB) does not embed a download URL, publisher or licence information, so this report does not invent an original download link. The column names and values indicate a student-retention dataset with demographic, financial, academic, behavioural and wellbeing variables. Several features of the data, such as the complete absence of any relationship between course type, gender or nationality and dropout, and the near-zero correlation between admission grade and previous qualification grade (r = ${f3(u4.r_adm_prev)}), suggest that the file may be simulated or synthetically generated. The findings should therefore be read as a demonstration of analytical method rather than as claims about any real institution.`));
  c.push(P(`Supporting sources used for context and terminology are listed in the References section (student retention research, scikit-learn and SciPy documentation, and fairness-in-machine-learning literature). **[Add the exact download link or the name of the faculty-provided source here before submission.]**`));
  c.push(H2('1.6 Syllabus Coverage Matrix'));
  c.push(tcap('Syllabus topics and where they are demonstrated'));
  c.push(table(['Unit', 'Required topic', 'Where covered'], [
    ['1', 'EDA goals, process, data types, Python libraries', 'Sections 2.3, 3.1, 3.2'],
    ['1', 'Loading, missing values, duplicates, encoding', 'Sections 3.2, 3.3'],
    ['1', 'Slicing, transformation, grouping', 'Sections 3.4, 3.5'],
    ['1', 'Classical vs Bayesian analysis', 'Section 3.6'],
    ['2', 'Line, scatter, error bar, density, contour, histogram', 'Sections 4.1 to 4.4'],
    ['2', 'Legends, colours, subplots, text and annotation', 'Sections 4.2, 4.5'],
    ['2', '3D plotting', 'Section 4.6'],
    ['2', 'Seaborn, Plotly, Bokeh', 'Sections 4.7, 4.8'],
    ['3', 'Histograms, box plots, density plots', 'Section 5.2'],
    ['3', 'Mean, median, SD, quartiles, skewness, outliers', 'Sections 5.1, 5.3'],
    ['3', 'Bar chart, pie chart, frequency table', 'Section 5.4'],
    ['4', 'Numerical-numerical: scatter, Pearson, Spearman', 'Section 6.1'],
    ['4', 'Categorical-categorical: stacked and grouped bars, chi-square', 'Section 6.2'],
    ['4', 'Numerical-categorical: box and violin plots, tests', 'Section 6.3'],
    ['5', 'Pair plots and heatmaps', 'Sections 7.1, 7.2'],
    ['5', 'Grouped multivariate visualizations', 'Section 7.3'],
    ['5', 'PCA dimensionality reduction (and K-Means)', 'Sections 7.4, 7.5'],
    ['5', 'Insights for machine learning (model, fairness)', 'Sections 7.6, 7.7'],
  ], { widths: [8, 60, 32], left: [1, 2], size: 19 }));

  // ------------------------------------------------------------------ 2 TOOLS
  c.push(H1('2. Tools and Techniques'));
  c.push(H2('2.1 Hardware and Software Requirements'));
  c.push(tcap('Hardware and software requirements'));
  c.push(table(['Component', 'Requirement'], [
    ['Processor', 'Any modern dual-core CPU (Intel Core i3 / AMD Ryzen 3 or higher); no GPU needed'],
    ['RAM', '4 GB minimum, 8 GB recommended'],
    ['Storage', 'Less than 500 MB (dataset is 13 MB; most space is for libraries)'],
    ['Operating system', 'Windows 10/11, Linux or macOS'],
    ['Python', 'Python 3.9 or later with a virtual environment'],
    ['Editor / notebook', 'Visual Studio Code or Jupyter Notebook / JupyterLab'],
    ['Version control', 'Git and GitHub'],
  ], { widths: [28, 72], left: [1] }));
  c.push(H2('2.2 Programming Language and Libraries'));
  c.push(tcap('Libraries and their use in this project'));
  c.push(table(['Category', 'Tool / Library', 'Use in this project'], [
    ['Language', 'Python 3', 'All analysis code'],
    ['Data handling', 'Pandas, NumPy', 'Loading, cleaning, grouping, transformation'],
    ['Static plots', 'Matplotlib, Seaborn', 'Units 2 to 5 figures'],
    ['Interactive plots', 'Plotly, Bokeh', 'Hover-enabled scatter, heatmap and 3D plots (HTML)'],
    ['Statistics', 'SciPy', 'Pearson, Spearman, chi-square, t-test, Mann-Whitney, ANOVA, Kruskal-Wallis, Beta posterior, KDE'],
    ['Machine learning', 'scikit-learn', 'StandardScaler, OneHotEncoder, PCA, KMeans, LogisticRegression, RandomForest, HistGradientBoosting, cross-validation, metrics, permutation importance'],
    ['Model storage', 'joblib', 'Saving the trained pipeline for the live demo'],
  ], { widths: [20, 22, 58], left: [2] }));
  c.push(H2('2.3 EDA Goals, Process and Data Types'));
  c.push(P(`The goals of EDA are to (a) understand the structure of the data, (b) detect errors, missing values and outliers, (c) summarise distributions and relationships, (d) generate hypotheses and (e) choose suitable transformations and models. The process followed in this project is iterative and consists of seven steps: define the question, load the data, inspect and clean, transform and group, visualize, analyse statistically, and communicate.`));
  c.push(P(`Variables are classified by measurement scale. **Nominal** categorical variables are gender, nationality, course_type and study_mode. **Ordinal** is family_income_level (Low < Middle < High). **Binary** variables (0/1) are first_generation, disability_status, scholarship_holder, tuition_up_to_date, part_time_job, international_student, extracurricular_activities, mental_health_support and the target dropout. **Discrete numerical** variables include age, semester, units_enrolled, units_passed, units_failed, missed_deadlines, library_visits_per_month, stress_level (1-10) and satisfaction_score (1-10). **Continuous numerical** variables include the grades, GPA values, attendance and assignment rates, LMS logins, commute time and sleep hours. Knowing the type decides which plots and statistics are valid: bar charts and frequency tables for categories, histograms and box plots for numbers, chi-square for two categories, and correlation only for numeric pairs.`));
  c.push(H2('2.4 Key Techniques Used'));
  c.push(...bullets([
    '**Log transformation (log1p):** compresses long right tails in counts such as missed deadlines, commute time and library visits.',
    '**IQR rule:** a value below Q1 - 1.5 x IQR or above Q3 + 1.5 x IQR is flagged as an outlier.',
    '**Pearson and Spearman correlation:** linear versus rank-based (monotonic) association between numeric pairs.',
    '**Chi-square test and Cramér\'s V:** significance and strength of association between two categorical variables.',
    '**Welch t-test, Mann-Whitney U and Cohen\'s d:** comparing a numeric variable between students who stayed and dropped out, with an effect size.',
    '**ANOVA, Kruskal-Wallis and eta-squared:** comparing a numeric variable across more than two groups.',
    '**Beta-Binomial Bayesian inference:** a posterior distribution for the dropout probability and for differences between groups.',
    '**PCA and K-Means:** dimensionality reduction and unsupervised segmentation on standardised features.',
    '**Stratified train/test split and k-fold cross-validation:** honest evaluation of classification models on an imbalanced target.',
    '**Permutation importance, risk deciles and fairness audit:** explaining the model, measuring its practical value and checking it for group disparities.',
  ]));

  // ------------------------------------------------------------------ 3 EDA
  c.push(H1('3. Exploratory Data Analysis'));
  c.push(H2('3.1 Dataset Description'));
  c.push(P(`Each row of the CSV represents one student, and the columns describe the student's background, finances, study pattern, academic results, engagement and wellbeing. The last column, dropout, is the target. The table below describes all ${u1.cols} columns.`));
  c.push(tcap('Data dictionary'));
  const dd = [
    ['person_id', 'Identifier', 'Unique student ID (1 to 100,000)'],
    ['age', 'Numerical', 'Age in years (15 to 30)'],
    ['gender', 'Categorical', 'Female, Male or Other'],
    ['nationality', 'Categorical', 'Country of origin (15 countries)'],
    ['first_generation', 'Binary', '1 = first in the family to attend university'],
    ['disability_status', 'Binary', '1 = student has a registered disability'],
    ['family_income_level', 'Ordinal', 'Low, Middle or High'],
    ['scholarship_holder', 'Binary', '1 = receives a scholarship'],
    ['tuition_up_to_date', 'Binary', '1 = tuition fees are paid up to date'],
    ['part_time_job', 'Binary', '1 = has a part-time job'],
    ['weekly_work_hours', 'Numerical', 'Hours worked per week (0 to 40)'],
    ['course_type', 'Categorical', 'STEM, Business, Arts & Humanities, Health Sciences, Law & Social Sciences'],
    ['study_mode', 'Categorical', 'Full-time, Part-time or Online'],
    ['semester', 'Numerical', 'Current semester (1 to 8)'],
    ['international_student', 'Binary', '1 = international student'],
    ['admission_grade', 'Numerical', 'Admission grade on a 0-200 scale'],
    ['previous_qualification_grade', 'Numerical', 'Previous qualification grade (0-200)'],
    ['units_enrolled', 'Numerical', 'Course units enrolled in'],
    ['units_passed', 'Numerical', 'Course units passed'],
    ['units_failed', 'Numerical', 'Course units failed'],
    ['gpa_semester_1', 'Numerical', 'GPA of semester 1 (0 to 4)'],
    ['gpa_semester_2', 'Numerical', 'GPA of semester 2 (0 to 4)'],
    ['attendance_rate', 'Numerical', 'Class attendance (%)'],
    ['assignments_submitted_rate', 'Numerical', 'Assignments submitted (%)'],
    ['library_visits_per_month', 'Numerical', 'Library visits per month'],
    ['lms_logins_per_week', 'Numerical', 'Learning-platform logins per week'],
    ['extracurricular_activities', 'Binary', '1 = takes part in extracurricular activities'],
    ['missed_deadlines', 'Numerical', 'Number of missed deadlines'],
    ['stress_level', 'Numerical', 'Self-reported stress (1 to 10)'],
    ['mental_health_support', 'Binary', '1 = uses mental-health support services'],
    ['satisfaction_score', 'Numerical', 'Satisfaction with the programme (1 to 10)'],
    ['commute_time_mins', 'Numerical', 'Commute time in minutes'],
    ['sleep_hours', 'Numerical', 'Average sleep per night (hours)'],
    ['dropout', 'Binary (target)', '1 = student dropped out, 0 = stayed'],
  ];
  c.push(table(['Column', 'Type', 'Meaning'], dd, { widths: [28, 16, 56], left: [2], size: 17 }));

  c.push(H2('3.2 Loading and Initial Inspection'));
  c.push(P(`The file is loaded with Pandas using UTF-8 encoding. The first checks are the shape, the data types, a preview of the rows and the summary statistics.`));
  c.push(...code(`import pandas as pd, numpy as np
df = pd.read_csv("data/student_dropout_risk_2026.csv", encoding="utf-8")
print(df.shape)              # (100000, 34)
print(df.dtypes.value_counts())
print(df.head())
print(df.describe().T)`));
  c.push(P(`The result is ${f0(u1.rows)} rows and ${u1.cols} columns: ${u1.n_int} integer columns, ${u1.n_float} floating-point columns and ${u1.n_str} text columns. The file is pure ASCII/UTF-8 and loads without any encoding error.`));
  c.push(tcap('First five rows (selected columns)'));
  {
    const { headers, rows } = L.csv('u1_head');
    const want = ['person_id', 'age', 'gender', 'family_income_level', 'course_type', 'study_mode', 'units_failed', 'gpa_semester_1', 'gpa_semester_2', 'attendance_rate', 'dropout'];
    const idx = want.map((w) => headers.indexOf(w));
    c.push(table(['ID', 'Age', 'Gender', 'Income', 'Course', 'Mode', 'Failed', 'GPA S1', 'GPA S2', 'Attend.', 'Dropout'],
      rows.slice(0, 5).map((r) => idx.map((i) => r[i])), { widths: [6, 6, 8, 9, 18, 10, 7, 8, 8, 9, 8], size: 16 }));
  }
  c.push(gap());

  c.push(H2('3.3 Missing Values, Duplicates and Encoding'));
  c.push(P(`The table below summarises the data-quality checks. The data are structurally very clean: there are no missing cells, no duplicate rows and no duplicate IDs. The logical rules also hold for every row: units_passed + units_failed equals units_enrolled, GPA values lie between 0 and 4, rates lie between 0 and 100, grades do not exceed 200, and weekly_work_hours is positive exactly when part_time_job is 1.`));
  c.push(tcap('Data-quality checks'));
  c.push(csvTable('u1_quality_checks', { widths: [42, 12, 46], left: [2], fmt: { 1: int }, size: 17 }));
  c.push(...code(`print(df.isna().sum().sum())                       # 0 missing cells
print(df.duplicated().sum(), df.person_id.duplicated().sum())   # 0 0
assert (df.units_passed + df.units_failed == df.units_enrolled).all()
assert df[["gpa_semester_1", "gpa_semester_2"]].between(0, 4).all().all()
print((df.age < 18).sum())                           # 12,758 students under 18`));
  c.push(obs(`The real data-quality issues are not missing cells but plausibility and ceiling effects. ${f0(u1.under18)} students (${pc(u1.under18 / u1.rows)}) are younger than 18; the minimum age is 15. These could be early-entry or dual-enrolment students, so they were flagged and kept rather than deleted. ${f0(u1.att100)} students (${pc(u1.att100 / u1.rows)}) have exactly 100% attendance and ${f0(u1.adm200)} have the maximum admission grade of 200, which shows that the variables are capped at their upper limits (a ceiling effect that will appear as a vertical stripe in scatter plots). ${f0(u1.gpa1_zero)} students have a semester-1 GPA of exactly 0.0 (a floor effect).`));

  c.push(H2('3.4 Dataset Slicing'));
  c.push(P(`Slicing selects the rows and columns relevant to a question. Pandas offers label-based selection (loc), position-based selection (iloc) and boolean masks. The table below shows seven slices with their size and dropout rate.`));
  c.push(...code(`df.loc[:4, ["person_id", "course_type", "gpa_semester_1"]]       # label slice
df.iloc[0:5, 11:15]                                              # positional slice
stem   = df[df["course_type"] == "STEM"]                         # boolean mask
risky  = df[(df.units_failed >= 5) & (df.attendance_rate < 60)]  # combined condition
poor   = df[(df.family_income_level == "Low") & (df.scholarship_holder == 0)]`));
  c.push(tcap('Selected slices of the dataset'));
  c.push(csvTable('u1_slices', { widths: [40, 14, 14, 14, 18], left: [0], fmt: { 1: int }, size: 18 }));
  c.push(obs(`Slicing already reveals the main story. STEM students drop out at about the overall rate (32.1% against 32.0%), so the course does not matter. But students from low-income families without a scholarship drop out 49.1% of the time, students whose tuition is not up to date 44.2%, and the small group (5,131 students) with at least five failed units and attendance below 60% drops out 81.4% of the time.`));

  c.push(H2('3.5 Transformation and Grouping'));
  c.push(P(`${u1.n_derived} derived variables were created without changing the raw columns: pass_rate, gpa_change, avg_gpa, binned versions of age, work hours, GPA, attendance and failed units, an ordinal income code, three log1p transforms, an engagement_index (the mean of the z-scores of attendance, assignment submission, LMS logins and log library visits) and risk_flags (the number of six warning conditions that apply to a student: at least 4 failed units, attendance below 60%, assignments below 50%, at least 4 missed deadlines, semester-2 GPA below 1.5, and unpaid tuition).`));
  c.push(...code(`d["pass_rate"]  = 100 * d.units_passed / d.units_enrolled
d["avg_gpa"]    = (d.gpa_semester_1 + d.gpa_semester_2) / 2
d["log_missed_deadlines"] = np.log1p(d.missed_deadlines)       # log transform
d["income_ord"] = d.family_income_level.map({"Low": 0, "Middle": 1, "High": 2})  # ordinal encoding
d["attendance_band"] = pd.cut(d.attendance_rate, [-.01, 50, 65, 80, 90, 100])   # binning
z  = (d.attendance_rate - d.attendance_rate.mean()) / d.attendance_rate.std()    # z-score
mm = (d.attendance_rate - d.attendance_rate.min()) / (d.attendance_rate.max() - d.attendance_rate.min())
ohe = pd.get_dummies(d[["gender", "nationality", "course_type", "study_mode", "family_income_level"]])  # ${u1.ohe_cols} columns`));
  c.push(P(`**Log transformation.** Three count variables are strongly right-skewed: missed_deadlines (skewness ${f2(u1.skew_missed)}), commute_time_mins (${f2(u1.skew_commute)}) and library_visits_per_month (${f2(u1.skew_library)}). After log1p the skewness falls to ${f2(u1.skew_missed_log)}, ${f2(u1.skew_commute_log)} and ${f2(u1.skew_library_log)}. **Scaling.** Z-score scaling gives mean ${f2(u1.z_mean)} and standard deviation ${f2(u1.z_std)}, and min-max scaling maps attendance to the range ${u1.mm_min} to ${u1.mm_max}. **Encoding.** Family income is encoded as an ordinal variable, and one-hot encoding of the five categorical variables gives ${u1.ohe_cols} indicator columns.`));
  c.push(...fig('u1_log_transform', 'Effect of the log1p transformation on skewed count variables (top: raw, bottom: log1p)', 600, 330));
  c.push(P(`**Grouping.** Grouping with groupby and aggregation summarises dropout, GPA, attendance and failed units for every level of the main categorical variables (table below).`));
  c.push(...code(`d.groupby("family_income_level").agg(students=("dropout", "size"),
        dropout_pct=("dropout", lambda s: 100 * s.mean()),
        gpa_s2=("gpa_semester_2", "mean"), attendance=("attendance_rate", "mean"))
d.pivot_table(index="family_income_level", columns="study_mode", values="dropout", aggfunc="mean")`));
  {
    const rows = [];
    const add = (file, label, order) => {
      const { rows: rr } = L.csv(file);
      const sorted = order ? order.map((o) => rr.find((r) => r[0] === o)) : rr;
      sorted.forEach((r) => rows.push([label, r[0], f0(Number(r[1])), f1(Number(r[2])), f2(Number(r[4])), f1(Number(r[5])), f2(Number(r[6]))]));
    };
    add('u1_group_family_income_level', 'Family income', ['Low', 'Middle', 'High']);
    add('u1_group_study_mode', 'Study mode', null);
    add('u1_group_course_type', 'Course type', null);
    add('u1_group_tuition_up_to_date', 'Tuition up to date (0/1)', null);
    add('u1_group_scholarship_holder', 'Scholarship (0/1)', null);
    c.push(tcap('Group summaries (dropout rate, GPA, attendance, failed units)'));
    c.push(table(['Grouped by', 'Level', 'Students', 'Dropout %', 'Mean GPA S2', 'Attendance %', 'Failed units'], rows, { widths: [20, 18, 12, 12, 12, 13, 13], left: [0, 1], size: 17 }));
  }
  c.push(gap());
  c.push(...fig('u1_group_dropout', 'Dropout rate by group (dashed line = overall 32.0%)', 600, 330));
  c.push(obs(`Family income is the largest categorical gap (Low 42.9%, Middle 30.0%, High 20.0%), followed by unpaid tuition (44.2% against 28.7%). Course type is flat (31.7% to 32.1%). Online students drop out least (29.2%) and part-time students most (33.7%). Holding a scholarship lowers dropout only slightly (31.1% against 33.2%). Income and study mode combine additively: low-income part-time students reach 45.0%, high-income online students only 17.1%.`));

  c.push(H2('3.6 Classical and Bayesian Analysis'));
  c.push(P(`**Classical (frequentist) view.** The observed dropout proportion is p = ${f0(u1.dropouts)} / ${f0(u1.n)} = ${pc(u1.p, 2)}. A normal-approximation 95% confidence interval is ${pc(u1.wald_lo, 2)} to ${pc(u1.wald_hi, 2)}. It is interpreted through repeated sampling: 95% of intervals built this way would contain the true proportion. **Bayesian view.** The unknown dropout probability is given a uniform Beta(1, 1) prior. After observing ${f0(u1.dropouts)} dropouts and ${f0(u1.n - u1.dropouts)} stayers, the posterior is Beta(${f0(u1.dropouts + 1)}, ${f0(u1.n - u1.dropouts + 1)}), with posterior mean ${pc(u1.bayes_mean, 2)} and a 95% credible interval of ${pc(u1.bayes_lo, 2)} to ${pc(u1.bayes_hi, 2)}. This interval has a direct probability interpretation.`));
  c.push(...code(`from scipy.stats import beta
s = df["dropout"].sum(); n = len(df)
posterior = beta(s + 1, (n - s) + 1)            # Beta(32005, 67997)
print(posterior.mean() * 100)                   # 32.00
print(posterior.ppf([0.025, 0.975]) * 100)      # [31.72, 32.29]
# P(dropout rate of group A > group B) by Monte Carlo
da = beta(sa + 1, na - sa + 1).rvs(200000); db = beta(sb + 1, nb - sb + 1).rvs(200000)
print((da > db).mean(), np.percentile(da - db, [2.5, 97.5]))`));
  c.push(tcap('Effect of sample size: classical confidence interval versus Bayesian credible interval'));
  c.push(csvTable('u1_bayes_sample_size', { widths: [12, 10, 14, 22, 16, 26], fmt: { 0: int, 1: int }, size: 17 }));
  c.push(gap());
  c.push(tcap('Bayesian and classical comparison of two groups'));
  c.push(csvTable('u1_bayes_comparisons', { widths: [26, 17, 14, 17, 12, 14], left: [0], size: 16 }));
  c.push(gap());
  c.push(...fig('u1_bayesian', 'Posterior distributions: dropout probability by family income (left) and effect of sample size (right)', 600, 280));
  c.push(obs(`With 100,000 students the classical and Bayesian intervals are practically identical because the data overwhelm the weak prior. The difference shows only in small samples: with 10 students the classical interval is 19% to 81% while the Bayesian credible interval is somewhat narrower (23.4% to 76.6%), because the prior pulls the estimate gently toward 50%. For comparisons, the Bayesian answer is easier to communicate: the probability that low-income students have a higher dropout probability than high-income students is essentially 1.0, with a most plausible difference of about 22.9 percentage points (95% credible interval 22.2 to 23.7). Scholarship holders drop out 2.1 percentage points less (interval 1.5 to 2.7), a real but small effect. Students are not independent draws from one population (they share institutions, courses and years), so both kinds of interval are somewhat too narrow.`));
  return c;
};

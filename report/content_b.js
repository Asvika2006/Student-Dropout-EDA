const L = require('./lib');
const { R, f0, f1, f2, f3, f4, pc, H1, H2, P, bullets, obs, code, fig, table, tcap, gap, csvTable, num, int } = L;
const u1 = R.u1, u2 = R.u2, u3 = R.u3, u4 = R.u4, u5 = R.u5;

module.exports = function partB() {
  const c = [];
  // ------------------------------------------------------------------ 4 MATPLOTLIB
  c.push(H1('4. Visualizing Using Matplotlib'));
  c.push(H2('4.1 Line Plot and Basic Bar Plots'));
  c.push(P(`Matplotlib is the foundation of Python plotting. A figure is created with plt.subplots(), data are drawn on an Axes object, and titles, labels, legends and annotations are added. A line plot is best for ordered data; here the semester (1 to 8) provides the natural order.`));
  c.push(...code(`sem = d.groupby("semester").agg(drop=("dropout", "mean"), g1=("gpa_semester_1", "mean"), g2=("gpa_semester_2", "mean"))
fig, ax = plt.subplots(1, 2, figsize=(11, 4))
ax[0].plot(sem.index, 100 * sem["drop"], marker="o", lw=2, color="#e76f51", label="Dropout %")
ax[0].annotate("Peak: semester 2", (2, 34.2), xytext=(3.2, 34.0), arrowprops=dict(arrowstyle="->"))
ax[1].plot(sem.index, sem.g1, marker="s", label="GPA semester 1")
ax[1].plot(sem.index, sem.g2, marker="^", ls="--", label="GPA semester 2"); ax[1].legend()`));
  c.push(...fig('u2_line_semester', 'Line plots: dropout rate by semester (left) and mean GPA by semester (right)', 600, 300));
  c.push(obs(`The dropout rate peaks in semester 2 (${f1(u2.peak_rate)}%) and then declines slowly to its lowest value in semester ${u2.min_sem} (${f1(u2.min_rate)}%), which suggests that early semesters are the riskiest and that students who survive them are more likely to continue. The GPA lines are almost flat across semesters, but semester-2 GPA (mean ${f2(u2.gpa2_mean)}) is far below semester-1 GPA (mean ${f2(u2.gpa1_mean)}): semester-2 GPA is lower for 90.4% of students, by 0.59 grade points on average. The first-year transition therefore appears to be a systematic difficulty for students.`));
  c.push(...code(`g = (d.groupby("family_income_level").dropout.mean() * 100).reindex(["Low", "Middle", "High"])
ax.bar(g.index, g.values, color=["#e76f51", "#e9c46a", "#2a9d8f"]); ax.bar_label(ax.containers[0], fmt="%.1f%%")
ax.barh(study_mode_rates.index, study_mode_rates.values)      # horizontal bar`));
  c.push(...fig('u2_bar_basic', 'Basic bar plots: dropout rate by family income and by study mode', 560, 280));
  c.push(H2('4.2 Scatter Plot with Legends, Colours and Annotation'));
  c.push(P(`A scatter plot shows the relationship between two numeric variables. Colours encode the outcome (green = stayed, orange = dropped out), a legend explains the colours, and ax.annotate() adds text with an arrow to point out zones of interest. A random sample of 3,000 students keeps the plot readable.`));
  c.push(...code(`smp = d.sample(3000, random_state=42)
for k, colr in [(0, "#2a9d8f"), (1, "#e76f51")]:
    s = smp[smp.dropout == k]
    ax.scatter(s.attendance_rate, s.gpa_semester_2, s=14, alpha=.55, color=colr, label=["Stayed", "Dropped out"][k])
ax.annotate("High-risk zone:\\nlow attendance + low GPA", xy=(52, .6), xytext=(4, 3.1), arrowprops=dict(arrowstyle="->"))
ax.legend(title="Outcome")`));
  c.push(...fig('u2_scatter', 'Scatter plot of attendance versus semester-2 GPA with legend, colours and annotations', 520, 380));
  c.push(obs(`The relationship is positive but diffuse (r = ${f3(u4.r_att_gpa2)}): attendance alone explains only ${f1(100 * u4.r2_att_gpa2)}% of the variation in GPA. Dropouts (orange) concentrate in the lower half of the plot, where GPA is below about 2.0, but they appear at every attendance level. The vertical stripe at 100% attendance is the ceiling effect noted in Section 3.3. The plot shows that GPA separates the outcomes better than attendance does.`));
  c.push(H2('4.3 Histogram, Density Plot and Contour Plot'));
  c.push(P(`A histogram counts how many students fall into each value range, a density plot (kernel density estimate, KDE) draws a smooth version of the same distribution, and a contour plot extends the density idea to two variables by drawing lines of equal joint density.`));
  c.push(...code(`ax[0].hist(d[d.dropout == k].gpa_semester_2, bins=35, alpha=.6)           # histogram
sns.kdeplot(d[d.dropout == k].attendance_rate, fill=True, clip=(0, 100))  # density
kde = gaussian_kde(np.vstack([x, y]))                                      # joint density
zz = kde(np.vstack([xx.ravel(), yy.ravel()])).reshape(xx.shape)
plt.contourf(xx, yy, zz, levels=14, cmap="viridis"); plt.colorbar(label="Density")`));
  c.push(...fig('u2_hist_density', 'Histogram and density plots split by outcome', 620, 220));
  c.push(...fig('u2_contour', 'Filled contour plot of the joint density (left) and contour lines by outcome (right)', 560, 260));
  c.push(obs(`Semester-2 GPA is almost bell-shaped (skewness ${f2(u3.gpa2_skew)}); dropouts are shifted to the left by about 0.8 grade points (medians 1.44 against 2.24). Attendance is bunched against the 100% ceiling for both groups, with a longer left tail for dropouts. In the contour plot the densest region for students who stayed sits at attendance of about 80-100% and GPA of about 2.3, while for dropouts it sits at a lower GPA of about 1.4. The two sets of contours overlap heavily, which explains why no single variable separates the groups perfectly.`));
  c.push(H2('4.4 Error Bars'));
  c.push(P(`Error bars show the uncertainty of an estimate. Here a 95% confidence interval is drawn around the dropout rate of each course type (a proportion) and around the mean semester-2 GPA of each income group (a mean).`));
  c.push(...code(`p = s.mean(); se = np.sqrt(p * (1 - p) / len(s))
ax.errorbar(range(5), rates, yerr=1.96 * ses, fmt="o", capsize=5)     # proportion CI
ax.errorbar(["Low", "Middle", "High"], means, yerr=1.96 * sem, fmt="s", capsize=5)  # mean CI`));
  c.push(...fig('u2_errorbars', 'Error bars: dropout rate by course type (left) and mean GPA by family income (right), 95% CI', 580, 280));
  c.push(obs(`The five course types have dropout rates between ${f1(u2.course_min)}% and ${f1(u2.course_max)}% and their error bars overlap completely, so the course is not a risk factor. In contrast, the mean semester-2 GPA rises clearly with family income (Low ${f2(u2.gpa2_low)}, Middle ${f2(u2.gpa2_mid)}, High ${f2(u2.gpa2_high)}) and the intervals are so narrow (n = 100,000) that they are barely visible.`));
  c.push(H2('4.5 Subplots'));
  c.push(P(`Subplots place several related views in one figure so that they can be compared directly. The figure below combines a bar chart, a line plot, a scatter plot and a histogram.`));
  c.push(...code(`fig, axs = plt.subplots(2, 2, figsize=(11, 7.5))
axs[0, 0].bar(att_band.index.astype(str), att_band.values)            # bar
axs[0, 1].plot(sem.index, sem.fail, marker="o")                        # line
axs[1, 0].scatter(smp.assignments_submitted_rate, smp.attendance_rate, s=8, alpha=.35)  # scatter
axs[1, 1].hist(d.units_failed, bins=range(0, 18))                      # histogram
fig.suptitle("Subplots: four views in one figure")`));
  c.push(...fig('u2_subplots', 'Subplot grid with bar, line, scatter and histogram', 520, 400));
  c.push(obs(`The bar chart shows that dropout falls steadily as attendance rises (59.2% below 50% attendance, 44.7%, 32.8%, 24.4% and 16.1% for 90-100%). Mean failed units are almost constant across semesters, and the number of failed units is right-skewed with most students failing 0 to 4 units. The scatter of assignments against attendance shows a weak positive relationship.`));
  c.push(H2('4.6 Three-Dimensional Plotting'));
  c.push(P(`A 3D scatter plot (mpl_toolkits.mplot3d) displays three numeric variables at once, and a 3D surface shows how a computed quantity, here the dropout rate, changes over two variables.`));
  c.push(...code(`fig = plt.figure(figsize=(8, 6)); ax = fig.add_subplot(111, projection="3d")
ax.scatter(s.attendance_rate, s.gpa_semester_2, s.units_failed, c=s.dropout.map(colors), s=9)
ax.set_xlabel("Attendance %"); ax.set_ylabel("GPA sem 2"); ax.set_zlabel("Units failed")
ax.plot_surface(X, Y, dropout_pct_grid, cmap="RdYlGn_r")             # surface of dropout %`));
  c.push(...fig('u2_3d', '3D scatter of attendance, semester-2 GPA and failed units', 440, 340));
  c.push(...fig('u2_3d_surface', '3D surface of the dropout rate over attendance and GPA', 440, 340));
  c.push(obs(`In the 3D scatter the dropouts (orange) rise toward the upper part of the failed-units axis and the low-GPA side, forming a separate cloud from the students who stayed. The surface makes the interaction visible: the dropout rate is highest (above 90%) in the corner of very low attendance and very low GPA, falls smoothly toward the opposite corner, and is lowest (about 1.5%) where attendance is high and GPA is above 3.0.`));
  c.push(H2('4.7 Seaborn'));
  c.push(P(`Seaborn is a statistical visualization library built on Matplotlib. It produces attractive defaults and high-level plots such as histplot with a KDE overlay, regplot with a fitted regression line and confidence band, countplot, boxplot, violinplot, pairplot and heatmap, many of which are used throughout this report.`));
  c.push(...code(`import seaborn as sns
sns.set_theme(style="whitegrid")
sns.histplot(data=d, x="gpa_semester_1", hue="dropout_label", kde=True)
sns.regplot(data=smp, x="attendance_rate", y="gpa_semester_2")
sns.countplot(data=d, x="study_mode", hue="dropout_label")`));
  c.push(...fig('u2_seaborn', 'Seaborn histplot with KDE, regplot with confidence band and countplot', 620, 230));
  c.push(obs(`The Seaborn histogram shows two overlapping bell-shaped GPA distributions whose peaks are about one grade point apart. The regression line is shallow (slope ${f4(u4.slope_att_gpa2)} GPA points per percentage point of attendance), which confirms the weak attendance-GPA link. The countplot shows that the majority of students in every study mode stay, but the share dropping out is slightly higher for part-time students.`));
  c.push(H2('4.8 Plotly and Bokeh (Interactive Visualization)'));
  c.push(P(`Plotly and Bokeh create interactive HTML graphics with hover tooltips, zooming and panning. The interactive files are saved in the interactive/ folder of the repository and can be opened in any browser. A random sample of 2,500 students is used so that the pages stay fast, and the tooltip shows the student ID, course, income level, study mode, failed units and missed deadlines.`));
  c.push(...code(`import plotly.express as px
fig = px.scatter(s, x="attendance_rate", y="gpa_semester_2", color="dropout_label",
                 hover_data=["person_id", "course_type", "family_income_level", "units_failed"])
fig.write_html("interactive/plotly_attendance_vs_gpa.html")

from bokeh.plotting import figure, output_file, save
from bokeh.models import HoverTool, ColumnDataSource
src = ColumnDataSource(dict(x=s.attendance_rate, y=s.gpa_semester_2, color=s.dropout.map(PAL), pid=s.person_id))
p = figure(title="Attendance vs GPA", tools="pan,wheel_zoom,box_zoom,reset,save")
p.scatter("x", "y", source=src, size=6, color="color")
p.add_tools(HoverTool(tooltips=[("Student", "@pid"), ("Attendance", "@x{0.0}%"), ("GPA S2", "@y{0.00}")]))
output_file("interactive/bokeh_attendance_vs_gpa.html"); save(p)`));
  c.push(obs(`Plotly produces a colour-coded scatter plot, a dropout-rate heatmap by income and course type, and a rotatable 3D scatter; Bokeh produces a hover-enabled scatter plot. Interactivity is valuable here because thousands of students overlap in the middle of the plot, and the user can zoom in and hover over a point to identify the student. A dependency-free HTML version (offline_interactive_scatter.html) is also provided so that the demonstration works even without Plotly or Bokeh installed. **[Paste screenshots of the Plotly and Bokeh HTML outputs below this paragraph if the faculty requires static evidence.]**`));

  // ------------------------------------------------------------------ 5 UNIVARIATE
  c.push(H1('5. Univariate Analysis'));
  c.push(H2('5.1 Summary Statistics of the Numerical Variables'));
  c.push(P(`Univariate analysis studies one variable at a time. For numerical variables the key measures are the mean and median (central tendency), the standard deviation and variance (spread), the quartiles and IQR (robust spread), and skewness and kurtosis (shape).`));
  c.push(...code(`s = df["gpa_semester_2"]
print(s.describe())
print("Skewness:", s.skew(), " Kurtosis:", s.kurt())
q1, q3 = s.quantile([0.25, 0.75]); iqr = q3 - q1
print("Fences:", q1 - 1.5 * iqr, q3 + 1.5 * iqr)`));
  {
    const { rows } = L.csv('u3_summary_gpa2');
    const g = (k) => Number(rows.find((r) => r[0] === k)[1]);
    const t = [
      ['Count', f0(g('count')), 'Minimum', f2(g('min'))],
      ['Mean', f3(g('mean')), 'Q1 (25%)', f2(g('Q1'))],
      ['Median', f3(g('median')), 'Q3 (75%)', f2(g('Q3'))],
      ['Mode', f2(g('mode')), 'IQR', f2(g('IQR'))],
      ['Standard deviation', f3(g('std')), 'Maximum', f2(g('max'))],
      ['Variance', f3(g('variance')), 'Skewness', f3(g('skewness'))],
      ['Coefficient of variation', f1(g('CV %')) + '%', 'Kurtosis (excess)', f3(g('kurtosis'))],
    ];
    c.push(tcap('Descriptive statistics of gpa_semester_2'));
    c.push(table(['Statistic', 'Value', 'Statistic', 'Value'], t, { widths: [28, 22, 28, 22], size: 19 }));
  }
  c.push(P(`Mean (${f3(u3.gpa2_mean)}) and median (${f3(u3.gpa2_median)}) are almost identical and skewness is close to zero, so semester-2 GPA is approximately symmetric and the mean and standard deviation are appropriate summaries. The slightly negative excess kurtosis (${f2(u3.gpa2_kurt)}) means that the tails are slightly lighter than a normal distribution, which is expected for a variable bounded between 0 and 4.`, { after: 100 }));
  c.push(tcap('Descriptive statistics of all 19 numeric variables'));
  c.push(csvTable('u3_summary_all', { cols: [0, 2, 3, 5, 7, 8, 9, 11, 13], rename: ['Variable', 'Mean', 'Median', 'Std', 'Min', 'Q1', 'Q3', 'Max', 'Skew'],
    widths: [30, 9, 9, 9, 8, 8, 8, 9, 9], fmt: { 2: num(2), 3: num(2), 5: num(2), 7: num(1), 8: num(2), 9: num(2), 11: num(1), 13: num(2) }, size: 16, left: [0] }));
  c.push(obs(`Only three variables are strongly skewed (skewness above 1): missed_deadlines (${f2(u3.most_skewed_val)}), library_visits_per_month (1.68) and commute_time_mins (1.65). Their means are well above their medians (for example commute 23.3 against 16.0 minutes, weekly work hours 8.7 against 0), so the median describes a typical student better than the mean for these variables. All other variables, including both GPAs, attendance and grades, are roughly symmetric.`));

  c.push(H2('5.2 Histogram, Box Plot and Density Plot'));
  c.push(P(`Histograms with a KDE curve, box plots and Q-Q plots were drawn for all 19 numeric variables. Dashed red lines mark the mean and green lines mark the median.`));
  c.push(...code(`sns.histplot(d[c], bins=30, kde=True)                 # histogram + density
sns.boxplot(x=d[c])                                   # box plot
stats.probplot(d[c].sample(5000), dist="norm", plot=ax)   # Q-Q plot`));
  c.push(...fig('u3_histograms_all', 'Histograms with density curves of all numeric variables (red dashed = mean, green = median)', 560, 600));
  c.push(...fig('u3_key_variables', 'Histogram, box plot and density plot for GPA, attendance and missed deadlines', 520, 380));
  c.push(...fig('u3_qq', 'Q-Q plots against the normal distribution', 600, 170));
  c.push(obs(`GPA, grades, stress, satisfaction and sleep follow a bell shape and their Q-Q points lie close to the diagonal. Attendance and assignment submission are piled up at 100% (the ceiling effect) and have a longer left tail. Missed deadlines and commute time are right-skewed with many students at 0, and their Q-Q plots curve strongly upward, confirming departure from normality. Because of this, the non-parametric tests of Unit 4 are used alongside parametric ones.`));
  c.push(...fig('u3_boxplots_all', 'Box plots of all numeric variables', 560, 440));

  c.push(H2('5.3 Skewness and Outlier Detection'));
  c.push(P(`Outliers were detected with the IQR rule: values below Q1 - 1.5 x IQR or above Q3 + 1.5 x IQR are flagged.`));
  c.push(...code(`q1, q3 = s.quantile([.25, .75]); iqr = q3 - q1
lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
n_out = ((s < lo) | (s > hi)).sum()`));
  c.push(tcap('Skewness and IQR outliers for every numeric variable'));
  c.push(csvTable('u3_outliers', { widths: [27, 10, 21, 10, 10, 8, 8, 10], left: [0, 2], fmt: { 5: int, 6: int }, size: 15 }));
  c.push(gap());
  c.push(...fig('u3_outliers_skew', 'Share of IQR outliers (left) and skewness (right) per variable', 560, 220));
  c.push(obs(`${u3.n_vars_with_outliers} of the 19 variables contain IQR outliers, but the proportions are small: the largest is ${u3.top_outlier_var} with ${f1(u3.top_outlier_pct)}% of students above the fence of 7.5, followed by commute time (4.9%) and library visits (3.8%). Bounded variables behave differently: for attendance and assignment submission the lower fence flags a few hundred students (about 0.3%) with very low values and no values are flagged on the upper side. These outliers are not errors. A student who missed 15 deadlines or commutes for two hours is real, and for a dropout study such students are exactly the ones of interest, so none were removed. Winsorising missed_deadlines at its 99th percentile (${f0(u3.missed_p99)}) would change its mean only from ${f2(u3.missed_mean_raw)} to ${f2(u3.missed_mean_wins)}, so the influence of the outliers on summary statistics is small. Log transformation (Section 3.5) is used where a symmetric scale is needed.`));

  c.push(H2('5.4 Single Categorical Variable: Bar Chart, Pie Chart and Frequency Table'));
  c.push(P(`For a categorical variable the frequency table counts the occurrences of every category, the bar chart compares those counts accurately, and the pie chart shows each category's share of a whole.`));
  c.push(...code(`freq = df["course_type"].value_counts()
rel  = df["course_type"].value_counts(normalize=True) * 100
plt.bar(freq.index, freq.values)
plt.pie(freq, labels=freq.index, autopct="%1.1f%%")`));
  {
    const rows = [];
    const add = (file, label, order) => {
      const { rows: rr } = L.csv(file);
      const sorted = order ? order.map((o) => rr.find((r) => r[0] === o)) : rr;
      sorted.forEach((r) => rows.push([label, r[0], f0(Number(r[1])), f2(Number(r[2])), f2(Number(r[3]))]));
    };
    add('u3_freq_course_type', 'Course type');
    add('u3_freq_study_mode', 'Study mode');
    add('u3_freq_family_income_level', 'Family income', ['Low', 'Middle', 'High']);
    add('u3_freq_gender', 'Gender');
    add('u3_freq_dropout_label', 'Dropout (target)');
    c.push(tcap('Frequency tables of the main categorical variables'));
    c.push(table(['Variable', 'Category', 'Count', 'Percent', 'Cumulative %'], rows, { widths: [22, 26, 16, 16, 20], left: [0, 1], size: 17 }));
  }
  c.push(gap());
  c.push(tcap('Frequency table of nationality'));
  c.push(csvTable('u3_freq_nationality', { rename: ['Nationality', 'Count', 'Percent', 'Cumulative %'], widths: [34, 22, 22, 22], fmt: { 1: int }, size: 17 }));
  c.push(gap());
  c.push(...fig('u3_categorical', 'Bar charts (top) and pie charts (bottom) of the categorical variables', 620, 380));
  c.push(...fig('u3_binary_bars', 'Bar charts of binary and small-category variables', 600, 180));
  c.push(obs(`Nationality is concentrated: the USA alone supplies ${f1(u3.top_nat_pct)}% of students and the top three countries (USA, India, China) ${f1(u3.nat_top3)}%. Course types are fairly balanced (STEM ${f1(u3.stem_pct)}% to Law and Social Sciences 11.9%), study mode is dominated by full-time students (${f1(u3.fulltime_pct)}%), and gender is almost evenly split (Female ${f1(u3.female_pct)}%, Male 47.2%, Other ${f1(u3.other_pct)}%). ${f1(u3.low_inc_pct)}% of students come from low-income families, ${f1(u3.sch_pct)}% hold a scholarship, ${f1(100 - u3.tuition_pct)}% have unpaid tuition, ${f1(u3.firstgen_pct)}% are first-generation and ${f1(u3.disab_pct)}% have a registered disability. The target is moderately imbalanced (68.0% stayed, 32.0% dropped out), so accuracy alone will be a misleading metric and the model section also reports precision, recall, F1 and ROC-AUC. The pie chart of the target is easy to read because it has only two slices, whereas the bar chart is better than a pie for the 15 nationalities, whose small slices would be unreadable.`));
  return c;
};

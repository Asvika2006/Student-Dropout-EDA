// Builds Student_Dropout_EDA_Report.docx.  Usage: node report/build_report.js
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { D, R, W, FONT, NAVY, BLUE, f0, f1, f2, f3, pc, H1, H2, P, bullets, obs, table, tcap, gap } = L;
const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, TabStopType, LeaderType, BorderStyle, LevelFormat, PageBreak } = D;
const u1 = R.u1, u4 = R.u4, u5 = R.u5;

function partD() {
  const c = [];
  c.push(H1('8. Major Findings and Insights'));
  c.push(...bullets([
    `**A clean but behaviour-rich dataset:** ${f0(u1.rows)} students, no missing values or duplicates; the only quality issues are ceiling effects (${pc(u1.att100 / u1.rows)} of students at 100% attendance) and ${f0(u1.under18)} students under 18, which were flagged and kept.`,
    `**One in three students drops out:** ${pc(u1.p, 2)} (95% interval ${pc(u1.wald_lo, 2)} to ${pc(u1.wald_hi, 2)}), highest in semesters 1-2 (about 34%) and lowest in semester 7 (29.6%).`,
    `**Academic performance is the dominant signal:** semester-1 GPA (r = ${f3(u4.top_neg_r)}), semester-2 GPA (r = ${f3(u4.top_neg2_r)}) and failed units (r = +${f3(u4.top_pos_r)}) have large effect sizes (|d| = 1.1 to 1.5); dropouts average ${f2(u4.mean_gpa2_drop)} against ${f2(u4.mean_gpa2_stay)} GPA in semester 2.`,
    `**Money and work matter:** dropout is 42.9% for low-income, 30.0% for middle-income and 20.0% for high-income students; 44.2% when tuition is unpaid against 28.7% when it is paid; 39.8% with a part-time job against 24.7% without.`,
    `**Many assumed factors do not matter:** course type, gender, nationality, age, international status and commute time show no relationship with dropout (Cramér's V or |r| below 0.01). Scholarships help only slightly (31.1% against 33.2%).`,
    `**Risk compounds:** from ${f1(u5.risk_hi_hi)}% (high attendance, GPA above 3.0) to ${f1(u5.risk_low_low)}% (attendance below 50%, GPA below 1.5); dropout rises from ${f1(u5.flag0)}% with no risk flags to ${f1(u5.flag_max)}% with six.`,
    `**Four student segments** (K-Means) range from ${f1(u5.cl_lo)}% to ${f1(u5.cl_hi)}% dropout and call for different interventions (tutoring versus engagement support).`,
    `**Prediction works and a simple model is enough:** logistic regression reaches AUC ${f3(u5.m_logistic_auc)} and accuracy ${pc(u5.m_logistic_acc)} (baseline ${f1(u5.base_acc)}%), stable under 5-fold cross-validation; the top 20% highest-risk students contain ${pc(u5.cap20)} of all dropouts.`,
    `**Fairness needs attention:** equal accuracy across gender, origin and disability, but recall of ${f1(u5.inc_rec_low)}% for low-income against ${f1(u5.inc_rec_high)}% for high-income students.`,
  ]));
  c.push(H2('8.1 Recommendations'));
  c.push(...bullets([
    'Use GPA, failed units, attendance and assignment submission as the core of any early-warning dashboard, and trigger a review as soon as semester-1 results are known.',
    'Offer financial counselling and flexible payment plans, because unpaid tuition and low income are the strongest non-academic risk factors; support working students with flexible timetables.',
    'Use different interventions for different segments: academic tutoring for students who fail units, engagement coaching for students with good grades but low attendance and submission.',
    'Use a lower decision threshold (about 0.3) so that most at-risk students are reached, and size the programme to the capacity of advisers using the risk-decile table.',
    'Always report effect sizes with p-values when the sample is large, and report medians for skewed variables.',
    'Do not spend resources on course type, gender or nationality as risk indicators; they carry no signal in this dataset.',
  ]));
  c.push(H2('8.2 Ethical and Societal Considerations'));
  c.push(P(`Predicting which students may leave is useful only if it leads to support. The following points were considered in the design of this project and should be considered by anyone who deploys such a model.`));
  c.push(...bullets([
    '**Purpose and human oversight.** Predictions should open a supportive conversation, never trigger penalties, loss of scholarships or exclusion. A risk score is a probability, not a verdict: even in the highest-risk decile about 6% of students stay, and in the lowest decile about 1% leave. A human adviser must make the final decision.',
    '**Privacy and data protection.** The dataset contains sensitive personal information (disability, income, mental-health support, nationality). Real deployments need informed consent, data minimisation, access control, anonymised IDs and compliance with local data-protection law. This project uses only an ID and never any name or contact detail.',
    '**Fairness.** The audit in Section 7.7 shows that the model flags low-income students far more often and catches fewer high-income dropouts. Sensitive attributes that carry no signal (gender, nationality, international status) can be dropped at almost no cost and should be; disparities that remain should be monitored by group, and thresholds can be tuned per programme. The model should not be used to deny opportunities to any group.',
    '**Avoiding stigma and self-fulfilling prophecies.** Telling a student or staff member that a student is "high risk" can lower expectations and increase the very outcome it predicts. Risk labels should be confidential and framed as "may benefit from support".',
    '**Correlation is not causation.** Low GPA predicts dropout, but this analysis cannot show that raising GPA would prevent it, or that low income causes dropout. Interventions should be evaluated with controlled trials.',
    '**Data provenance and generalisation.** The file has no stated source and shows signs of being simulated. A model trained on it must never be applied to real students without validation on real, local data.',
    '**Societal benefit.** Used responsibly, early-warning analytics can direct limited advising and financial-aid resources to students who need them most and reduce inequality in completion rates.',
  ]));

  c.push(H1('9. Results and Conclusion'));
  c.push(H2('9.1 Results Summary'));
  c.push(P(`The project completed a full exploratory workflow on ${f0(u1.rows)} students. Data loading, quality checks, slicing, transformation, grouping and Bayesian estimation (Unit 1) showed that the data are clean, that dropout is ${pc(u1.p)}, and that the log transform fixes the three skewed count variables. Matplotlib, Seaborn, Plotly and Bokeh visualizations (Unit 2) revealed the first-year peak in dropout, the weak role of attendance alone and the strong role of GPA, and the 3D surface showed how risk changes over two variables. Univariate analysis (Unit 3) described all variables, found outliers that are genuine behaviour, and showed a moderately imbalanced target. Bivariate analysis (Unit 4) ranked the factors by effect size and showed that income, finances and work matter while demographics do not. Multivariate analysis (Unit 5) showed compounding risk, limited redundancy among variables, four interpretable segments, and a well-calibrated logistic regression model (AUC ${f3(u5.m_logistic_auc)}), together with a fairness audit.`));
  c.push(H2('9.2 Conclusion'));
  c.push(P(`This capstone demonstrates a complete, reproducible pipeline from raw CSV loading through data-quality checks, transformation, visualization, statistical testing, dimensionality reduction, clustering, machine-learning evaluation and a fairness audit. All topics from the five units of Data Exploration and Visualization are represented with Python code, outputs and written observations. The most important lessons are methodological: with very large samples, effect sizes matter more than p-values; a simple model can match complex ones when the signal is additive; the accuracy of a model on an imbalanced target must be compared with a baseline; and a good model still has to be checked for fairness before it is used on real people.`));
  c.push(H2('9.3 Limitations'));
  c.push(...bullets([
    'The dataset has no stated source or collection date and appears to be simulated, so findings describe the data, not necessarily real institutions.',
    'The data are a single snapshot; there are no time-stamped records, so the order of events (for example when engagement dropped relative to leaving) is unknown, and no causal claims can be made.',
    'Semester-1 and semester-2 results may be partly consequences of the decision to leave, so the model is better described as identifying students who are dropping out than as forecasting from the start of the programme.',
    'Variables are capped at their limits (attendance at 100%), which distorts distributions slightly.',
    'The fairness audit uses one threshold and a handful of groups; intersectional groups were not examined.',
    'The Plotly and Bokeh outputs require those libraries to be installed; the repository includes a dependency-free HTML fallback.',
  ]));
  c.push(H1('10. Future Scope'));
  c.push(...bullets([
    'Use longitudinal data (week-by-week attendance and LMS activity) to build a true early-warning model and measure how early dropout can be predicted.',
    'Use survival analysis (Kaplan-Meier, Cox regression) to model the time to dropout by semester.',
    'Add calibration, cost-sensitive learning and per-group threshold tuning; explore SHAP values for explanations of individual predictions.',
    'Evaluate intersectional fairness (for example income by gender) and fairness constraints such as equalised odds.',
    'Build an interactive Streamlit or Dash dashboard from the Plotly and Bokeh components, with a risk calculator for advisers.',
    'Validate on real institutional data and run a controlled study of interventions guided by the model.',
    'Apply formal hierarchical Bayesian models to estimate dropout rates per programme and semester with uncertainty.',
  ]));
  c.push(H1('References'));
  const refs = [
    '[1] J. W. Tukey, Exploratory Data Analysis, Addison-Wesley, 1977.',
    '[2] W. McKinney, Python for Data Analysis, 3rd ed., O\'Reilly Media, 2022.',
    '[3] J. VanderPlas, Python Data Science Handbook, O\'Reilly Media, 2016.',
    '[4] J. D. Hunter, "Matplotlib: A 2D Graphics Environment," Computing in Science & Engineering, vol. 9, no. 3, 2007.',
    '[5] M. Waskom, "seaborn: statistical data visualization," Journal of Open Source Software, vol. 6, no. 60, 2021.',
    '[6] F. Pedregosa et al., "Scikit-learn: Machine Learning in Python," Journal of Machine Learning Research, vol. 12, 2011.',
    '[7] P. Virtanen et al., "SciPy 1.0: fundamental algorithms for scientific computing in Python," Nature Methods, vol. 17, 2020.',
    '[8] J. Cohen, Statistical Power Analysis for the Behavioral Sciences, 2nd ed., Lawrence Erlbaum Associates, 1988.',
    '[9] V. Tinto, "Dropout from Higher Education: A Theoretical Synthesis of Recent Research," Review of Educational Research, vol. 45, no. 1, 1975.',
    '[10] M. Hardt, E. Price and N. Srebro, "Equality of Opportunity in Supervised Learning," Advances in Neural Information Processing Systems 29, 2016.',
    '[11] Plotly Technologies Inc., Plotly Python documentation, https://plotly.com/python/',
    '[12] Bokeh Project, Bokeh documentation, https://docs.bokeh.org/',
    'GITHUB REPO LINK: [paste your repository link here]',
  ];
  refs.forEach((r) => c.push(new Paragraph({ children: L.runs(r, { size: 21 }), spacing: { after: 70 }, indent: { left: 360, hanging: 360 } })));
  return c;
}

// ------------------------------------------------------------------ assemble
const body = [...require('./content_a')(), ...require('./content_b')(), ...require('./content_c')(), ...partD()];

let pages = {};
const pf = path.join(__dirname, 'pages.json');
if (fs.existsSync(pf)) pages = JSON.parse(fs.readFileSync(pf, 'utf8'));

const ctr = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 120, before: o.before ?? 0 },
  children: [new TextRun({ text: t, font: FONT, size: o.size || 24, bold: o.bold, italics: o.italics, color: o.color })] });

const cover = [
  ctr('Exploratory Data Analysis and Visualization of Student Dropout Risk', { size: 32, bold: true, after: 300, before: 200 }),
  ctr('A MINI PROJECT REPORT', { size: 26, bold: true, after: 60 }),
  ctr('Data Exploration and Visualization – 24UAD512', { size: 26, bold: true, after: 300 }),
  ctr('Submitted by', { italics: true, after: 160 }),
  ctr('[REGISTER NO. 1] – [STUDENT NAME 1]', { bold: true, after: 20 }),
  ctr('[REGISTER NO. 2] – [STUDENT NAME 2]', { bold: true, after: 20 }),
  ctr('[REGISTER NO. 3] – [STUDENT NAME 3]', { bold: true, after: 20 }),
  ctr('[REGISTER NO. 4] – [STUDENT NAME 4]', { bold: true, after: 300 }),
  ctr('in partial fulfillment for the award of the degree', { italics: true, after: 120 }),
  ctr('of', { after: 120 }),
  ctr('BACHELOR OF TECHNOLOGY', { bold: true, size: 28, after: 120 }),
  ctr('in', { after: 120 }),
  ctr('ARTIFICIAL INTELLIGENCE AND DATA SCIENCE', { bold: true, size: 28, after: 240 }),
  ctr('KGiSL INSTITUTE OF TECHNOLOGY', { bold: true, size: 30, after: 160 }),
  ctr('[Insert college logo here]', { italics: true, color: '888888', size: 20, after: 240 }),
  ctr('ANNA UNIVERSITY: CHENNAI 600 025', { bold: true, size: 28, after: 240 }),
  ctr('Evaluation Rubrics', { bold: true, size: 24, after: 100 }),
  table(['S.No', 'Criteria', 'Total marks', 'Marks Awarded'], [
    ['1.', 'Content & Technical Depth', '10', ''], ['2.', 'Methodology & Implementation', '10', ''],
    ['3.', 'Analysis, Results, & Discussion', '5', ''], ['4.', 'Innovation & Creativity', '5', ''],
    ['5.', 'Ethical & Societal Impact', '5', ''], ['6.', 'Documentation & Presentation', '5', ''], ['', 'Total', '40', ''],
  ], { widths: [10, 50, 18, 22], left: [1], size: 20, centerFirst: true }),
];

const toc = [
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'TABLE OF CONTENTS', bold: true, size: 30, font: FONT, color: NAVY })] }),
  ...L.HEADINGS.map((h) => new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: W, leader: LeaderType.DOT }],
    spacing: { after: h.level === 1 ? 70 : 30, before: h.level === 1 ? 90 : 0 },
    indent: { left: h.level === 1 ? 0 : 400 },
    children: [new TextRun({ text: h.text + '\t' + (pages[h.text] || '0'), font: FONT, size: h.level === 1 ? 22 : 21, bold: h.level === 1 })],
  })),
  new Paragraph({ children: [new PageBreak()] }),
];

const hdrFtr = {
  headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999', space: 2 } },
    children: [new TextRun({ text: 'Data Exploration and Visualization – Capstone Project', font: FONT, size: 18, color: '555555' })] })] }),
    first: new Header({ children: [new Paragraph({ children: [] })] }) },
  footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: 'KGiSL Institute of Technology   |   Page ', font: FONT, size: 18, color: '555555' }),
    new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '555555' })] })] }),
    first: new Footer({ children: [new Paragraph({ children: [] })] }) },
};

const doc = new Document({
  creator: 'Student Dropout EDA Project', title: 'EDA and Visualization of Student Dropout Risk',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: NAVY }, paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: BLUE }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1250, bottom: 1134, left: 1134, right: 1134 } } },
    ...hdrFtr,
    children: [...cover, ...toc, ...body],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, 'Student_Dropout_EDA_Report.docx');
  fs.writeFileSync(out, buf);
  fs.writeFileSync(path.join(__dirname, 'headings.json'), JSON.stringify(L.HEADINGS));
  console.log('written', out, (buf.length / 1e6).toFixed(1) + ' MB');
});

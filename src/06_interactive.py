"""UNIT 2 (continued) - Interactive visualization with Plotly and Bokeh.

Creates hover-enabled HTML files in /interactive. If Plotly or Bokeh is not installed
(pip install plotly bokeh), that part is skipped with a message and a dependency-free
offline HTML scatter (pure JavaScript) is still produced so the demo always works.
"""
# %% imports
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import *

print("INTERACTIVE: Plotly / Bokeh")
d = prepare(load_raw())
s = d.sample(2500, random_state=42).copy()
HOVER = ["person_id", "course_type", "family_income_level", "study_mode", "units_failed", "missed_deadlines"]
made = []

# %% Plotly
try:
    import plotly.express as px
    fig = px.scatter(s, x="attendance_rate", y="gpa_semester_2", color="dropout_label", opacity=.65,
                     color_discrete_map={"Stayed": C_STAY, "Dropped out": C_DROP},
                     hover_data=HOVER, title="Plotly: attendance vs GPA (hover for student details)",
                     labels={"attendance_rate": "Attendance %", "gpa_semester_2": "GPA semester 2", "dropout_label": "Outcome"})
    fig.write_html(os.path.join(INTER, "plotly_attendance_vs_gpa.html"), include_plotlyjs="cdn")
    heat = d.pivot_table(index="family_income_level", columns="course_type", values="dropout", aggfunc="mean").reindex(["Low", "Middle", "High"]) * 100
    fig2 = px.imshow(heat.round(1), text_auto=True, color_continuous_scale="YlOrRd", aspect="auto",
                     title="Plotly: dropout % by family income and course type")
    fig2.write_html(os.path.join(INTER, "plotly_income_course_heatmap.html"), include_plotlyjs="cdn")
    fig3 = px.scatter_3d(s.sample(1500, random_state=1), x="attendance_rate", y="gpa_semester_2", z="units_failed",
                         color="dropout_label", color_discrete_map={"Stayed": C_STAY, "Dropped out": C_DROP}, opacity=.7,
                         title="Plotly 3-D: attendance, GPA and failed units")
    fig3.write_html(os.path.join(INTER, "plotly_3d.html"), include_plotlyjs="cdn")
    made += ["plotly_attendance_vs_gpa.html", "plotly_income_course_heatmap.html", "plotly_3d.html"]
except ImportError:
    print("  plotly not installed -> run: pip install plotly")

# %% Bokeh
try:
    from bokeh.plotting import figure, output_file, save
    from bokeh.models import HoverTool, ColumnDataSource
    src = ColumnDataSource(dict(x=s.attendance_rate, y=s.gpa_semester_2, color=s.dropout.map(PAL),
                                outcome=s.dropout_label, pid=s.person_id, income=s.family_income_level,
                                failed=s.units_failed, missed=s.missed_deadlines))
    p = figure(title="Bokeh: attendance vs GPA (hover for details)", width=800, height=520,
               x_axis_label="Attendance %", y_axis_label="GPA semester 2", tools="pan,wheel_zoom,box_zoom,reset,save")
    p.scatter("x", "y", source=src, size=6, color="color", alpha=.6)
    p.add_tools(HoverTool(tooltips=[("Student", "@pid"), ("Outcome", "@outcome"), ("Income", "@income"),
                                    ("Failed units", "@failed"), ("Missed deadlines", "@missed"),
                                    ("Attendance", "@x{0.0}%"), ("GPA S2", "@y{0.00}")]))
    output_file(os.path.join(INTER, "bokeh_attendance_vs_gpa.html"), title="Bokeh scatter")
    save(p)
    made.append("bokeh_attendance_vs_gpa.html")
except ImportError:
    print("  bokeh not installed -> run: pip install bokeh")

# %% Offline fallback (no libraries needed - opens in any browser)
pts = [dict(x=float(r.attendance_rate), y=float(r.gpa_semester_2), d=int(r.dropout), id=int(r.person_id),
            inc=r.family_income_level, f=int(r.units_failed), m=int(r.missed_deadlines)) for r in s.head(2000).itertuples()]
html = """<!DOCTYPE html><html><head><meta charset="utf-8"><title>Student dropout - interactive scatter</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;margin:20px;background:#fafafa}h2{margin:0 0 6px}
#tip{position:fixed;display:none;background:#fff;border:1px solid #888;padding:6px 9px;font-size:12px;border-radius:5px;pointer-events:none;box-shadow:0 2px 6px #0003}
.l span{display:inline-block;width:11px;height:11px;border-radius:50%;margin:0 4px 0 12px}</style></head><body>
<h2>Attendance vs semester-2 GPA (2,000 students)</h2>
<div class="l"><span style="background:#2a9d8f"></span>Stayed<span style="background:#e76f51"></span>Dropped out &nbsp;| hover a point for details</div>
<canvas id="c" width="860" height="540" style="background:#fff;border:1px solid #ccc;margin-top:8px"></canvas><div id="tip"></div>
<script>const P=__DATA__;const cv=document.getElementById('c'),g=cv.getContext('2d'),tip=document.getElementById('tip');
const L=60,R=20,T=20,B=50,W=cv.width-L-R,H=cv.height-T-B;const X=v=>L+v/100*W,Y=v=>T+H-v/4*H;
g.font='12px Arial';g.fillStyle='#333';g.strokeStyle='#ddd';
for(let i=0;i<=10;i++){g.beginPath();g.moveTo(X(i*10),T);g.lineTo(X(i*10),T+H);g.stroke();g.fillText(i*10,X(i*10)-8,T+H+16)}
for(let i=0;i<=4;i++){g.beginPath();g.moveTo(L,Y(i));g.lineTo(L+W,Y(i));g.stroke();g.fillText(i,L-18,Y(i)+4)}
g.fillText('Attendance %',L+W/2-35,cv.height-8);g.save();g.translate(14,T+H/2+40);g.rotate(-Math.PI/2);g.fillText('GPA semester 2',0,0);g.restore();
P.forEach(p=>{g.beginPath();g.arc(X(p.x),Y(p.y),3.2,0,7);g.fillStyle=p.d?'rgba(231,111,81,.6)':'rgba(42,157,143,.6)';g.fill()});
cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let b=null,bd=100;
P.forEach(p=>{const dd=(X(p.x)-mx)**2+(Y(p.y)-my)**2;if(dd<bd){bd=dd;b=p}});
if(b){tip.style.display='block';tip.style.left=e.clientX+12+'px';tip.style.top=e.clientY+12+'px';
tip.innerHTML='<b>Student '+b.id+'</b> ('+(b.d?'Dropped out':'Stayed')+')<br>Attendance: '+b.x.toFixed(1)+'%<br>GPA S2: '+b.y.toFixed(2)+'<br>Income: '+b.inc+'<br>Failed units: '+b.f+'<br>Missed deadlines: '+b.m}else tip.style.display='none'};
</script></body></html>""".replace("__DATA__", json.dumps(pts))
with open(os.path.join(INTER, "offline_interactive_scatter.html"), "w", encoding="utf-8") as f:
    f.write(html)
made.append("offline_interactive_scatter.html")
record("u2", interactive_files=made)
print("  interactive files:", made)

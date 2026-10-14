"""Run the complete project end-to-end (about 3-6 minutes).  Usage: python src/run_all.py"""
import os, sys, runpy, time, json

HERE = os.path.dirname(os.path.abspath(__file__))
res = os.path.join(os.path.dirname(HERE), "outputs", "results.json")
if os.path.exists(res):
    os.remove(res)  # fresh results every run

STEPS = ["01_unit1_eda.py", "02_unit2_matplotlib.py", "06_interactive.py",
         "03_unit3_univariate.py", "04_unit4_bivariate.py", "05_unit5_multivariate.py"]
t0 = time.time()
for s in STEPS:
    print("\n" + "=" * 70 + f"\nRunning {s}\n" + "=" * 70)
    t = time.time()
    runpy.run_path(os.path.join(HERE, s), run_name="__main__")
    print(f"-- finished {s} in {time.time() - t:.1f}s")
print(f"\nALL DONE in {time.time() - t0:.0f}s. Figures: outputs/figures | Tables: outputs/tables | Interactive: interactive/")

"""HALF of the project: data -> teacher -> student(from scratch) -> robustness curves.
(Second half = knowledge distillation; see README.)"""
import sys, json, time; sys.path.insert(0, "src")
import numpy as np, torch
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from data import NoduleCloudDataset, N_FULL, IN_CH
from models import teacher as make_teacher, student as make_student, n_params
from engine import train_model, evaluate, robustness_curve, DEVICE

torch.manual_seed(0); np.random.seed(0)
print("device:", DEVICE)
d = np.load("data/processed_clouds.npz")
def ds(split, n=N_FULL, train=False):
    return NoduleCloudDataset(d[f"{split}_clouds"], d[f"{split}_labels"], n_points=n, train=train)

train_ds, val_ds, test_ds = ds("train", train=True), ds("val"), ds("test")
yb = d["train_labels"]; cw = [len(yb)/(2*np.bincount(yb)[c]) for c in [0, 1]]   # inverse-freq
print("class weights:", [round(x, 2) for x in cw])
NS = [1024, 512, 256, 128, 64, 32, 16]
EP = 40

results = {}
for name, make in [("teacher", make_teacher), ("student_scratch", make_student)]:
    print(f"\n=== {name} ({n_params(make()):,} params) ===")
    t = time.time(); m = make()
    train_model(m, train_ds, val_ds, epochs=EP, class_weight=cw)
    test_ds.set_n_points(N_FULL)
    full = evaluate(m, test_ds)
    print(f"{name} test@1024: acc {full['acc']:.3f} auc {full['auc']:.3f} balacc {full['balacc']:.3f}")
    curve = robustness_curve(m, test_ds, NS)
    results[name] = {"params": n_params(m), "test_full": full, "curve": curve, "sec": round(time.time()-t, 1)}
    torch.save(m.state_dict(), f"models/{name}.pt")
    print(f"  robustness (auc): " + "  ".join(f"{r['n_points']}:{r['auc']:.3f}" for r in curve))

json.dump(results, open("results.json", "w"), indent=2, default=float)

# plot
plt.figure(figsize=(7, 5))
for name in results:
    c = results[name]["curve"]
    plt.plot([r["n_points"] for r in c], [r["auc"] for r in c], marker="o", label=f"{name}")
plt.xscale("log", base=2); plt.gca().invert_xaxis()
plt.xlabel("# points at inference (sub-sampling)"); plt.ylabel("test ROC-AUC")
plt.title("Robustness to sub-sampling — NoduleMNIST3D point clouds")
plt.legend(); plt.grid(alpha=.3); plt.tight_layout(); plt.savefig("robustness_curves.png", dpi=120)
print("\nsaved results.json + robustness_curves.png")

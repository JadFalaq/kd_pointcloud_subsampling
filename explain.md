# What we've done so far — explained simply

A plain-language walkthrough of the project: the idea, every step, why we made each choice,
and what the results actually mean. (The [`README.md`](README.md) is the terse reference; this
file is the "understand it properly" companion.)

---

## 1. The assignment, in plain words

The course asked for an **original research question** about **point clouds applied to medical
imaging**, with a focus on **Knowledge Distillation (KD)**. Rules: the data must be **medical**;
we're free to pick the dataset and the neural-network architectures (but must *justify* them);
and we must deliver **reproducible code + numbers + an honest critical analysis** (even if our
hypothesis turns out wrong).

Our assigned sub-topic: **"Robustness to sub-sampling (classification)."**

Three terms to unpack before anything else:

- **Point cloud** = a shape represented as a *set of 3D points* `(x, y, z)` instead of a grid
  of pixels/voxels. Think of a scatter of dots floating in space that outline an object.
- **Sub-sampling** = keeping only *some* of those points (e.g. 64 instead of 1024). Real
  sensors give fewer points when scans are faster/cheaper/lower-resolution, so a model that
  still works with few points is valuable.
- **Knowledge Distillation (KD)** = train a small "student" network to imitate a bigger, better
  "teacher" network, so the small one punches above its weight.

**So the big question of the field here is:** *can distillation make a small point-cloud
classifier that stays accurate even when it only sees a few points?*

---

## 2. The research question we chose

> **Does distilling a teacher (trained on dense point clouds) into a lightweight student make
> that student more robust to sub-sampling at test time — for lung-nodule classification?**

**Hypothesis H1:** a *distilled* student degrades more gracefully as we remove test points
than the *same* student trained the ordinary way (plain cross-entropy).

Why it's a good question: it's **specific** (robustness, not just accuracy), **falsifiable**
(we can plot a curve and check), and **practically motivated** (sparse medical scans are real).

> ⚠️ **We've done the FIRST HALF**: the data pipeline, the models, and the robustness
> *baselines* (teacher and from-scratch student). The KD itself + the comparison is the second
> half (planned at the end).

---

## 3. The whole pipeline in one picture

```
CT volume (28×28×28 voxels)
        │   intensity-weighted voxel sampling
        ▼
Dense point cloud  (1024 points, each = x,y,z,intensity)
        │   train PointNet on dense clouds
        ▼
Teacher (0.8M params)  &  Student-from-scratch (54k params)
        │   at TEST time: keep only N random points  (N = 1024…16)
        ▼
Robustness curve: accuracy (AUC) vs number of points
```

Everything after the point-cloud step is "just" normal deep-learning on a table of numbers —
the clever part is turning a medical image into points and then measuring what happens as we
starve the model of points.

---

## 4. The data — NoduleMNIST3D

**What it is:** a public medical dataset (part of **MedMNIST v2**). Each sample is a tiny
**28×28×28 CT scan** of a **lung nodule**, labelled **benign (0)** or **malignant (1)**.
1158 train / 165 val / 310 test volumes.

**Why we chose it:**
- **Medical & public** — satisfies the imposed condition, open license.
- **Small** — fits a laptop GPU, so we can afford to train a teacher *and* a student *and* KD
  variants.
- **Naturally turns into point clouds** — a CT volume is a cube of brightness values; the
  bright voxels trace the nodule's structure, which we can sample as points.
- **Perfect for sub-sampling** — we build one dense cloud per nodule and then drop points.

**One catch — class imbalance:** only ~21–25 % of nodules are malignant. So plain **accuracy
is misleading** (a lazy model that always says "benign" already scores ~75 %). We therefore
report **ROC-AUC** (ranking quality, threshold-free) and **balanced accuracy**, and we weight
the training loss by the inverse class frequencies so the rare malignant class isn't ignored.

---

## 5. From CT volumes to point clouds (the key step)

A model can't eat a 3D image directly as a point cloud — we have to *make* the points. Our
recipe (`src/data.py`):

1. **Normalise** each volume's intensities to `[0, 1]`.
2. **Sample voxels weighted by intensity** (`weight ∝ intensity^1.5`): brighter voxels — the
   actual nodule tissue — are more likely to become points, so the cloud concentrates on the
   structure rather than empty air.
3. Take **1024 points**; each point carries **4 numbers**: its position `(x, y, z)` **plus its
   intensity** (a 4th feature that helps distinguish nodule tissue).
4. **Normalise the coordinates** — centre them and scale to the unit ball — so every nodule
   lives in the same coordinate range regardless of size/position.

The picture `presentation/assets/pointcloud_subsampling.png` shows one nodule rendered this
way at 1024 → 256 → 64 → 16 points: you can literally watch the shape dissolve as points are
removed. That dissolving is exactly what "robustness to sub-sampling" is about.

---

## 6. The models — PointNet (teacher & student)

**What PointNet is (simply):** a neural net that eats an *unordered set* of points. It pushes
every point through the *same* small MLP, then **collapses all points into one vector with a
`max` over the set** ("global max-pooling"), and classifies from that vector. The `max` is the
magic: it's **permutation-invariant** (the order of points doesn't matter) and it means the
prediction depends on the *strongest* response across points — which makes it easy to reason
about what happens when points disappear.

**Why PointNet** (and not DGCNN / Point Transformer): it's the canonical, simplest point-cloud
classifier; its single global max-pool makes the sub-sampling analysis clean; and it's light
enough to train many variants on a laptop GPU. (The heavier architectures are a possible
extension.)

Same architecture, two sizes:
- **Teacher** — wide PointNet, embedding 1024, **~0.8 M parameters**. Trained on dense clouds.
  This is the "knowledgeable" model KD will later distill *from*.
- **Student** — narrow PointNet, embedding 256, **~54 k parameters** (~15× smaller). This is
  the model we ultimately want to be small *and* robust.

---

## 7. The robustness protocol (how we actually measure it)

This is the heart of the project:

1. Build each nodule's **dense cloud (1024 points)** once.
2. **Train** on those dense clouds (with a tiny bit of random "jitter" for regularisation).
3. **At test time**, keep a **random subset of N points** of the *same* cloud, for
   `N ∈ {1024, 512, 256, 128, 64, 32, 16}`.
4. Measure **ROC-AUC at each N** → the **robustness curve**.

Dropping points from a fixed dense cloud (rather than re-scanning) is the standard, controlled
way to probe sub-sampling robustness: the information content shrinks, everything else is held
equal.

---

## 8. The results (real numbers, on the test set)

ROC-AUC as we remove points:

| # points | Teacher (0.8M) | Student-scratch (54k) |
|---:|:---:|:---:|
| 1024 | 0.791 | **0.810** |
| 512 | 0.776 | 0.785 |
| 256 | 0.773 | 0.779 |
| 128 | 0.726 | 0.731 |
| 64 | **0.708** | 0.677 |
| 32 | **0.667** | 0.616 |
| 16 | 0.572 | 0.568 |

(Plot: `presentation/assets/robustness_curves.png`.)

---

## 9. What the results mean (critical analysis)

**① The phenomenon is real.** Both models fall from AUC ≈ 0.80 (1024 points) to ≈ 0.57 (16
points). Sub-sampling genuinely hurts — so there *is* something for KD to improve. Good.

**② An honest surprise: the tiny student matches the big teacher** at full density (0.810 vs
0.791). Why? NoduleMNIST3D is **small and hard** (even dedicated 3D CNNs cap around AUC ~0.87),
so the teacher's extra capacity doesn't buy accuracy — it likely just **overfits** 1158
examples. This is the kind of result the assignment explicitly wants us to report honestly.

**③ But the teacher is more robust where it counts.** At heavy sub-sampling the teacher holds
up better (64 pts: **0.708 vs 0.677**; 32 pts: **0.667 vs 0.616**). So the teacher *does* have
something worth transferring — **not accuracy, but low-density robustness.**

**→ This reframes our hypothesis honestly.** KD here shouldn't aim to beat the teacher on
accuracy (the student already ties it); its job is to **transfer the teacher's graceful
degradation under sparsity** to the student. That's a sharper, more defensible version of H1.

**On metrics:** we read **AUC and balanced-accuracy**, not raw accuracy — the ~1:4 imbalance
makes accuracy look good for the wrong reasons (e.g. the teacher's 0.571 accuracy at 1024 pts
sits next to a healthy 0.791 AUC; the AUC is the trustworthy number).

---

## 10. Done vs. to-do

**Done (this half):**
- ✅ Data pipeline: CT volumes → intensity-weighted point clouds + sub-sampling utilities.
- ✅ Two PointNet models (teacher, student) with justified design.
- ✅ The robustness-to-sub-sampling **protocol and baseline curves**.
- ✅ Honest critical analysis (including the surprise) + reproducible code and a saved plot.

**To do (second half — the KD):**
1. **Logit KD (Hinton):** student loss `= α·CE + (1-α)·KL(softmax(z_s/T) ‖ softmax(z_t/T))`,
   teacher frozen (temperature `T`, mix `α`).
2. **"Robust KD" (our original twist):** feed the **teacher the dense cloud** but the
   **student a sub-sampled cloud**, and make the student match the teacher's dense prediction —
   so it explicitly learns to be right with few points.
3. **Feature KD:** also align the student's global vector `g` with the teacher's (our models
   already return `g`, so this is ready).
4. **Compare** `student_KD` vs `student_scratch` vs `teacher` robustness curves → **test H1**
   and conclude, even if H1 is not confirmed.

---

## 11. Where everything lives

```
kd_pointcloud_subsampling/
├── data/
│   ├── nodulemnist3d.npz          # raw dataset (MedMNIST v2)
│   └── processed_clouds.npz       # precomputed 1024-pt clouds (train/val/test)
├── src/
│   ├── data.py      # volumes → point clouds + sub-sampling Dataset
│   ├── models.py    # scalable PointNet (teacher / student)
│   └── engine.py    # train / evaluate / robustness_curve
├── run_half.py                    # one script: trains both + saves curves/plot/json
├── notebooks/01_pointclouds_robustness.ipynb   # narrated, reproducible (FR)
├── models/teacher.pt, student_scratch.pt
├── results.json, robustness_curves.png
├── presentation/                  # deck + assets + PROMPT.md (see that folder)
├── README.md                      # terse reference
└── explain.md                     # this file
```

**To reproduce the numbers:** run `run_half.py` (or the notebook) with the GPU torch
environment. The dataset is already downloaded; nothing else needs the network.

*(Written in English to match the README; happy to give a French version for the report.)*

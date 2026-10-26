# Prompt + materials to build the presentation

Copy everything below into your slide tool (Gamma / Google Slides / PowerPoint Designer /
ChatGPT / Claude). It contains the full project context, every number, a slide-by-slide
outline, and which image goes on which slide. **Insert the two images from `assets/`** where
indicated — an AI text tool can't generate them, so add them manually.

## Image assets (in `./assets/`)
- `pointcloud_subsampling.png` — the same lung nodule shown as a point cloud at 1024 / 256 /
  64 / 16 points (shows what "sub-sampling" means visually). → use on the Method and/or
  Protocol slide.
- `robustness_curves.png` — the two robustness curves (teacher vs student). → use on the
  Results slide (or rebuild it as a native line chart from the table below).

There is also a ready-made deck `KD_pointcloud_presentation.pptx` in this folder (10 slides,
same content) — it opens in PowerPoint / Google Slides. Use it directly, or regenerate your
own with the prompt below.

---

## PROMPT (paste this)

> Create a clean, professional **10-slide** academic presentation (16:9) titled
> **"Distillation de connaissances & robustesse au sous-échantillonnage — nuages de points en
> imagerie médicale"**. Audience: a technical ML course jury. Language: **French**. Tone:
> rigorous, honest, concise (~1.5–2 min/slide). Use a **medical teal/navy palette** (deep teal
> #1C7293, navy #0B3C5D, dark #08293A for title/closing, coral #E76F51 as the accent for the
> "student" series, white content backgrounds). Motif: scattered small dots (point clouds).
> Every slide must have a visual (icon, chart, card, or the provided image). No accent lines
> under titles, no edge stripes, left-align body text.
>
> **Context.** University project: "poser une question de recherche originale autour des
> nuages de points appliqués à l'imagerie médicale, avec un focus sur la distillation de
> connaissances (KD)". Imposed constraints: data must be **medical**; dataset and architectures
> are **free but must be justified**; deliver **reproducible code + quantitative results +
> critical analysis (even if the hypothesis is not confirmed)**. Assigned subject:
> **"Robustesse au sous-échantillonnage (classification)"**. **This deck covers the FIRST HALF
> of the project** (data + baselines + robustness protocol; the KD itself is the second half).
>
> Build these slides:
>
> **Slide 1 — Title.** "Distillation de connaissances & robustesse au sous-échantillonnage".
> Subtitle: "Nuages de points appliqués à l'imagerie médicale — classification de nodules
> (NoduleMNIST3D)". Badge: "1ʳᵉ moitié du projet". Footer: "PointNet (teacher/student) ·
> Knowledge Distillation · GPU". Dark background.
>
> **Slide 2 — Question de recherche & hypothèse.**
> - RQ: *"La distillation d'un teacher entraîné sur des nuages denses permet-elle à un student
>   léger d'être plus robuste au sous-échantillonnage des points à l'inférence, pour la
>   classification de nodules pulmonaires ?"*
> - H1: *"Un student distillé se dégrade plus gracieusement quand on retire des points en test
>   qu'un student entraîné from scratch (cross-entropy seule), à capacité égale."*
> - Note: condition imposée = données médicales ; dataset & architectures libres (à justifier).
>
> **Slide 3 — Données : NoduleMNIST3D (MedMNIST v2).** Stat tiles: **1 633 volumes CT**
> (1158/165/310 train/val/test) · **28³ voxels** · **~25 % malins** (déséquilibré) · **binaire**
> (bénin/malin). Justification (bullets): médical & public (condition imposée) ; léger →
> budget laptop-GPU ; convertible en nuages de points (échantillonnage de voxels pondéré par
> l'intensité → (x,y,z,intensité)) ; idéal pour le sous-échantillonnage (nuage dense 1024 pts
> puis on retire des points au test). Mention: on rapporte **AUC + balanced-accuracy** (pas
> l'accuracy brute) vu le déséquilibre, et on pondère la loss par l'inverse des fréquences.
>
> **Slide 4 — Des volumes CT aux nuages de points.** 4-step flow: (1) Volume 28³ → (2)
> Échantillonnage de voxels pondéré par l'intensité → (3) Nuage dense 1024 pts (x,y,z,I) → (4)
> Sous-échantillonnage au test. **Insert the image `pointcloud_subsampling.png`** (same nodule
> from 1024 to 16 points).
>
> **Slide 5 — Architectures : PointNet (teacher / student).** Two comparison cards. **Teacher**:
> PointNet large, emb 1024, **~0.8 M params**, entraîné sur nuages denses. **Student**: PointNet
> réduit, emb 256, **~54 k params** (~15× plus léger), le modèle qu'on veut rendre robuste.
> Justification: PointNet = classifieur canonique, invariant par permutation ; son max-pooling
> global unique rend la robustesse au sous-échantillonnage facile à analyser ; assez léger pour
> entraîner teacher + student + variantes KD. (DGCNN / Point Transformer = extensions possibles.)
>
> **Slide 6 — Protocole : robustesse au sous-échantillonnage.** Steps: entraîner sur nuages
> denses (1024 pts, jitter léger) → au test garder un sous-ensemble aléatoire de N points du
> même nuage → N ∈ {1024,512,256,128,64,32,16} → mesurer l'AUC à chaque N. (Dropping points
> from a fixed dense cloud = standard robustness protocol.)
>
> **Slide 7 — Résultats : courbes de robustesse (AUC test).** Insert `robustness_curves.png`
> OR build a line chart from this table (x = #points descending, y = ROC-AUC 0.5–0.85):
>
> | #pts | 1024 | 512 | 256 | 128 | 64 | 32 | 16 |
> |---|---|---|---|---|---|---|---|
> | Teacher (0.8M) | 0.791 | 0.776 | 0.773 | 0.726 | 0.708 | 0.667 | 0.572 |
> | Student scratch (54k) | 0.810 | 0.785 | 0.779 | 0.731 | 0.677 | 0.616 | 0.568 |
>
> Side insight box: "Les deux chutent (0.80→0.57) · le student 54k égale le teacher 0.8M à
> pleine densité · mais le teacher reste meilleur en sparsité extrême (64 pts : 0.708 vs 0.677)."
>
> **Slide 8 — Analyse critique.** Three finding cards: (1) **Le phénomène est réel** — AUC
> 0.80→0.57, terrain de jeu de la KD. (2) **Surprise honnête** — le student 54k égale/dépasse
> le teacher 0.8M à pleine densité (dataset petit & difficile, la grande capacité n'aide pas /
> sur-apprend). (3) **Le vrai signal pour la KD** — le teacher se dégrade plus gracieusement en
> sparsité extrême → on recadre H1 : la KD doit transférer la robustesse basse-densité, pas la
> précision.
>
> **Slide 9 — Deuxième moitié : la distillation (à faire).** Four steps: (1) **KD logit
> (Hinton)** — α·CE + (1-α)·KL(z_s/T ‖ z_t/T), teacher gelé. (2) **KD robuste (idée originale)** —
> le teacher voit le nuage dense, le student voit un nuage sous-échantillonné et doit matcher
> la sortie dense du teacher → apprend la sparsité. (3) **KD de features** — aligner le vecteur
> global g. (4) **Comparaison & test de H1** — courbes student_KD vs scratch vs teacher ;
> conclure honnêtement (même si H1 infirmée).
>
> **Slide 10 — Conclusion.** Recap: infrastructure complète + baselines établies (données →
> nuages de points, teacher, student, protocole) ; le sous-échantillonnage dégrade nettement la
> classification (mesurable, reproductible) ; H1 recadrée honnêtement ; prochaine étape = la KD.
> Footer: "Code reproductible : src/ · run_half.py · notebooks/01_pointclouds_robustness.ipynb".
> Dark background.

---

## One-line summary (for an abstract or email)
> First half of a point-cloud + knowledge-distillation study on NoduleMNIST3D lung nodules:
> we convert CT volumes to point clouds, train a PointNet teacher and a 15× smaller student,
> and establish the robustness-to-sub-sampling baselines (ROC-AUC vs #points). Finding: the
> tiny student matches the teacher at full density, but the teacher degrades more gracefully
> under heavy sub-sampling — which reframes the KD hypothesis as *transferring low-density
> robustness* rather than accuracy. KD implementation + comparison is the second half.

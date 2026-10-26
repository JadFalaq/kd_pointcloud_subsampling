# Robustness-to-sub-sampling results (test set ROC-AUC)

| # points at inference | Teacher PointNet (0.8M params) | Student PointNet from scratch (54k params) |
|---:|:---:|:---:|
| 1024 | 0.791 | **0.810** |
| 512  | 0.776 | 0.785 |
| 256  | 0.773 | 0.779 |
| 128  | 0.726 | 0.731 |
| 64   | **0.708** | 0.677 |
| 32   | **0.667** | 0.616 |
| 16   | 0.572 | 0.568 |

Full-density (1024 pts) secondary metrics:
- Teacher: acc 0.571 · ROC-AUC 0.791 · balanced-acc 0.660
- Student: acc 0.623 · ROC-AUC 0.810 · balanced-acc 0.699
- (accuracy is low/misleading because of the ~1:4 class imbalance → read AUC / balanced-acc)

Key numeric takeaways:
- Both models: AUC ~0.80 at 1024 pts → ~0.57 at 16 pts (clear degradation).
- Student ≈ Teacher at full density (even slightly better).
- Teacher is MORE robust at heavy sub-sampling (64 pts: 0.708 vs 0.677; 32 pts: 0.667 vs 0.616).

"""PointNet classifier (vanilla, permutation-invariant) with a scalable width,
so the same code gives a high-capacity TEACHER and a lightweight STUDENT.

We use plain PointNet (shared MLP + global max-pool) — no T-Net — because:
  - it is the canonical, well-understood point-cloud classifier,
  - its single global max-pool makes robustness-to-subsampling easy to reason about,
  - it is cheap enough to train many variants under a laptop-GPU budget.
`forward` returns (logits, global_feature); the feature is exposed for feature-based KD.
"""
import torch
import torch.nn as nn


class PointNet(nn.Module):
    def __init__(self, in_ch=4, n_classes=2, convs=(64, 64, 128), emb=1024,
                 cls=(512, 256), p_drop=0.3):
        super().__init__()
        chans = [in_ch, *convs, emb]
        layers = []
        for a, b in zip(chans[:-1], chans[1:]):
            layers += [nn.Conv1d(a, b, 1), nn.BatchNorm1d(b), nn.ReLU(inplace=True)]
        self.feat = nn.Sequential(*layers)
        head, d = [], emb
        for h in cls:
            head += [nn.Linear(d, h), nn.BatchNorm1d(h), nn.ReLU(inplace=True), nn.Dropout(p_drop)]
            d = h
        head += [nn.Linear(d, n_classes)]
        self.head = nn.Sequential(*head)
        self.emb = emb

    def forward(self, x):              # x: (B, N, C)
        x = x.transpose(1, 2)          # -> (B, C, N)
        f = self.feat(x)               # (B, emb, N)
        g = torch.max(f, dim=2).values # (B, emb) permutation-invariant global feature
        return self.head(g), g


def teacher(in_ch=4, n_classes=2):
    """High-capacity PointNet (~0.8M params)."""
    return PointNet(in_ch, n_classes, convs=(64, 64, 128), emb=1024, cls=(512, 256))


def student(in_ch=4, n_classes=2):
    """Lightweight PointNet (~5-6x fewer params) — the model we want to make robust."""
    return PointNet(in_ch, n_classes, convs=(32, 32, 64), emb=256, cls=(128,))


def n_params(m):
    return sum(p.numel() for p in m.parameters())

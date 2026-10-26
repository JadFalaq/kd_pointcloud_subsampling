"""NoduleMNIST3D (MedMNIST v2) -> point clouds, with sub-sampling utilities.

Each 28^3 CT nodule volume is turned into a point cloud by intensity-weighted
sampling of voxels: brighter voxels (nodule structure) are more likely to be kept.
Each point = (x, y, z, intensity). Coordinates are centred and scaled to the unit ball.

Robustness-to-subsampling protocol: build a DENSE cloud of N_FULL points once, then at
test time keep a random subset of N points. Dropping points from a fixed cloud is the
standard way to probe robustness to sub-sampling.
"""
import numpy as np
import torch
from torch.utils.data import Dataset

N_FULL = 1024          # points in the dense cloud
IN_CH = 4              # (x, y, z, intensity)


def volume_to_cloud(vol, n_points=N_FULL, rng=None, gamma=1.5):
    """uint8 volume (28,28,28) -> (n_points, 4) float32 point cloud."""
    rng = rng or np.random.default_rng()
    v = vol.astype(np.float32)
    v = (v - v.min()) / (v.max() - v.min() + 1e-9)        # per-volume [0,1]
    coords = np.argwhere(v > 0.1)                          # candidate voxels
    if len(coords) < n_points:                            # degenerate volume: pad from all voxels
        coords = np.argwhere(v >= 0.0)
    inten = v[coords[:, 0], coords[:, 1], coords[:, 2]]
    w = (inten + 1e-6) ** gamma
    w = w / w.sum()
    idx = rng.choice(len(coords), size=n_points, replace=len(coords) < n_points, p=w)
    pts = coords[idx].astype(np.float32)                  # (n,3) voxel indices
    feat = inten[idx][:, None]                            # (n,1) intensity
    # normalise coords: centre + scale to unit ball
    pts = pts / 27.0 * 2.0 - 1.0
    pts = pts - pts.mean(0, keepdims=True)
    scale = np.linalg.norm(pts, axis=1).max() + 1e-9
    pts = pts / scale
    return np.concatenate([pts, feat], axis=1).astype(np.float32)   # (n,4)


def build_clouds(npz_path, split, n_full=N_FULL, seed=0):
    """Return (clouds [M,n_full,4], labels [M])."""
    d = np.load(npz_path)
    X, y = d[f"{split}_images"], d[f"{split}_labels"].ravel().astype(np.int64)
    rng = np.random.default_rng(seed)
    clouds = np.stack([volume_to_cloud(X[i], n_full, rng) for i in range(len(X))])
    return clouds.astype(np.float32), y


class NoduleCloudDataset(Dataset):
    """Serves clouds, optionally sub-sampled to `n_points`, with light train augmentation."""
    def __init__(self, clouds, labels, n_points=N_FULL, train=False, seed=0):
        self.clouds = clouds
        self.labels = labels
        self.n_points = n_points
        self.train = train
        self.rng = np.random.default_rng(seed)

    def set_n_points(self, n):
        self.n_points = n

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, i):
        c = self.clouds[i]
        n_avail = c.shape[0]
        n = min(self.n_points, n_avail)
        sel = self.rng.choice(n_avail, size=n, replace=False)
        pts = c[sel].copy()
        if self.train:
            pts[:, :3] += self.rng.normal(0, 0.01, pts[:, :3].shape).astype(np.float32)  # jitter
        return torch.from_numpy(pts), int(self.labels[i])

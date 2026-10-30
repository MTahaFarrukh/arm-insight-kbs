#!/usr/bin/env python3
"""Parse UCI Robot Execution Failures .data files into a flat CSV table."""
from __future__ import annotations

import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "raw" / "uci_robot_failures"
OUT = ROOT / "raw" / "uci_robot_failures_instances.csv"


def parse_file(path: Path, problem: str) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()
    rows = []
    i = 0
    idx = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        # class label line
        if line[0].isalpha() or line.startswith("_"):
            label = line.split()[0]
            samples = []
            i += 1
            while i < len(lines) and len(samples) < 15:
                s = lines[i].strip()
                if not s:
                    i += 1
                    continue
                if s[0].isalpha():
                    break
                parts = s.split()
                if len(parts) != 6:
                    # noisy / malformed sample line
                    samples.append(None)
                    i += 1
                    continue
                try:
                    samples.append([float(x) for x in parts])
                except ValueError:
                    samples.append(None)
                i += 1
            idx += 1
            valid = [s for s in samples if s is not None]
            incomplete = len(valid) < 15
            if valid:
                cols = list(zip(*valid))  # 6 channels
                names = ["Fx", "Fy", "Fz", "Tx", "Ty", "Tz"]
                feat = {}
                for name, channel in zip(names, cols):
                    feat[f"{name}_mean"] = sum(channel) / len(channel)
                    feat[f"{name}_std"] = (
                        math.sqrt(sum((v - feat[f"{name}_mean"]) ** 2 for v in channel) / len(channel))
                        if len(channel) > 1 else 0.0
                    )
                    feat[f"{name}_absmax"] = max(abs(v) for v in channel)
                force_absmax = max(feat[f"{n}_absmax"] for n in ("Fx", "Fy", "Fz"))
                torque_absmax = max(feat[f"{n}_absmax"] for n in ("Tx", "Ty", "Tz"))
            else:
                feat = {f"{n}_{s}": float("nan") for n in ("Fx", "Fy", "Fz", "Tx", "Ty", "Tz") for s in ("mean", "std", "absmax")}
                force_absmax = float("nan")
                torque_absmax = float("nan")
                incomplete = True

            rows.append({
                "instance_id": f"{problem}-{idx:03d}",
                "problem": problem,
                "failure_class": label,
                "n_samples": len(valid),
                "incomplete_window": int(incomplete),
                "force_absmax": force_absmax,
                "torque_absmax": torque_absmax,
                **feat,
            })
            continue
        i += 1
    return rows


def main() -> None:
    all_rows = []
    for n in range(1, 6):
        path = SRC / f"lp{n}.data"
        all_rows.extend(parse_file(path, f"LP{n}"))
    fields = list(all_rows[0].keys())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(all_rows)
    print(f"Wrote {len(all_rows)} instances -> {OUT}")


if __name__ == "__main__":
    main()

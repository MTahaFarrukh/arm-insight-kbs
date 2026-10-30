"""CLI mirror of etl_cleaning.ipynb for UCI Robot Execution Failures."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
RAW_TABLE = ROOT / "raw" / "uci_robot_failures_instances.csv"
CLEAN_DIR = ROOT / "cleaned"
DIST = ROOT.parent / "dist"
KB_PATH = DIST / "knowledge_base.json"

CLASS_TO_SYMPTOMS = {
    "normal": [], "ok": [],
    "collision": [("protective_stop", "yes"), ("position_drift", "yes")],
    "obstruction": [("protective_stop", "yes"), ("joint_friction", "yes")],
    "fr_collision": [("protective_stop", "yes"), ("grip_loss", "yes")],
    "front_col": [("position_drift", "yes"), ("unexpected_motion", "yes")],
    "back_col": [("position_drift", "yes"), ("unexpected_motion", "yes")],
    "left_col": [("position_drift", "yes"), ("joint_noise", "yes")],
    "right_col": [("position_drift", "yes"), ("joint_noise", "yes")],
    "lost": [("grip_loss", "yes"), ("pressure_low", "yes")],
    "moved": [("grip_loss", "yes"), ("position_drift", "yes")],
    "slightly_moved": [("position_drift", "yes")],
    "collision_in_tool": [("protective_stop", "yes"), ("payload_mismatch", "yes")],
    "collision_in_part": [("grip_loss", "yes"), ("protective_stop", "yes")],
    "bottom_collision": [("joint_droop", "yes"), ("brake_alarm", "yes")],
    "bottom_obstruction": [("joint_friction", "yes"), ("joint_noise", "yes"), ("position_drift", "yes")],
}


def main():
    if not RAW_TABLE.exists():
        import runpy
        runpy.run_path(str(ROOT / "parse_uci_robot_failures.py"), run_name="__main__")

    kb = json.loads(KB_PATH.read_text(encoding="utf-8"))
    valid = set(kb["symptoms"].keys())
    raw_df = pd.read_csv(RAW_TABLE)
    n0 = len(raw_df)
    df = raw_df.copy()
    drop_log = {}
    df["failure_class"] = df["failure_class"].astype(str).str.strip().str.lower()

    mask = df["incomplete_window"] == 1
    drop_log["incomplete_ft_window"] = int(mask.sum()); df = df.loc[~mask].copy()
    mask = df["failure_class"].isna() | (df["failure_class"] == "") | df["force_absmax"].isna()
    drop_log["missing_class_or_features"] = int(mask.sum()); df = df.loc[~mask].copy()
    hi_f, hi_t = df["force_absmax"].quantile(0.995), df["torque_absmax"].quantile(0.995)
    mask = (df["force_absmax"] > hi_f) | (df["torque_absmax"] > hi_t)
    drop_log["extreme_sensor_outlier"] = int(mask.sum()); df = df.loc[~mask].copy()
    before = len(df)
    df = df.drop_duplicates(subset=["problem", "failure_class", "force_absmax", "torque_absmax", "Fx_mean", "Fy_mean", "Fz_mean"], keep="first")
    drop_log["duplicate"] = before - len(df)

    log_rows, unmapped = [], 0
    for _, r in df.iterrows():
        cls = r["failure_class"]
        mapping = CLASS_TO_SYMPTOMS.get(cls)
        if mapping is None:
            unmapped += 1
            continue
        if not mapping:
            log_rows.append({
                "record_id": r["instance_id"], "timestamp": "1996-01-01T00:00:00Z", "asset_id": r["problem"],
                "source": "Sensor / controller", "symptom": "protective_stop", "evidence": "no",
                "technician_note": f"UCI {r['problem']} class={cls} (normal/ok)", "uci_class": cls,
                "force_absmax": r["force_absmax"],
            })
            continue
        for sym, ev in mapping:
            if sym not in valid:
                continue
            log_rows.append({
                "record_id": f"{r['instance_id']}-{sym}", "timestamp": "1996-01-01T00:00:00Z", "asset_id": r["problem"],
                "source": "Sensor / controller", "symptom": sym, "evidence": ev,
                "technician_note": f"Mapped from UCI {r['problem']} failure_class={cls}; force_absmax={r['force_absmax']:.1f}",
                "uci_class": cls, "force_absmax": r["force_absmax"],
            })
    drop_log["unmapped_class"] = unmapped
    info_df = pd.DataFrame(log_rows)
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(CLEAN_DIR / "uci_sensor_table_clean.csv", index=False)
    info_df.to_csv(CLEAN_DIR / "maintenance_logs_clean.csv", index=False)
    info_df.to_json(CLEAN_DIR / "maintenance_logs_clean.json", orient="records", indent=2)

    cases = []
    for asset, g in info_df.groupby("asset_id"):
        evidence, records = {}, {}
        for _, row in g.iterrows():
            sym = row["symptom"]
            claims = records.setdefault(sym, [])
            claims.append({"source": row["source"], "state": row["evidence"], "note": row["technician_note"], "at": row["timestamp"]})
            states = {c["state"] for c in claims}
            evidence[sym] = "conflict" if ("yes" in states and "no" in states) else ("yes" if "yes" in states else "no")
        cases.append({"name": f"UCI ETL · {asset}", "asset": asset, "evidence": evidence, "records": records,
                      "notes": "Built from UCI Robot Execution Failures via ETL knowledge mapping."})

    report = {
        "pipeline": "Extract → Transform (clean + knowledge map) → Load",
        "source": {
            "name": "UCI Robot Execution Failures", "doi": "10.24432/C5M89N",
            "url": "https://archive.ics.uci.edu/dataset/92/robot+execution+failures",
            "license": "CC BY 4.0", "instances_raw": int(n0),
        },
        "kb_version": kb.get("version", "unknown"),
        "raw_file": "dataset/raw/uci_robot_failures_instances.csv",
        "cleaned_csv": "dataset/cleaned/maintenance_logs_clean.csv",
        "cleaning": {
            "rows_in": int(n0), "rows_out": int(len(info_df)), "sensor_rows_kept": int(len(df)),
            "rows_removed": int(n0 - len(df)), "drop_breakdown": drop_log, "dropped": drop_log,
            "duplicates_removed": drop_log.get("duplicate", 0), "kept": int(len(df)),
            "steps": [
                {"step": 1, "name": "Extract", "detail": "Parse UCI LP1-LP5 .data into instance table (authentic robot F/T failures)."},
                {"step": 2, "name": "Clean incomplete windows", "detail": "Drop episodes with incomplete 15-sample force/torque windows."},
                {"step": 3, "name": "Clean missing / outliers", "detail": "Drop missing features and extreme sensor absmax outliers."},
                {"step": 4, "name": "Deduplicate", "detail": "Remove duplicate sensor fingerprints."},
                {"step": 5, "name": "Knowledge map", "detail": "Map UCI failure_class to KBS symptom evidence (documented)."},
                {"step": 6, "name": "Load", "detail": "Write cleaned tables + prediction cases for forward-chaining."},
            ],
        },
        "prediction_case_count": len(cases),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "tool": "dataset/etl_cleaning.ipynb (pandas) on UCI Robot Execution Failures",
    }
    (CLEAN_DIR / "prediction_cases.json").write_text(json.dumps(cases, indent=2), encoding="utf-8")
    (CLEAN_DIR / "etl_cleaning_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    if DIST.exists():
        (DIST / "etl_cleaning_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        (DIST / "prediction_cases.json").write_text(json.dumps(cases, indent=2), encoding="utf-8")
    print(f"UCI raw={n0} sensor_clean={len(df)} evidence_rows={len(info_df)} cases={len(cases)}")
    print("drops:", drop_log)


if __name__ == "__main__":
    main()

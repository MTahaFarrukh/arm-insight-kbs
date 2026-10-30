# Deliverable 1 · Dataset (+ ETL)

## Authentic source (cite in viva / report / PPT)

| Field | Value |
|-------|--------|
| Name | **UCI Robot Execution Failures** |
| URL | https://archive.ics.uci.edu/dataset/92/robot+execution+failures |
| DOI | **10.24432/C5M89N** |
| License | CC BY 4.0 |
| Size | **463** force/torque episodes (LP1–LP5) |
| Local citation | [`raw/SOURCE.md`](raw/SOURCE.md) |

## Folder layout (submit this whole `dataset/` tree)

```text
dataset/
├── README.md                          ← this file
├── raw/
│   ├── SOURCE.md                      ← must-cite
│   ├── uci_robot_failures/            ← original UCI .data (untouched)
│   │   ├── lp1.data … lp5.data
│   └── uci_robot_failures_instances.csv  ← parsed extract table
├── etl_cleaning.ipynb                 ← **primary ETL demo** (pandas DataFrames)
├── parse_uci_robot_failures.py        ← Extract step
├── run_etl_notebook_logic.py          ← CLI mirror of notebook
└── cleaned/                           ← Transform + Load outputs
    ├── uci_sensor_table_clean.csv
    ├── maintenance_logs_clean.csv/.json
    ├── prediction_cases.json
    └── etl_cleaning_report.json
```

## Pipeline (class flow)

```text
DATASET (UCI) → ETL cleaning → INFORMATION → map to KB symptoms → PREDICTION
```

Measured (current run): **463** in → **451** sensor kept (4 outliers + 8 duplicates) → **785** evidence rows after knowledge map → **5** LP prediction cases.

## Demo for miss / viva

```bash
py -V:3.13 -m pip install pandas jupyter
py -V:3.13 dataset/parse_uci_robot_failures.py
# Open dataset/etl_cleaning.ipynb → Run All  (show DataFrames)
# OR:
py -V:3.13 dataset/run_etl_notebook_logic.py
```

> Honest line: UCI gives real robot F/T + failure classes; ETL **knowledge-maps** classes onto our educational KB symptoms so rule-based prediction can run.

# ARM / INSIGHT

### Explainable Knowledge-Based System for Robotic Arm Fault Diagnosis

<p align="center">
  <img src="https://img.shields.io/badge/NED_UET-CT--359_KBS-0B2630?style=for-the-badge&labelColor=71E9D9&color=0B2630" alt="NED CT-359" />
  <img src="https://img.shields.io/badge/CCP-Complex_Computing_Problem-71E9D9?style=for-the-badge&labelColor=152D40&color=71E9D9" alt="CCP" />
</p>

<p align="center">
  <a href="https://arm-insight-kbs-dist.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-Vercel-black?style=flat-square&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/Inference-Forward_Chaining-2ea44f?style=flat-square" alt="Forward Chaining" />
  <img src="https://img.shields.io/badge/Rules-8_Fault_Frames-0969da?style=flat-square" alt="8 Rules" />
  <img src="https://img.shields.io/badge/Symptoms-19-8a2be2?style=flat-square" alt="19 Symptoms" />
  <img src="https://img.shields.io/badge/Tests-13%2F13_PASS-success?style=flat-square" alt="13/13 PASS" />
  <img src="https://img.shields.io/badge/Storage-localStorage_%2B_Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/UI-HTML%2FCSS%2FJS_ESM-e34c26?style=flat-square&logo=javascript&logoColor=white" alt="Stack" />
  <img src="https://img.shields.io/badge/License-Academic_Prototype-lightgrey?style=flat-square" alt="Academic" />
</p>

<p align="center">
  <b>Live:</b> <a href="https://arm-insight-kbs-dist.vercel.app/">arm-insight-kbs-dist.vercel.app</a>
  ·
  <b>Course:</b> Knowledge Based Systems (CT-359)
  ·
  <b>Org:</b> NED University
</p>

---

## Overview

**ARM / INSIGHT** is an educational, **explainable rule-based KBS** that helps maintenance personnel explore possible robotic-arm faults from observed symptoms, conflicting evidence, and safety constraints.

| Feature | Detail |
|--------|--------|
| Knowledge representation | JSON **frames + production rules** |
| Inference | **Forward chaining** with Yes / No / Unknown / Conflict |
| Explainability | Reasoning timeline (OBS → RULE → ACTION) |
| Dataset | **UCI Robot Execution Failures** (DOI 10.24432/C5M89N) · 463 episodes |
| Evaluation | **13 synthetic scenarios · 13/13 PASS** (regression, not plant accuracy) |
| Deploy | Vercel static host + optional Supabase sync |

> **Disclaimer:** ETL uses an **authentic UCI** robot-failure dataset; Evaluation-lab cases are synthetic regression. Recommendations require qualified human review. No live robot control / safety certification.

---

## CCP requirements → this project

Official brief: [`course/KBS CCP.pdf`](course/KBS%20CCP.pdf) · Template: [`course/KBS CCP Report Template.pdf`](course/KBS%20CCP%20Report%20Template.pdf)

### Course learning outcomes (CLOs)

| CLO | Requirement (brief) | How ARM / INSIGHT addresses it |
|-----|---------------------|-------------------------------|
| **CLO 1** | Represent equipment, components, symptoms, faults, causes, evidence, maintenance actions | JSON **frames + production rules** in `knowledge_base.json` (19 symptoms · 8 fault frames with cause/action/provenance) |
| **CLO 2** | Analyse incomplete requirements, stakeholders, constraints; design a KBS | Scoped generic arm; stakeholders & assumptions documented in the **CCP report**; Unknown ≠ No; multi-source evidence |
| **CLO 3** | Assess inference methods; justify choice (accuracy, explainability, safety, cost) | **Forward chaining** chosen & justified in report vs backward chaining / ML / Bayesian; severity + cost/downtime policies |

### Problem constraints (from CCP description)

| Required capability | Implemented? | Where |
|---------------------|--------------|--------|
| Heterogeneous evidence (operator, sensor, records, expert…) | Yes | Source claims in Evidence workspace |
| Incomplete information | Yes | `unknown` state — never treated as No |
| Conflicting information | Yes | Yes+No claims → `conflict` (blocks Supported) |
| Infer possible faults | Yes | `engine.mjs` forward chaining |
| Recommend maintenance actions | Yes | Action text on Supported faults + maintenance board |
| Explanation of conclusions | Yes | Reasoning timeline (OBS → RULE → ACTION) |
| Safety / downtime / cost priorities | Yes | Independent safety alerts; policy: Safety first · Lower cost · Less downtime |

### CPA attributes (NCEAC)

| CPA | Meaning | Project response |
|-----|---------|------------------|
| **CPA-2** | Depth of analysis | Multiple valid KR/inference options; justified rule + forward-chaining design |
| **CPA-3** | Depth of knowledge | Domain rules + inference + validation suite |
| **CPA-9** | Incomplete requirements | Explicit assumptions; no invented numeric plant thresholds |

### Official deliverables → folders

| # | Official deliverable | Submit these paths |
|---|----------------------|--------------------|
| **1** | **Dataset + Source code** | **Dataset:** entire [`dataset/`](dataset/) (UCI raw + cleaned + `etl_cleaning.ipynb` + [`SOURCE.md`](dataset/raw/SOURCE.md)). **Source:** [`dist/`](dist/) (app + `knowledge_base.json`), `serve.py`, `test*.mjs`, [`supabase/`](supabase/), `vercel.json` (GitHub OK) |
| **2** | **Report + Presentation** | [`docs/KBS_Robotic_Arm_CCP_Report.docx`](docs/KBS_Robotic_Arm_CCP_Report.docx) (+ PDF) · [`docs/KBS_Robotic_Arm_CCP_Presentation.pptx`](docs/KBS_Robotic_Arm_CCP_Presentation.pptx) |
| **3** | **Project demonstration** | [Live demo](https://arm-insight-kbs-dist.vercel.app/) + `py -V:3.13 serve.py`; show **Dataset & ETL** + studio predictions |
| **4** | **Viva** | Defend problem / KR / inference / implementation / dataset+KB / results — use [`VIVA_GUIDE_Roman_Urdu.md`](VIVA_GUIDE_Roman_Urdu.md) |

### Rubric criteria (CCP) → where answered

| Criterion | CLO / CPA | Project answer |
|-----------|-----------|----------------|
| 1 Understanding the problem | CLO 2 / CPA-9 | Stakeholders, incomplete brief, assumptions — report §4 + viva guide |
| 2 Research & knowledge acquisition | CLO 1 / CLO 3 / CPA-3 | UCI dataset + UR concept sources + authored frames — `dataset/` + KB provenance |
| 3 KBS approach & KR | CLO 1 / CLO 2 / CPA-2 | Frames + production rules; forward chaining justified — report §5 |
| 4 Implementation & code | CLO 3 / CPA-3 | Working web KBS + ETL + tests 13/13 — `dist/` + `dataset/etl_cleaning.ipynb` |
| 5 Report, PPT, docs | — | `docs/` + this README |

### Instructor mark map (10)

| Part | Marks | Where |
|------|------:|-------|
| Knowledge Base | 2 | `dist/knowledge_base.json` / Rule explorer |
| Inference Engine | 2 | `dist/engine.mjs` |
| Prediction / Implementation | 2 | Fault predictions + ETL batch predict |
| ETL | 2 | `dataset/etl_cleaning.ipynb` + **Dataset & ETL** page |
| Report + PPT | 2 | `docs/` |

Submit on **Google Classroom**. Fill names/screenshots in Word → export PDF. `course/` = official brief/template only.

---

## Quick start (localhost)

```bash
# Windows
py -3 serve.py

# Linux / macOS
python3 serve.py
```

Open **http://localhost:8000**  
(If busy: `py -3 serve.py --port 8001`)

No `pip` / `npm` install required. Keep the terminal open; stop with `Ctrl+C`.  
Do **not** open `dist/index.html` as a file — the app loads ES modules and JSON over HTTP.

---

## Live demo & cloud

| Item | Link / note |
|------|-------------|
| Public demo | [arm-insight-kbs-dist.vercel.app](https://arm-insight-kbs-dist.vercel.app/) |
| Schema | [`supabase/schema.sql`](supabase/schema.sql) |
| Config | `dist/config.mjs` (Supabase URL + anon key) |

Works fully offline via browser `localStorage`. With keys in `dist/config.mjs`, use **Sync with Supabase** in the sidebar.

---

## What it does

- Record symptoms as **Yes / No / Unknown / Conflict**, or log multi-source claims (operator, sensor, maintenance, technician, manual)
- Opposing Yes+No claims → **Conflict** (blocks full rule support)
- Match **8 educational fault rules**; show support / missing / conflicting conditions
- **Guided mode** asks useful follow-up questions
- **Safety alerts** escalate independently of rule completion
- Save cases, compare investigations, track maintenance tasks, edit rules
- **▶ Viva demo** walkthrough + **Evaluation lab** (13 scenarios)
- Export report / knowledge base / workspace backup

```text
Symptoms  →  Forward chaining  →  Hypotheses + actions
                + explanation trace
                + safety alerts
```

---

## Demo sequence (viva-friendly)

1. Open the live site (or localhost)
2. **Dataset & ETL** — cite UCI Robot Execution Failures (DOI 10.24432/C5M89N), show cleaning drops + batch predict
3. Click **▶ Viva demo** — or load the **payload** scenario and open the reasoning timeline
4. Show a **conflict** case (Operator Yes + Sensor No)
5. Run **Evaluation lab** → confirm **13/13**
6. Optional: **Sync with Supabase** and show Table Editor rows

### Authentic dataset + ETL (marks)

**Source:** [UCI Robot Execution Failures](https://archive.ics.uci.edu/dataset/92/robot+execution+failures) · DOI [10.24432/C5M89N](https://doi.org/10.24432/C5M89N) · CC BY 4.0 · **463** episodes

```bash
# Use standard CPython (not free-threaded 3.13t): py -V:3.13 …
py -V:3.13 -m pip install pandas
py -V:3.13 dataset/parse_uci_robot_failures.py
py -V:3.13 dataset/run_etl_notebook_logic.py
# Viva: open dataset/etl_cleaning.ipynb → Run All (pandas DataFrames)
```

Details: [`dataset/README.md`](dataset/README.md) · citation: [`dataset/raw/SOURCE.md`](dataset/raw/SOURCE.md)

---

## Repository map (= deliverables)

```text
arm-insight-kbs/
│
├── dataset/                         # ★ DELIVERABLE 1 · DATASET
│   ├── raw/SOURCE.md                #   UCI citation (DOI 10.24432/C5M89N)
│   ├── raw/uci_robot_failures/      #   original LP1–LP5 .data
│   ├── etl_cleaning.ipynb           #   pandas Extract→Clean→Map→Load
│   ├── parse_*.py / run_etl_*.py    #   extract + CLI ETL
│   └── cleaned/                     #   cleaned tables + ETL report
│
├── dist/                            # ★ DELIVERABLE 1 · SOURCE (app + KB)
│   ├── knowledge_base.json          #   19 symptoms · 8 faults
│   ├── engine.mjs · evidence.mjs    #   forward chaining + conflict
│   ├── app.mjs · index.html         #   studio + Dataset & ETL page
│   └── etl_*.json / prediction_*.json
├── serve.py · test*.mjs · supabase/ · vercel.json
│
├── docs/                            # ★ DELIVERABLE 2 · Report + PPT
│   ├── KBS_Robotic_Arm_CCP_Report.docx
│   └── KBS_Robotic_Arm_CCP_Presentation.pptx
│
├── VIVA_GUIDE_Roman_Urdu.md         # ★ DELIVERABLE 3–4 prep
├── README.md
└── course/                          # official CCP brief + template (reference)
```

---

## Tests

```bash
node test.mjs
node test-state.mjs
node test-evidence.mjs
```

| Suite | Result |
|-------|--------|
| Sample scenarios + inference | 13 scenarios + 8 checks |
| Workspace / rule validation | 9 checks |
| Evidence-source merge | 7 checks |

---

## Course docs

| Doc | Purpose |
|-----|---------|
| [docs/KBS_Robotic_Arm_CCP_Report.docx](docs/KBS_Robotic_Arm_CCP_Report.docx) | Report (Deliverable 2) |
| [docs/KBS_Robotic_Arm_CCP_Presentation.pptx](docs/KBS_Robotic_Arm_CCP_Presentation.pptx) | Presentation (Deliverable 2) |
| [VIVA_GUIDE_Roman_Urdu.md](VIVA_GUIDE_Roman_Urdu.md) | Full viva/demo script (Deliverable 3–4 prep) |
| [dataset/README.md](dataset/README.md) | Dataset + ETL how-to |

---

## Stack & limitations

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JS" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

**In scope:** explainable diagnosis UI, rule editing, synthetic evaluation, optional cloud sync.  

**Out of scope:** live robot I/O, authenticated telemetry, trained ML classifiers, production-hardened auth, safety certification.

---

## License / academic use

Semester project for **NED UET — Knowledge Based Systems (CT-359)**.  
Use for learning and demonstration only.

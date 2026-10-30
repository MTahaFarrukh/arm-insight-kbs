# NED University of Engineering and Technology, Karachi
## Computer Science and Information Technology
### COMPLEX COMPUTING PROBLEM (CCP) — PROJECT SUBMISSION
### Knowledge-Based Systems (CT-359)

| | |
|---|---|
| **Project Title** | Intelligent Knowledge-Based System for Industrial Equipment Fault Diagnosis and Maintenance Decision Support |
| **Implemented system** | ARM / INSIGHT — Robotic Arm Fault Diagnosis and Maintenance Decision Support |
| **Submission Date** | 29 October 2026 |
| **Live demo** | https://arm-insight-kbs-dist.vercel.app/ |

### Student Details

| Sr. No. | Student Name | Roll No. | Signature |
|--------:|--------------|----------|-----------|
| 1 | Saad Ali | 24221 | ________________ |
| 2 | | | ________________ |
| 3 | | | ________________ |
| 4 | | | ________________ |
| 5 | | | ________________ |

> Fill rows 2–5 with group members before final Classroom submission. Update names/rolls if different from the table above.

This report describes the implemented web-based Knowledge-Based System (KBS) prototype with an explicit **ETL (Extract–Transform–Load) cleaning pipeline** on the authentic **UCI Robot Execution Failures** dataset (DOI 10.24432/C5M89N), rule-based **fault prediction**, synthetic evaluation scenarios for regression, optional cloud persistence (Supabase), and public deployment (Vercel). The robot type, plant-specific alarm mappings, real costs and historical failure data were not supplied in the brief; non-manufacturer rules are therefore explicit educational assumptions. **No operational accuracy or safety certification is claimed.**

### Assessment mapping (as clarified with the instructor)

| Component | Marks | Project evidence |
|-----------|------:|------------------|
| Knowledge Base | 2 | `dist/knowledge_base.json` — 19 symptoms, 8 fault frames (cause/action/provenance) |
| Inference Engine | 2 | `dist/engine.mjs` — forward chaining, Unknown/Conflict handling, explanation trace |
| Prediction / Implementation | 2 | UI predictions + batch predict from cleaned ETL cases |
| ETL | 2 | `dataset/` raw → clean pipeline; **Dataset & ETL** page shows cleaning |
| Report + Presentation | 2 | This report + `docs/*.pptx` |

**Information flow taught in class:**  
`DATASET → (ETL / cleaning) → INFORMATION → KNOWLEDGE BASE → INFERENCE → PREDICTION`

---

## 1. Project Instructions

The deliverable includes:

- Source code (`dist/`, `serve.py`, automated tests, `dataset/` UCI ETL)
- **Dataset** (raw + cleaned) under `dataset/` plus knowledge base / sample cases
- This report (and presentation deck)
- Executable demonstration (localhost and/or deployed URL)

The application is demonstrable in a browser. It does **not** command a robot. Assumptions are stated in Section 4.5. External knowledge sources and tools are cited in Sections 6 and 9. Section headings follow the prescribed CCP report template.

---

## 2. Problem Statement

- **(CLO 1)** Explain how a Knowledge-Based System can represent industrial equipment knowledge—including equipment, components, symptoms, faults, causes, and maintenance actions—using an appropriate knowledge-representation formalism.
- **(CLO 2)** Analyze the industrial equipment fault-diagnosis problem by identifying incomplete requirements, stakeholder needs, relationships, constraints, and suitable knowledge-based approaches.
- **(CLO 3)** Evaluate suitable knowledge-representation methods and inference algorithms for diagnosing faults and recommending maintenance actions, and justify the selected approach based on accuracy, explainability, safety, cost, and system requirements.

---

## 3. Problem Description / Project Context

A manufacturing cell uses an industrial robotic arm with joints/transmission, tool (payload) configuration, controller thermal paths, position feedback, power supply, communication harness, joint brakes, and an optional pneumatic gripper. Equipment knowledge is scattered across operator observations, controller/sensor alarms, maintenance records, technician inspections, and manuals/expert statements. The same symptom (for example a protective stop) can arise from more than one cause, evidence is often incomplete, and different sources may disagree. Stakeholders pull in different directions: technicians need auditable hypotheses and safe next actions; supervisors want lower downtime and cost; safety officers require hazard escalation that cannot be skipped for production continuity.

The ARM / INSIGHT prototype is a rule-based KBS that records categorical observations (Yes / No / Unknown / Conflict), optionally with multi-source claims, then applies eight explicit diagnostic production rules by forward chaining. Fully supported hypotheses receive a cause narrative and a qualified maintenance recommendation; hazards escalate independently of rule completion. A browser diagnostic studio, case archive, maintenance board, rule explorer, and evaluation lab support demonstration and regression. Optional Supabase sync stores shared workspace data; the live academic demo is hosted on Vercel. The system cannot diagnose unmodelled failures and must not replace the model-specific service manual or qualified personnel.

---

## 4. Problem Analysis

### 4.1 Problem Understanding

The core difficulty is **dispersed, incomplete, and sometimes conflicting** maintenance knowledge. A useful KBS must:

1. Represent equipment → component → symptom → fault → cause → action relationships explicitly.
2. Distinguish **unknown** (not checked) from **no** (verified absence).
3. Allow **multiple simultaneous** fault hypotheses.
4. Show **why** a rule fired or failed (explanation facility).
5. Respect **safety**, while still supporting cost/downtime preferences as secondary concerns.

The prototype narrows the broad “all industrial equipment” brief to one **generic educational robotic arm**, so the knowledge base stays inspectable and viva-defensible.

### 4.2 Stakeholders and Their Requirements

| Stakeholder | Required outcome |
|-------------|------------------|
| Operator | Record symptoms and source notes without deciding the root cause. |
| Maintenance technician | See matched / missing / conflicting evidence, possible cause, and safe next action. |
| Safety officer | Immediate hazard escalation regardless of whether a diagnostic rule is complete. |
| Production supervisor | Compare relative downtime and cost **without** overriding hazard priority. |
| Knowledge engineer / instructor | Inspect and edit rules, provenance, and regression results. |
| Course examiner | Demonstrable, explainable KBS aligned to CLO 1–3 and the CCP rubrics. |

### 4.3 Constraints and Conflicting Requirements

| Conflict | How the prototype treats it |
|----------|-----------------------------|
| Safety vs rapid restart | Protective stops and hazard symptoms escalate independently; recommendations require qualified review. |
| Lower cost vs reliability | Cost/downtime are **secondary** sort keys after status and severity. |
| Need for a decision vs missing data | Unknown never counts as No; rules stay Possible / Unassessed until evidence exists. |
| Conflicting reports | Opposing Yes/No source claims → **Conflict**; that symptom cannot fully support a rule. |
| Local demo vs shared audit | Browser localStorage always works; Supabase optionally mirrors the workspace for shared demo. |

### 4.4 Root Cause / Requirement Identification (CPA-9)

The brief leaves several requirements incomplete. Before any real plant deployment, the organization would still need to identify:

- Exact robot model and end-effector configuration  
- Alarm-code semantics and approved sensor thresholds  
- Access control and technician sign-off rules  
- Field maintenance history and source reliability weights  
- Real cost and downtime figures  
- Shared audit / retention policy  

These were **not** supplied. The project therefore avoids inventing numeric thresholds, marks synthetic cases clearly, and documents educational assumptions.

### 4.5 Assumptions

1. One **generic** robot configuration is used; the UI arm map is illustrative, not a certified model.
2. Observations are categorical: **Yes, No, Unknown, Conflict**. Source claims are Yes or No only; opposing claims are **not** averaged.
3. Each diagnostic rule is an **AND** conjunction of required symptoms. Full match → **Supported hypothesis**, not a legally confirmed root cause.
4. Severity, relative cost, and downtime labels are **teaching** attributes, not measured plant KPIs.
5. Evidence source labels (operator, sensor, etc.) are user assertions, not authenticated telemetry.
6. Cloud sync uses educational open Row-Level Security for demo; it is not production hardening.

---

## 5. Knowledge Representation and KBS Design

### 5.1 Selected Knowledge Representation Formalism

**Selected formalism: frames + production rules**, stored as inspectable JSON.

| Construct | What it represents |
|-----------|--------------------|
| Symptom dictionary | Observable evidence vocabulary (equipment observations). |
| Fault frame | Component, name, required conditions, cause, severity, cost, downtime, action, provenance. |
| Production rule | `IF` all conditions = Yes `THEN` support fault + recommend action. |
| Evidence / claims | Provenance: source type, present/absent, note, timestamp. |

**Why not only an ontology or ML model?**  
An ontology alone still needs an inference strategy; a trained classifier needs labelled plant data (not provided) and is harder to explain in a viva. Frames + rules map directly onto CLO 1 relationships and support transparent forward chaining (CLO 3).

Conceptual chain:

```text
Equipment (robotic arm)
  → Components (joint, gripper, encoder, …)
    → Symptoms (protective_stop, grip_loss, …)
      → Faults (payload, mechanical, …)
        → Causes + Maintenance actions
```

### 5.2 Knowledge Base / Ontology / Rule Base

**Contents of `knowledge_base.json` (v2.1):** 19 symptoms, 8 fault rules, cited manufacturer concept sources.

| Fault ID | Fault name | Required observations (all Yes) | Severity |
|----------|------------|----------------------------------|----------|
| payload | Payload configuration mismatch | protective_stop ∧ payload_mismatch | High |
| mechanical | Joint mechanical degradation | joint_noise ∧ joint_friction ∧ position_drift | High |
| thermal | Cooling-related overheating | overtemperature ∧ cooling_blocked | High |
| encoder | Position feedback fault | encoder_alarm ∧ feedback_unstable | High |
| gripper | Pneumatic grip fault | grip_loss ∧ pressure_low | High |
| communication | Communication connection fault | communication_alarm ∧ connection_damage | Medium |
| power | Power supply fault | power_alarm ∧ supply_unstable | High |
| brake | Joint holding / brake fault | brake_alarm ∧ joint_droop | Critical |

**Example production rule:**

```text
IF protective_stop = Yes
AND payload_mismatch = Yes
THEN support “Payload configuration mismatch”
     recommend qualified review of approved payload settings
```

Payload / abnormal-friction **concepts** follow Universal Robots guidance [1–3]. Exact conjunctions for the other families, and all cost/downtime classes, are **author-created educational rules**, not manufacturer-approved mappings.

### 5.3 Inference Mechanism

**Selected algorithm: forward chaining** over the rule base (`dist/engine.mjs`).

**Stages:**

1. Validate evidence keys/states.  
2. Materialize facts (`unknown` default). Record `OBS` steps for Yes facts.  
3. For each fault rule, partition conditions into Yes / No / Unknown / Conflict groups.  
4. Assign status:

| Status | Meaning |
|--------|---------|
| Supported | All conditions Yes |
| Possible | Some Yes, none No/Conflict |
| Conflicted | At least one Conflict, no No |
| Contradicted | At least one No |
| Unassessed | No Yes support yet |

5. Only **Supported** faults append an `ACTION` to the explanation trace.  
6. Rank by: status → severity → selected policy (Safety first / Lower cost / Less downtime) → coverage → id.  
7. Emit independent **safety alerts** for hazard symptoms (`smoke`, `unexpected_motion`, `joint_droop`, `grip_loss`) when Yes or Conflict.

Complexity: for *F* rules with at most *K* conditions → **O(FK)** evaluation + **O(F log F)** sort. The rule graph is acyclic.

### 5.4 Conflict Resolution Strategy

1. **Multi-source merge** (`evidence.mjs`): if any claim is Yes and any is No for the same symptom → state = **Conflict**.  
2. Conflicted symptoms **cannot** count as Yes for rule support → hypothesis becomes Conflicted (or stays incomplete).  
3. UI lists conflicts; guided mode prioritizes unresolved checks.  
4. Manual override of a symptom clears prior claims for that key (explicit user choice).  
5. Hazards with Yes/Conflict still escalate even if no rule is Supported.  
6. Ranking never lets cost/downtime outrank Supported/Critical safety ordering.

### 5.5 Explanation Facility

For each visible hypothesis the UI shows:

- Status badge and severity  
- Coverage (% of conditions Yes) — **not** a probability  
- Grouped evidence lines (yes / no / unknown / conflict)  
- Cause text; maintenance action when Supported  
- Provenance string  

A **reasoning timeline** lists OBS / RULE / ACTION steps. Case export includes observations, findings, notes, and the trace for viva/audit discussion.

### 5.6 System Architecture

```text
DATASET (raw CSV, noisy)
   │  ETL: Extract → Transform/Clean → Load
   ▼
INFORMATION (cleaned logs + prediction cases)
   │
   ▼
KNOWLEDGE BASE (frames + production rules)
   │
   ▼
INFERENCE ENGINE (forward chaining)
   │
   ▼
PREDICTION (Supported/Possible faults + actions + trace)

[ Browser UI ]
   Diagnostic studio · Dataset & ETL · Evaluation lab
   engine.mjs · evidence.mjs · knowledge_base.json
   localStorage · optional Supabase · Vercel / serve.py
```

| Layer | Responsibilities |
|-------|------------------|
| ETL | UCI extract → clean → knowledge map → load + UI report |
| Presentation | Studio, ETL page, cases, maintenance, rules, evaluation |
| Inference / Prediction | Four-state rule evaluation, hazards, questions, trace |
| Evidence | Source categories and conflict merge |
| Knowledge | JSON frames/rules + 13 synthetic scenarios |
| Persistence | localStorage + optional Supabase upsert/mirror |
| Deployment | Vercel static site; schema in `supabase/schema.sql` |

### 5.7 Prediction Facility

In this KBS, **prediction** means inferring the most plausible fault hypotheses from cleaned/observed evidence using the rule base (not a trained ML classifier).

- **Supported** predictions fire maintenance recommendations.  
- **Possible** predictions flag incomplete evidence.  
- Batch prediction runs on ETL-built asset cases (`prediction_cases.json`) from the **Dataset & ETL** page.  
- Coverage % is rule-match completeness, **not** probability.

---

## 6. Dataset / Knowledge Sources

| Source / Dataset | Type | Size / No. of Records | Purpose | Citation / URL |
|------------------|------|------------------------|---------|----------------|
| **UCI Robot Execution Failures** | Authentic public dataset | **463** episodes (LP1–LP5) | Robot force/torque after failure | DOI [10.24432/C5M89N](https://doi.org/10.24432/C5M89N) — **submit + cite** |
| `dataset/raw/uci_robot_failures/*.data` | Original UCI files | 5 files | Untouched source download | UCI archive |
| `dataset/raw/uci_robot_failures_instances.csv` | Parsed authentic table | 463 instances | ETL extract output | Project file |
| `dataset/etl_cleaning.ipynb` | Jupyter ETL (pandas) | DataFrame pipeline | Cleaning + knowledge map demo | Project file — **submit** |
| `dataset/cleaned/*` | Cleaned info + report | After noise drop | Load for prediction | Project file — **submit** |
| `knowledge_base.json` | Authored rule/frame KB | 8 faults; 19 symptoms | Diagnostic vocabulary, actions, provenance | Project file |
| `sample_cases.json` | Synthetic test cases | 13 scenarios | Regression + demonstration | Project file |
| Universal Robots — Understanding Protective Stops | Manufacturer guidance | 1 article | Payload / friction concepts | [1] |
| Universal Robots — C162 Error Code | Manufacturer error note | 1 page | Incorrect payload / CoG example | [2] |
| Universal Robots — e-Series Service Handbook | Service manual (PDF) | Protective-stop flow | Troubleshooting reference | [3] |
| Supabase project tables | Cloud datastore | workspaces, cases, tickets | Optional shared persistence for demo | Project setup |
| Automated tests `test*.mjs` | Software checks | 13 + validation suites | Behaviour regression | Project file |

### 6.0 ETL and cleaning (noise removal)

**Must-have for this CCP (instructor clarification):** Dataset → Information via ETL.

**Authentic source:** UCI *Robot Execution Failures* (force/torque after failure detection; CC BY 4.0). Local files under `dataset/raw/uci_robot_failures/`. Citation: `dataset/raw/SOURCE.md`.

| Step | Name | What we do |
|-----:|------|------------|
| 1 | Extract | Parse UCI LP1–LP5 `.data` → instance DataFrame (class + F/T summaries) |
| 2 | Clean incomplete | Drop episodes with incomplete 15-sample windows |
| 3 | Clean missing / outliers | Drop NaNs; remove extreme force/torque absmax outliers |
| 4 | Deduplicate | Drop duplicate sensor fingerprints |
| 5 | Knowledge map | Map UCI `failure_class` → educational KB symptoms (documented table) |
| 6 | Load | Cleaned CSVs + prediction cases → app **Dataset & ETL** page |

**Honesty for viva:** UCI does not use our exact symptom strings; ETL includes an explicit **knowledge-mapping** step from authentic failure labels (collision, obstruction, lost, …) to KB evidence so rule-based prediction can run.

**Measured cleaning result (current run):** 463 UCI instances → **451** sensor rows kept (4 extreme outliers + 8 duplicates removed) → **785** mapped evidence rows → **5** LP-grouped prediction cases loaded into the UI.

**Primary demo:** `dataset/etl_cleaning.ipynb` (pandas DataFrames).  
CLI refresh: `py -V:3.13 dataset/parse_uci_robot_failures.py` then `py -V:3.13 dataset/run_etl_notebook_logic.py`.

UR sources [1–3] still support KB *concepts*; UCI supplies the **empirical robot-failure dataset**. Evaluation-lab 13/13 PASS measures software behaviour on authored scenarios, not UCI classification accuracy.

---

## 6. Implementation  
*(Template numbering retained: Implementation follows Dataset as section “6”.)*

### 6.1 Software / Tools / Libraries

| Tool | Role |
|------|------|
| HTML / CSS / JavaScript ES modules | Client KBS application |
| JSON / CSV | Knowledge base, sample cases, raw/cleaned dataset |
| Python 3 + pandas | `etl_cleaning.ipynb` / `run_etl_notebook_logic.py` + `serve.py` |
| Node.js (optional) | CLI regression tests |
| Supabase JS (CDN ESM) | Optional cloud sync |
| Vercel | Public static deployment of `dist/` |

No pip/npm install is required to run the core localhost demo. ETL demo needs `pandas` (`pip install pandas`).

### 6.2 Modules and Components

| Module / screen | Function |
|-----------------|----------|
| Diagnostic studio | Enter observations; show **fault predictions** + trace |
| Dataset & ETL | Show cleaning steps, noise drop table, batch prediction |
| Case history | Save/reopen/compare investigations (with KB snapshot) |
| Maintenance board | Track Open / In progress / Completed tasks |
| Rule explorer | Inspect/edit educational rules with validation |
| Evaluation lab | Run 13 authored scenarios |
| Viva demo button | Scripted walkthrough: payload → conflict → evaluation |
| Cloud sync | Push/pull workspace when Supabase keys are configured |

### 6.3 Code Structure

| Path | Role |
|------|------|
| `dataset/raw/uci_robot_failures/` | Authentic UCI LP1–LP5 source (**submit**) |
| `dataset/cleaned/` | Cleaned data + ETL report (**submit**) |
| `dataset/etl_cleaning.ipynb` | Extract → clean → map → load (pandas) |
| `dist/index.html` | Shell UI, ambient motion layer, splash |
| `dist/app.mjs` | Events, rendering, ETL UI, predictions |
| `dist/engine.mjs` | `diagnose()` — inference / prediction core |
| `dist/evidence.mjs` | Claim merge + validation |
| `dist/state.mjs` | Workspace / KB validation |
| `dist/cloud.mjs` | Supabase pull/push |
| `dist/config.mjs` | Supabase URL / anon key (empty = offline) |
| `dist/knowledge_base.json` | Frames + rules |
| `dist/etl_cleaning_report.json` | UI copy of cleaning audit |
| `dist/prediction_cases.json` | UI copy of ETL prediction cases |
| `dist/sample_cases.json` | Synthetic scenarios |
| `dist/style.css` / `polish.css` | Layout + glass/motion styling |
| `serve.py` | Localhost server |
| `supabase/schema.sql` | Tables + educational RLS policies |
| `vercel.json` | Publish `dist/` |
| `test.mjs`, `test-state.mjs`, `test-evidence.mjs` | Automated checks |

### 6.4 User Inputs and Outputs

**Inputs:** symptom states or multi-source claims; case name; asset ID; notes; priority policy; optional rule edits; optional restore backup / cloud sync.

**Outputs:** ranked hypotheses; next-best questions; safety alerts; reasoning trace; maintenance tasks; case comparison; text investigation report; KB export; workspace backup JSON; mirrored rows in Supabase when enabled.

---

## 7. Testing and Results

### 7.1 Synthetic evaluation lab (13/13)

All 13 authored scenarios matched expected **Supported** fault id sets under default rules:

| Scenario | Expected supported | Result |
|----------|--------------------|--------|
| Payload configuration mismatch | payload | PASS |
| Joint mechanical degradation | mechanical | PASS |
| Cooling-related overheating | thermal | PASS |
| Position feedback fault | encoder | PASS |
| Pneumatic grip fault | gripper | PASS |
| Communication connection fault | communication | PASS |
| Power supply fault | power | PASS |
| Joint holding / brake fault | brake | PASS |
| Insufficient evidence | *(none)* | PASS |
| Conflicting payload reports | *(none)* | PASS |
| Negative evidence | *(none)* | PASS |
| Two simultaneous faults | payload, gripper | PASS |
| Immediate safety escalation | *(none)* | PASS |

### 7.2 Automated Node checks

Additional CLI tests verify: Possible vs Supported, Contradicted, Conflicted, hazard alerts, multi-fault ordering under each policy, invalid evidence rejection, workspace/rule validation, and evidence-source merge behaviour. **These check software behaviour, not field diagnostic accuracy.**

### 7.3 Manual / demo checks

- Demo scenario loads findings and trace  
- Operator Yes + Sensor No → Conflict blocks support  
- Case save survives refresh (localStorage); Sync mirrors to Supabase when configured  
- Guided mode advances unanswered checks  
- Case compare, maintenance task status, rule edit + re-run evaluation  
- Deployed URL loads the same static client  

---

## 8. Evaluation, Limitations and Conclusion

### 8.1 Evaluation of the Proposed Approach (CLO 3)

| Criterion | Rule-based forward chaining (chosen) | Alternative / trade-off |
|-----------|--------------------------------------|-------------------------|
| Explainability | Every condition and derived action is inspectable | ML needs labels + post-hoc explanation |
| Incomplete evidence | Unknown ≠ No | Bayesian needs calibrated probabilities (not supplied) |
| Safety | Independent hazard alert + severity-first ranking | Still requires human procedures |
| Cost / availability | Secondary qualitative ordering | Needs real plant numbers |
| Maintainability | Editable JSON rules + regression suite | Large ontology/graph may scale better across many asset types |
| Screening style | Natural for “given these observations, what fires?” | Backward chaining better if a single target fault is already suspected |

**Justification:** For this CCP, forward chaining over explicit AND rules maximises **explainability**, handles **incomplete/conflicting** evidence conservatively, and remains implementable without unavailable probabilistic data—while still supporting maintenance recommendations and viva defence.

### 8.2 Limitations

- Generic arm; only eight fault hypotheses  
- Qualitative cost/downtime; no live telemetry or model-specific thresholds  
- Source categories are not authenticated or credibility-weighted  
- Conflicts wait for human resolution  
- Supabase demo policies are intentionally open (educational)—not production security  
- Regression PASS ≠ industrial accuracy or safety clearance  

### 8.3 Future Improvements

1. Bind knowledge to a **specific** robot model and approved manuals.  
2. Acquire expert-labelled incident cases; measure precision/recall and missed-hazard rate.  
3. Import timestamped alarms; weight source reliability.  
4. Add authentication and audit logging on the shared store.  
5. Optionally enrich with a lightweight ontology/graph view for cross-equipment reuse—while keeping rule explanation.

### 8.4 Conclusion

ARM / INSIGHT demonstrates how a KBS can represent industrial robotic-arm knowledge (CLO 1), analyse incomplete stakeholder requirements (CLO 2), and apply justified forward-chaining inference with conflict handling and explanations (CLO 3). Synthetic tests and a deployable prototype support course demonstration. The system’s academic value is **transparency**; real deployment requires model-specific knowledge acquisition and independent validation.

---

## 9. References

[1] Universal Robots. *Understanding Protective Stops*.  
https://www.universal-robots.com/articles/ur/robot-care-maintenance/understanding-protective-stops/ (accessed 2026-10-23).

[2] Universal Robots. *C162 Error Code*.  
https://www.universal-robots.com/manuals/EN/HTML/SW5_19/Content/prod-err-codes/topics/CODE_162.html (accessed 2026-10-23).

[3] Universal Robots. *e-Series Service Handbook — Protective Stop*.  
https://www.universal-robots.com/manuals/EN/PDF/SW5_24/service-manual_e-series/e-Series_Service_Manual_en.pdf (accessed 2026-10-23).

[4] NED University of Engineering and Technology. Knowledge-Based Systems (CT-359) Complex Computing Problem brief and report template, 2026.

[5] ARM / INSIGHT project package: `knowledge_base.json`, `sample_cases.json`, inference engine and tests, version 2.1, 2026.

[6] Supabase documentation — client libraries and Row Level Security (project educational use), 2026.

[7] Vercel documentation — static site deployment, 2026.

---

## Appendix A. Viva Demonstration and Requirement Traceability

| Brief requirement | Implementation evidence |
|-------------------|-------------------------|
| Knowledge representation (CLO 1) | JSON symptom dictionary; eight component/fault/cause/action frames |
| Problem analysis (CLO 2) | Section 4 — stakeholders, incomplete requirements, constraints, assumptions |
| Algorithm assessment (CLO 3) | Section 5.3 + 8.1 — forward chaining vs alternatives |
| Conflicting information | Multi-source Yes+No → Conflict; blocks Supported |
| Explanation and safety | Trace, condition groups, independent hazard alerts |
| Dataset and results | UCI 463 episodes + ETL; 13/13 eval PASS; CLI tests |
| Deployable demo | https://arm-insight-kbs-dist.vercel.app/ + localhost `serve.py` |

### Suggested five-minute demo

1. Open the live site (or localhost). Click **▶ Viva demo**, *or* manually: load **Payload configuration mismatch**, open the reasoning timeline, save the case.  
2. New case: add Operator **Yes** and Sensor **No** for the same symptom → show **Conflict**.  
3. Create a maintenance task; open the board.  
4. Run **Evaluation lab** (13/13).  
5. Optionally show Supabase Table Editor rows after **Sync with Supabase**.  
6. State clearly: this proves **software/KBS behaviour**, not validated plant accuracy.

### Worked example

`protective_stop = Yes` and `payload_mismatch = Yes`  
→ OBS facts → payload rule **Supported** → ACTION recommendation.  

- `payload_mismatch = Unknown` → **Possible**  
- `payload_mismatch = No` → **Contradicted**  
- opposing source claims → **Conflicted**

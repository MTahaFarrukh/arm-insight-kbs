# Authentic dataset source

## Primary source

**Robot Execution Failures** — UCI Machine Learning Repository  

- Portal: https://archive.ics.uci.edu/dataset/92/robot+execution+failures  
- DOI: [10.24432/C5M89N](https://doi.org/10.24432/C5M89N)  
- License: Creative Commons Attribution 4.0 (CC BY 4.0)  
- Donated: 1999  
- Instances: **463** failure/normal episodes across 5 learning problems (LP1–LP5)  
- Content: force/torque (Fx,Fy,Fz,Tx,Ty,Tz) time series **after** failure detection (15 samples × 6 channels)

### Learning problems in the donation

| File | Problem |
|------|---------|
| LP1 | Failures in approach to grasp position |
| LP2 | Failures in transfer of a part |
| LP3 | Position of part after a transfer failure |
| LP4 | Failures in approach to ungrasp position |
| LP5 | Failures in motion with part |

### Academic reference

Camarinha-Matos, L.M., Seabra Lopes, L., and Barata, J. (1996). Integration and Learning in Supervision of Flexible Assembly Systems. *IEEE Transactions on Robotics and Automation*, 12(2), 202–219.

Local copies: `uci_robot_failures/lp1.data` … `lp5.data` (downloaded from UCI ML databases).

## How this CCP uses the data

UCI provides **robot failure episodes with sensor force/torque**, not our exact symptom vocabulary.  
ETL therefore:

1. **Extract** authentic UCI instances into a table.  
2. **Clean** incomplete/outlier/noisy rows.  
3. **Transform** failure classes → KBS symptom evidence using an explicit **knowledge-mapping table** (domain interpretation for the educational robotic-arm KB).  
4. **Load** cleaned information for forward-chaining **prediction**.

This keeps the dataset **authentic** while connecting it to the course knowledge base honestly.

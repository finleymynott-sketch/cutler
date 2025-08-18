# Data room

All datasets normalized to ISO-A3 codes. Aliases resolved via `aliases.json`.

- readiness.json
  - Description: Government AI readiness score per country (0–100 scale)
  - License: Placeholder (cite source when replacing)
  - Last updated: 2025-08-08
  - Keys: { ISO3: number }

- grid_headroom.json
  - Description: Electric grid headroom (surplus positive, deficit negative) in percent
  - License: Placeholder
  - Last updated: 2025-08-08
  - Keys: { ISO3: number }

- exposure.json
  - Description: Job exposure (0–100)
  - License: Placeholder
  - Last updated: 2025-08-08
  - Keys: { ISO3: number }

- safety_footprint.json
  - Description: AI-safety footprint size (S/M/L/none); presence of orgs/policies
  - License: Placeholder
  - Last updated: 2025-08-08
  - Keys: { ISO3: "none"|"S"|"M"|"L" }

- compute_sites.json
  - Description: Large-compute sites ≥200 MW
  - License: Placeholder
  - Last updated: 2025-08-08
  - Fields: iso3, site_name, status (operational|announced), mw

- aliases.json
  - Description: Common country name aliases → ISO-A3
  - License: CC0
  - Last updated: 2025-08-08

## Derived metrics

- Capacity composite = 0.4*Readiness_z + 0.4*Compute_z + 0.2*Grid_z
  - Compute_z uses log(1 + total_MW) + site_count
  - Components standardized to z-scores; clamp each to ±2σ before weighting
- Balance = Capacity composite − Exposure_z

Weights: readiness 0.4, compute 0.4, grid 0.2. Clamp: ±2σ per component. Documented here and implemented in app.

## Scenarios

- Now (baseline)
- 2030/2035 × Slow/Medium/Quick
  - Exposure scaling factors (example): Slow 0.9/0.85, Medium 1.05/1.1, Quick 1.2/1.35
  - Compute growth (optional): +10% for 2030 Medium, +25% for 2035 Quick (applied to MW before z-score)

## Integrity

- All records use ISO-A3. Any unmatched names in sources should be added to `aliases.json` and re-normalized.
- Outliers: clamp at ±2σ before weighting to avoid posterization.

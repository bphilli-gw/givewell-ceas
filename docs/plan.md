# GiveWell CEAs Interactive Dashboard — Plan

## Overview

Build an interactive web dashboard for GiveWell's ITN cost-effectiveness analysis, hosted on GitHub Pages via `bphilli-gw/givewell-ceas`. Inspired by [Max Ghenis's implementation](https://www.maxghenis.com/blog/givewell-cea/) but adapted to our Python-first workflow.

## Architecture

**React + Vite + TypeScript** deployed as a static site to **GitHub Pages**.

- **Pre-computed data**: Python script runs the validated model for all 26 countries → JSON
- **TypeScript model**: Port of `main_cea.py` for interactive parameter editing (recalculates in-browser)
- **Supplementary sheet outputs**: Pre-computed and bundled as static data (durability, coverage, insecticide resistance, malaria mortality)
- **No server needed**: Everything runs client-side

### Why this approach

| Consideration | Decision |
|---|---|
| Hosting | GitHub Pages (static only, no server) |
| Python model | Source of truth, used for pre-computation |
| Interactivity | TypeScript port of main CEA pipeline for real-time recalculation |
| Supplementary sheets | Pre-computed (complex, rarely changed by users) |
| Charting | Recharts (React-native, lightweight) |

### What the TypeScript model covers

The main CEA pipeline (`main_cea.py`) is mostly arithmetic — multiplication chains, sums, and a PV annuity calculation. This is ported to TypeScript so users can change:

- **Tier 1 (always visible)**: Grant size, cost per net, moral weights, discount rate
- **Tier 2 (expandable)**: Efficacy adjustments, validity adjustments, net usage rates
- **Tier 3 (advanced)**: All adjustment factors, leverage/funging parameters

Supplementary sheet outputs (durability protection, coverage totals, resistance adjustments, mortality rates) are pre-computed. Users can override these directly if desired.

## Pages

### 1. Overview (home page)
- Ranked table of all 26 country locations
- Columns: country, CE multiple, deaths averted, cost per life saved, grant size
- Sortable by any column
- Click row → navigates to Country Detail

### 2. Country Detail (`/country/:id`)
- Step-by-step calculation breakdown in 9 collapsible sections (matching spreadsheet layout)
- Editable parameters in sidebar — change a value, see results update instantly
- Shows all intermediate values so users can trace the logic

### 3. Sensitivity Analysis (`/sensitivity`)
- **Tornado diagram**: Which parameters have the biggest impact on CE?
- **Parameter sweep**: Pick a parameter, sweep across a range, see CE change for selected countries
- Pre-computed sweep data + live recalculation for main CEA params

### 4. Compare Countries (`/compare`)
- Select 2-3 countries side-by-side
- Highlight where they diverge in the calculation chain
- Bar charts comparing key metrics

## Data Pipeline

```
cea-to-python/                          givewell-ceas/
┌─────────────────────┐                ┌──────────────────────┐
│ Python model        │  precompute.py │ public/data/         │
│ (validated, tested) │ ─────────────→ │   countries.json     │
│ 131 tests passing   │                │   sensitivity.json   │
└─────────────────────┘                └──────────────────────┘
                                              ↓
                                       TypeScript model
                                       (main_cea.ts)
                                              ↓
                                       React UI
```

## File Structure

```
givewell-ceas/
├── public/
│   └── data/
│       ├── countries.json        # Pre-computed results for all 26 countries
│       └── sensitivity.json      # Pre-computed parameter sweeps
├── src/
│   ├── App.tsx                   # Router + layout
│   ├── main.tsx                  # Entry point
│   ├── model/
│   │   ├── types.ts              # TypeScript types matching Python dataclasses
│   │   └── cea.ts                # Main CEA calculation (port of main_cea.py)
│   ├── pages/
│   │   ├── Overview.tsx          # Ranked table
│   │   ├── CountryDetail.tsx     # Per-country breakdown
│   │   ├── Sensitivity.tsx       # Sensitivity analysis
│   │   └── Compare.tsx           # Cross-country comparison
│   ├── components/
│   │   ├── Layout.tsx            # Nav + page wrapper
│   │   ├── ResultsTable.tsx      # Sortable table component
│   │   ├── ParameterEditor.tsx   # Editable parameter sidebar
│   │   ├── CalculationSection.tsx # Collapsible section with intermediates
│   │   └── Charts.tsx            # Chart components
│   └── data/
│       └── useCountryData.ts     # Data loading hook
├── scripts/
│   └── precompute.py             # Runs Python model → JSON
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
└── docs/
    ├── plan.md                   # This file
    └── progress-log.md           # Session progress tracking
```

## Deployment

1. Repo: `github.com/bphilli-gw/givewell-ceas`
2. GitHub Actions workflow: on push to `main`, build Vite app → deploy to `gh-pages` branch
3. URL: `bphilli-gw.github.io/givewell-ceas/`

## Deferred

- **LLM integration**: "Ask questions about the model" feature — deferred to Phase 3
- **Other CEA types**: SMC, deworming, VAS — deferred until ITN UI proves useful
- **Full supplementary sheet recalculation in-browser**: Would require porting all 5 supplementary calculators to TypeScript. Not needed for MVP since users primarily adjust main CEA parameters.

## Relationship to cea-to-python

This repo is the **presentation layer**. The `cea-to-python` repo remains the validated Python model (source of truth). The `precompute.py` script bridges them by running the Python model and exporting results as JSON.

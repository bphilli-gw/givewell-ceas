# GiveWell CEA Explorer

Interactive web dashboard for exploring GiveWell's ITN (insecticide-treated nets) cost-effectiveness analysis.

## Features

- **Overview**: Ranked table of all 26 country/region combinations by cost-effectiveness
- **Country Detail**: Step-by-step calculation breakdown with editable parameters for real-time recalculation
- **Sensitivity Analysis**: Tornado diagrams and parameter sweeps to see what drives cost-effectiveness
- **Compare**: Side-by-side comparison of selected countries with charts

## Technical Details

- Built with React + TypeScript + Vite
- Pre-computed data from validated Python model (131 tests, <1e-6 tolerance)
- Main CEA pipeline ported to TypeScript for interactive parameter editing
- Hosted on GitHub Pages

## Development

```bash
npm install
npm run dev
```

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via GitHub Actions.

## Data Pipeline

Pre-computed data is generated from the `cea-to-python` repository:

```bash
cd ../givewell-ceas
python scripts/precompute.py
```

This runs the validated Python model for all 26 countries and exports results to `public/data/countries.json`.

# Progress Log

## 2026-03-10 — Session 1: Initial build

### Completed
- [x] Wrote plan.md with architecture decisions
- [x] Created progress-log.md
- [x] Pre-computed data from Python model (all 26 countries, CE range: 5.3x to 26.0x)
- [x] Set up Vite + React + TypeScript project
- [x] Ported main CEA pipeline to TypeScript (`src/model/cea.ts`)
- [x] Built Overview page (ranked table, summary cards, sortable columns)
- [x] Built Country Detail page (9 collapsible calculation sections, editable parameters in sidebar)
- [x] Built Sensitivity Analysis page (tornado diagram, parameter sweep with multi-country comparison)
- [x] Built Compare page (side-by-side metrics table, bar charts, radar chart)
- [x] Configured GitHub Pages deployment (GitHub Actions workflow, SPA 404 redirect)
- [x] Project builds successfully (`npm run build`)

### Not Yet Done
- [ ] Push to `bphilli-gw/givewell-ceas` on GitHub
- [ ] Enable GitHub Pages in repo settings (Settings > Pages > Source: GitHub Actions)
- [ ] Manual testing of all pages in browser
- [ ] LLM integration (deferred to Phase 3)

### Decisions Made
- **Framework**: React + Vite + TypeScript (matches Max Ghenis's approach, best UX for GitHub Pages)
- **Hosting**: GitHub Pages (static site, no additional systems)
- **Interactivity**: TypeScript port of main_cea.py for real-time recalculation; supplementary sheets pre-computed
- **Repo**: Separate `givewell-ceas` repo, not inside `cea-to-python`
- **LLM**: Deferred to Phase 3
- **Net retention constants**: Hardcoded CTN treatment/control coverage (0.568/0.486) and CTN remaining yr1 (0.766) in TypeScript model — these are global constants from the Inputs sheet column H

### Files Created
```
givewell-ceas/
├── .github/workflows/deploy.yml    # GitHub Pages deployment
├── public/
│   ├── data/countries.json          # Pre-computed CEA data (26 countries)
│   └── 404.html                     # SPA redirect for GitHub Pages
├── src/
│   ├── App.tsx                      # Router + layout
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # All styles
│   ├── model/
│   │   ├── types.ts                 # TypeScript types matching Python dataclasses
│   │   └── cea.ts                   # Main CEA calculation (TS port)
│   ├── pages/
│   │   ├── Overview.tsx             # Ranked table
│   │   ├── CountryDetail.tsx        # Per-country breakdown + editable params
│   │   ├── Sensitivity.tsx          # Tornado + parameter sweep
│   │   └── Compare.tsx              # Side-by-side comparison
│   ├── components/
│   │   ├── Layout.tsx               # Nav + page wrapper
│   │   ├── ResultsTable.tsx         # Sortable table
│   │   ├── ParameterEditor.tsx      # Sidebar parameter editing
│   │   └── CalculationSection.tsx   # Collapsible calculation section
│   └── data/
│       └── useCountryData.ts        # Data loading hook
├── scripts/
│   └── precompute.py                # Python → JSON data pipeline
├── docs/
│   ├── plan.md
│   └── progress-log.md
├── vite.config.ts                   # Vite config with /givewell-ceas/ base
└── package.json
```

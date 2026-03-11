# Progress Log

## 2026-03-11 — Session 3: SMC CEA integration

### Completed
- [x] Extended `precompute.py` to generate both `itn_countries.json` (26 countries) and `smc_countries.json` (20 countries)
- [x] Created SMC TypeScript types (`src/model/smc-types.ts`) matching Python dataclasses
- [x] Created SMC data loading hook (`src/data/useSMCCountryData.ts`)
- [x] Added prefix-based routing: `/itn/...` and `/smc/...` routes
- [x] Built landing page (`/`) with cards linking to ITN and SMC
- [x] Built SMC Overview page (20 countries, ranked table with uncertainty bars)
- [x] Built SMC Country Detail page (8 calculation sections, pre-computed only — no interactive editing)
- [x] Built SMC Sensitivity page (MC histogram + tornado, 9 parameters)
- [x] Built SMC Compare page (side-by-side metrics, bar charts, radar chart)
- [x] Updated Layout with CEA type tabs (ITN / SMC) and context-aware navigation
- [x] Updated ITN internal links for `/itn/` prefix (ResultsTable, CountryDetail back link)
- [x] Added CSS for CEA tabs, home page cards, sidebar placeholder
- [x] Project builds successfully (`npm run build`)
- [x] Removed old `countries.json` (replaced by `itn_countries.json`)

### Architecture Decisions
- **Prefix routing**: `/itn/...` and `/smc/...` with landing page at `/`
- **Separate JSON**: `itn_countries.json` and `smc_countries.json` for independent loading
- **Separate types**: SMC has different structure (1 supplementary sheet vs 4, different fields)
- **No SMC TS model**: Pre-computed data only; no interactive parameter editing for SMC yet
- **Rollback point**: givewell-ceas commit `086c62c` (pre-SMC integration)

### SMC MC results
- 16 of 20 countries have Monte Carlo data (4 DRC locations lack CI data)
- CE range: 4.6 (DRC-HK) to 42.2 (Nigeria-Jigawa)
- Nigeria-Jigawa and Nigeria-Zamfara are standout locations (CE > 40)

### Not Yet Done
- [ ] Manual browser testing of all SMC pages
- [ ] Port SMC main_cea to TypeScript for interactive parameter editing
- [ ] SMC Explore page (no equivalent of ITN's IR explorer)

### New/Modified Files
```
scripts/precompute.py                    # Extended: now generates ITN + SMC JSON
public/data/itn_countries.json           # Renamed from countries.json
public/data/smc_countries.json           # NEW: 20 SMC countries
src/App.tsx                              # Updated: prefix routes, landing page
src/components/Layout.tsx                # Updated: CEA type tabs + context nav
src/components/ResultsTable.tsx          # Updated: /itn/ prefix for row clicks
src/pages/CountryDetail.tsx              # Updated: /itn back link
src/model/smc-types.ts                   # NEW: SMC TypeScript interfaces
src/data/useCountryData.ts               # Updated: loads itn_countries.json
src/data/useSMCCountryData.ts            # NEW: SMC data hook
src/pages/Home.tsx                       # NEW: landing page
src/pages/smc/Overview.tsx               # NEW: SMC overview table
src/pages/smc/CountryDetail.tsx          # NEW: SMC country detail (8 sections)
src/pages/smc/Sensitivity.tsx            # NEW: SMC MC sensitivity
src/pages/smc/Compare.tsx                # NEW: SMC country comparison
src/index.css                            # Updated: CEA tabs, home cards, sidebar card
```

---

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

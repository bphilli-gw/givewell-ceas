# Feature Wishlist

Prioritized list of features and improvements for the GiveWell CEA Explorer. Roughly ordered by impact, but open to reshuffling based on researcher demand.

## 1. Additional CEA models

Extend the dashboard to cover all GiveWell top charities. Each follows the same workflow: convert spreadsheet to Python, validate, precompute JSON, build dashboard pages.

- **Deworming** (Deworm the World, SCI Foundation) — different structure from malaria/vaccine models
- **GiveDirectly** (cash transfers) — simpler model, good candidate for quick win
- **Other interventions** as GiveWell adds them

Current coverage: ITN (26 locations), SMC (20), VAS (46), NI (40).

## 2. Calculation explainer / "Explore" mode

Expand the ITN Insecticide Resistance explorer pattern to all models. The goal: researchers and external reviewers can trace any output back through the full formula chain.

- **Step-through calculation view**: Click on any result to see the formula, inputs, and intermediate values that produced it — like a debugger for the CEA
- **Formula annotations**: Show the original spreadsheet cell reference alongside the Python formula so reviewers can cross-check
- **Dependency highlighting**: Select a parameter and see which outputs it affects (forward) or which inputs feed into a result (backward)
- **Plain-language summaries**: Each calculation section gets a one-paragraph explanation of what it represents and why it matters

## 3. Integration with intervention reports

Connect CEA numbers to the narrative context in GiveWell's published intervention reports and grant pages.

- **Link key assumptions to report sections**: E.g., "mortality reduction = 0.55" links to the section of the report that justifies this estimate
- **Evidence quality indicators**: Flag which parameters come from RCTs vs. observational data vs. expert judgment
- **Report change tracking**: When a report is updated, surface which CEA parameters were affected
- **Inline citations**: Hover over a parameter to see the source study, year, and confidence level

## 4. Updates / changelog view

Show what changed in a CEA between investigation rounds, so researchers can quickly answer "what's different this time?"

- **Diff view**: Side-by-side comparison of parameter values between two versions of a CEA (e.g., 2024 vs 2025 investigation)
- **Impact attribution**: For each changed parameter, show how much it moved the final CE multiple (decompose the total change into per-parameter contributions)
- **Timeline**: Visual history of how a country's CE multiple has evolved across investigations
- **Narrative changelog**: Auto-generated summary of what changed and why (links to the parameter changes that drove the delta)

## 5. Monte Carlo improvements

Current MC implementation varies by model (ITN/SMC/VAS have it, NI doesn't yet). Tighten up across the board.

- ~~**NI Monte Carlo**: Implement Phase 4 (mc_config.py, monte_carlo.py, sensitivity.py) for New Incentives~~ — **Done.** 16 of 40 states have MC/sensitivity (those with CI data)
- **Distribution review**: Audit which distributions we're using for each parameter — Beta for probabilities, Gamma for costs, Normal for adjustments. Are the shape parameters well-calibrated?
- **Correlation structure**: Parameters aren't independent (e.g., mortality and morbidity estimates come from the same GBD source). Model key correlations rather than assuming independence
- **Convergence diagnostics**: How many draws do we need? Show convergence plots so researchers can judge whether 10K draws is enough
- **Tail behavior**: Are we capturing the right tail risks? Review whether our distributions adequately represent low-probability, high-impact scenarios

## 6. Cross-model comparison

Enable direct comparison across intervention types under shared assumptions.

- **Unified cost-effectiveness ranking**: "Given $X to allocate, here's the marginal impact across all interventions and locations" — already partially implemented on the home page with moral weight sliders
- **Shared assumption sets**: Apply the same moral weights, discount rate, and value parameters across all models simultaneously
- **Allocation optimizer**: Given a budget and a set of eligible grants, suggest the allocation that maximizes expected impact (with uncertainty)
- **Sensitivity to moral weights**: How much does the ranking change if you shift moral weight assumptions? Interactive exploration of the Pareto frontier

## 7. Data provenance tracking

Every number should trace back to its source so researchers can assess staleness and credibility.

- **Source metadata**: Each parameter tagged with: source (GBD 2021, IGME 2023, DHS survey, etc.), year, geographic scope, update frequency
- **Staleness alerts**: Flag parameters where the source data is more than N years old or a newer version is available
- **Data vintage view**: Color-code the calculation chain by data recency — green (current), yellow (1-2 years old), red (3+ years)
- **Bulk update tracking**: When GBD releases a new version, show which parameters across all models would be affected

## 8. Scenario builder

Let researchers define, save, and share parameter configurations.

- **Named scenarios**: Save a set of parameter overrides as "Optimistic coverage" or "Conservative efficacy" — reusable across countries
- **Scenario comparison**: Run the same country through multiple scenarios side-by-side
- **Shareable URLs**: Encode parameter overrides in the URL so researchers can share a specific view
- **Preset scenarios**: Ship common scenarios (GiveWell baseline, optimistic, pessimistic) as defaults

## 9. Export and reporting

Help researchers use CEA outputs in grant documents and board materials.

- **Country calculation export**: Download a country's full calculation chain as a self-contained PDF or HTML document, with all intermediate values and formulas shown
- **Comparison tables**: Export side-by-side country comparisons as formatted tables (for pasting into Google Docs or presentations)
- **Chart export**: Individual charts downloadable as SVG/PNG
- **API access**: JSON endpoints for each country's results so other tools can consume the data programmatically

---

## Not on this list

- **Spreadsheet divergence tracking**: Python-vs-Excel discrepancies are already tracked in `cea-to-python/docs/known-gaps.md` and surfaced through the cross-validation test suite.
- **LLM "ask questions about the model"**: Previously deferred (see plan.md). Could revisit once the explainer mode (item 2) is solid — it would provide the structured context an LLM needs to give good answers.

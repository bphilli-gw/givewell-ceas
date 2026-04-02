/**
 * Explore: NI Vaccine Pipeline
 *
 * High-level view combining vaccine efficacy, coverage, disease burden,
 * treatment effect, and aggregation into a single conceptual flow.
 */

import { useState, useMemo } from 'react';
import { useNICountryData } from '../../data/useNICountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function NIExploreVaccinePipeline() {
  const { data, loading, error } = useNICountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No state data available</div>;

  const r = country.results;
  const cost = country.inputs.cost;
  const outcomes = country.inputs.outcomes;

  const tiers: FlowTier[] = [
    {
      id: 'enrollment',
      label: 'Enrollment',
      annotation: 'New Incentives provides cash transfers to incentivize families to vaccinate their children. The number of children enrolled depends on the grant size and cost per infant.',
      nodes: (
        <>
          <FlowNode title="Grant size" category="empirical" values={[{ value: cost.grant_size, format: 'number' }]} />
          <FlowNode title="Cost per infant" category="empirical" values={[{ value: cost.cost_per_infant, format: 'number' }]} annotation={`Includes ${(cost.adj_repeat_enrollment * 100).toFixed(1)}% repeat enrollment adjustment`} />
          <FlowNode title="Children enrolled" category="calculated" formula="grant / cost_per_infant" values={[{ value: r.children_enrolled, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'coverage',
      label: 'Coverage & Treatment Effect',
      annotation: 'The treatment effect combines RCT evidence (IDinsight trial) with survey data (MICS 2021) and rapid assessments. It represents the additional vaccination coverage NI achieves beyond what would happen without the program.',
      nodes: (
        <>
          <FlowNode title="Counterfactual vaccination rate" category="empirical" values={[{ value: r.counterfactual_vaccination, format: 'percent' }]} annotation="Rate without NI (from MICS/survey data)" />
          <FlowNode title="Unvaccinated proportion" category="calculated" formula="1 - counterfactual" values={[{ value: r.unvaccinated_proportion, format: 'percent' }]} />
          <FlowNode title="Overall treatment effect" category="empirical" values={[{ value: r.overall_effect, format: 'percent' }]} annotation="From RCT: percentage-point increase in vaccination" />
          <FlowNode title="Internal validity adj" category="subjective" values={[{ value: outcomes.internal_validity_adj, format: 'percent' }]} />
          <FlowNode title="External validity adj" category="calculated" values={[{ value: r.external_validity_adj, format: 'percent' }]} annotation="From Disease Burden + Treatment Effect sheets" />
          <FlowNode title="Adjusted treatment effect" category="calculated" formula="effect \u00D7 (1 + int_val) \u00D7 (1 + ext_val)" values={[{ value: r.adjusted_effect, format: 'percent' }]} />
        </>
      ),
    },
    {
      id: 'outcome',
      label: 'Coverage Increase & Outcome Children',
      annotation: 'Coverage increase = adjusted effect applied to unvaccinated children. Outcome children = enrolled \u00D7 coverage increase \u2014 the number of children who get vaccinated because of NI.',
      nodes: (
        <>
          <FlowNode title="Coverage increase" category="calculated" formula="adj_effect \u00D7 unvaccinated" values={[{ value: r.coverage_increase, format: 'percent' }]} />
          <FlowNode title="Outcome children" category="output" formula="enrolled \u00D7 coverage_increase" values={[{ value: r.outcome_children, format: 'number' }]} annotation="Children who get vaccinated because of NI" wide />
        </>
      ),
    },
    {
      id: 'disease-burden',
      label: 'Disease Burden (Under-5)',
      annotation: 'For each vaccine-preventable disease (TB, diphtheria, pertussis, tetanus, LRI, meningitis, rotavirus, measles), GBD data provides mortality counts. These are aggregated by vaccine, adjusted for GBD vs. IGME discrepancies, and combined with vaccine efficacy to estimate deaths averted.',
      nodes: (
        <>
          <FlowNode title="VPD mortality total (adjusted)" category="empirical" values={[{ value: r.vpd_total_adj_u5 }]} annotation="Sum of 8 vaccine-preventable diseases from GBD (state-specific)" />
          <FlowNode title="GBD adjustment" category="calculated" values={[{ value: r.gbd_adj_u5, format: 'percent' }]} annotation="Adjusts for GBD \u2194 country data discrepancies" />
          <FlowNode title="Incidence averted" category="calculated" values={[{ value: r.incidence_averted_u5, format: 'percent' }]} annotation="SUMPRODUCT of vaccine efficacy \u00D7 disease proportions" />
          <FlowNode title="Under-5 DALYs" category="output" values={[{ value: r.daly_u5, format: 'number' }]} annotation="Direct mortality DALYs from vaccination" />
          <FlowNode title="Indirect DALYs" category="output" values={[{ value: r.daly_u5_indirect, format: 'number' }]} annotation={`Indirect mortality ratio: ${outcomes.indirect_mort_ratio}`} />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Vaccine Pipeline</h1>
      <div className="explore-ir__intro">
        <p><strong>How do enrollment, coverage, and disease burden combine?</strong></p>
        <p>
          The NI model chains together 6 supplementary sheets: vaccine efficacy
          (per-vaccine effectiveness from RCTs), coverage (survey-based baseline
          rates), disease burden (8 VPDs from GBD), treatment effect (RCT dose
          aggregation with evidence synthesis), indirect effects (herd protection),
          and aggregation (multi-vaccine, multi-age-band).
        </p>
        <p>
          This view shows the high-level flow from enrollment through coverage
          increase to disease burden estimation. Detailed intermediates for each
          sub-module can be expanded in future versions.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="vp-state">State</label>
          <select id="vp-state" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (<option key={c.id} value={c.id}>{c.state}</option>))}
          </select>
        </div>
      </div>
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--empirical">Measured data</span>
        <span className="flow-legend__item flow-legend__item--subjective">Staff judgment</span>
        <span className="flow-legend__item flow-legend__item--calculated">Calculated</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

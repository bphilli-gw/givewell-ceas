/**
 * Explore: VAS Counterfactual Coverage
 */

import { useState, useMemo } from 'react';
import { useVASCountryData } from '../../data/useVASCountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function VASExploreCoverage() {
  const { data, loading, error } = useVASCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No country data available</div>;

  const cc = country.supplementary.counterfactual_coverage;

  const tiers: FlowTier[] = [
    {
      id: 'routine',
      label: 'Routine VAS Delivery',
      annotation: 'VAS is often delivered alongside routine MCV1 vaccination. The coverage for each age group is estimated as MCV1 coverage multiplied by an age-specific VAS/MCV1 ratio.',
      nodes: (
        <>
          <FlowNode title="Routine VAS: 6-11 months" category="calculated" formula="MCV1 \u00D7 VAS/MCV1 ratio" values={[{ value: cc.routine_vas_6_11mo, format: 'percent' }]} />
          <FlowNode title="Routine VAS: 12-23 months" category="calculated" values={[{ value: cc.routine_vas_12_23mo, format: 'percent' }]} />
          <FlowNode title="Routine VAS: 2-4 years" category="calculated" values={[{ value: cc.routine_vas_2_4yr, format: 'percent' }]} />
        </>
      ),
    },
    {
      id: 'adjusted',
      label: 'Scale-Up Adjusted Coverage',
      annotation: 'A gradual scale-up adjustment accounts for programs that are ramping up and haven\'t yet reached full steady-state coverage.',
      nodes: (
        <>
          <FlowNode title="Adjusted: 6-11 months" category="calculated" formula="routine \u00D7 (1 + scale_up_adj)" values={[{ value: cc.adjusted_vas_6_11mo, format: 'percent' }]} />
          <FlowNode title="Adjusted: 12-23 months" category="calculated" values={[{ value: cc.adjusted_vas_12_23mo, format: 'percent' }]} />
          <FlowNode title="Adjusted: 2-4 years" category="calculated" values={[{ value: cc.adjusted_vas_2_4yr, format: 'percent' }]} />
        </>
      ),
    },
    {
      id: 'output',
      label: 'Weighted Counterfactual Coverage',
      annotation: 'The final counterfactual coverage is a weighted average across age groups, using GBD age proportions as weights (1/9 for 6-11mo, 2/9 for 12-23mo, 6/9 for 2-4yr).',
      nodes: (
        <>
          <FlowNode
            title="Counterfactual coverage"
            category="output"
            formula="SUMPRODUCT(adjusted \u00D7 age_weights)"
            values={[{ value: cc.counterfactual_coverage, format: 'percent' }]}
            annotation="Feeds into Main CEA \u2014 the proportion of children who would receive VAS without this program"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Counterfactual Coverage</h1>
      <div className="explore-ir__intro">
        <p><strong>How many children would receive VAS even without this program?</strong></p>
        <p>
          VAS is often delivered alongside routine measles vaccination (MCV1).
          This module estimates the proportion of children in each age group who
          would receive VAS through routine health services, then combines them
          into a weighted average.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="cc-country">Country</label>
          <select id="cc-country" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (<option key={c.id} value={c.id}>{c.display_name}</option>))}
          </select>
        </div>
      </div>
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--calculated">Calculated</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

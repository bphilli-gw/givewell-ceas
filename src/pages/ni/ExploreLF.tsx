/**
 * Explore: NI Leverage & Funging
 */

import { useState, useMemo } from 'react';
import { useNICountryData } from '../../data/useNICountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function NIExploreLF() {
  const { data, loading, error } = useNICountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No state data available</div>;

  const lf = country.supplementary.leverage_funging;

  const tiers: FlowTier[] = [
    {
      id: 'costs',
      label: 'Program Costs',
      annotation: 'NI leverages government (routine immunization system) and Gavi (vaccine procurement) co-funding. When NI enrolls outcome children, it triggers proportional government and Gavi spending.',
      nodes: (
        <>
          <FlowNode title="GiveWell spending" category="empirical" values={[{ value: lf.givewell_costs, format: 'number' }]} />
          <FlowNode title="Leveraged govt costs" category="calculated" formula={`${lf.gov_cost_per_child}/child \u00D7 ${Math.round(lf.outcome_children)} children`} values={[{ value: lf.leveraged_govt_costs, format: 'number' }]} />
          <FlowNode title="Leveraged Gavi costs" category="calculated" formula={`${lf.gavi_cost_per_child}/child \u00D7 ${Math.round(lf.outcome_children)} children`} values={[{ value: lf.leveraged_gavi_costs, format: 'number' }]} />
          <FlowNode title="Total program costs" category="calculated" values={[{ value: lf.total_costs, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'probabilities',
      label: 'Scenario Probabilities',
      annotation: 'NI uses a 2-scenario model. S1: a funder replaces GiveWell (funging). S2: remaining probability — leveraged spending is at risk.',
      nodes: (
        <>
          <FlowNode title="S1: Funder replaces" category="subjective" values={[{ value: lf.scenario1_prob, format: 'percent' }]} annotation="Probability another funder fills the gap" />
          <FlowNode title="S2: Remaining" category="calculated" formula="1 - S1" values={[{ value: lf.scenario2_prob, format: 'percent' }]} annotation="Leveraged govt/Gavi spending at risk" />
        </>
      ),
    },
    {
      id: 's1',
      label: 'Scenario 1: Grantee Displacement',
      annotation: 'If another funder replaces GiveWell, GiveWell\'s spending generates less additional value because the same program would run at lower (counterfactual) effectiveness.',
      nodes: (
        <>
          <FlowNode title="Program value" category="calculated" formula="spending \u00D7 adjusted_CE" values={[{ value: lf.s1_program_value, format: 'number' }]} />
          <FlowNode title="Counterfactual value" category="subjective" formula="spending \u00D7 govt_rate" values={[{ value: lf.s1_counterfactual_value, format: 'number' }]} />
          <FlowNode title="Funging" category="calculated" formula="-(program - counterfactual)" values={[{ value: lf.s1_funging, format: 'number' }]} />
          <FlowNode title={`Weighted (\u00D7${(lf.scenario1_prob * 100).toFixed(0)}%)`} category="calculated" values={[{ value: lf.s1_weighted, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 's2',
      label: 'Scenario 2: Leveraged Spending Displacement',
      annotation: 'If the program doesn\'t happen, government and Gavi co-funding is also lost. The counterfactual value of that spending (what it would have achieved elsewhere) determines the net loss.',
      nodes: (
        <>
          <FlowNode title="Govt spending at risk" category="calculated" values={[{ value: lf.s2_leveraged_govt, format: 'number' }]} />
          <FlowNode title="Govt counterfactual" category="subjective" values={[{ value: lf.s2_govt_counterfactual, format: 'number' }]} />
          <FlowNode title="Gavi spending at risk" category="calculated" values={[{ value: lf.s2_leveraged_gavi, format: 'number' }]} />
          <FlowNode title="Gavi counterfactual" category="subjective" values={[{ value: lf.s2_gavi_counterfactual, format: 'number' }]} />
          <FlowNode title={`Weighted (\u00D7${(lf.scenario2_prob * 100).toFixed(0)}%)`} category="calculated" values={[{ value: lf.s2_weighted, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'output',
      label: 'Total Displacement',
      nodes: (
        <>
          <FlowNode title="Grantee displacement" category="output" values={[{ value: lf.grantee_displacement, format: 'percent' }]} annotation="From S1 (funging)" />
          <FlowNode title="Leverage displacement" category="output" values={[{ value: lf.leverage_displacement, format: 'percent' }]} annotation="From S2 (co-funding at risk)" />
          <FlowNode title="Total displacement" category="output" values={[{ value: lf.total_displacement, format: 'percent' }]} annotation="Feeds into Main CEA as the leverage/funging adjustment" wide />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Leverage & Funging</h1>
      <div className="explore-ir__intro">
        <p><strong>How does NI funding interact with government and Gavi co-funding?</strong></p>
        <p>
          NI's leverage/funging model is unique: it explicitly tracks government
          (routine immunization) and Gavi (vaccine procurement) co-funding that
          is triggered by each outcome child. Two scenarios model what happens
          if GiveWell doesn't fund the grant: either another funder replaces
          (S1, funging) or the leveraged co-funding is lost (S2, leverage).
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="lf-state">State</label>
          <select id="lf-state" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
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

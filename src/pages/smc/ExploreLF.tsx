/**
 * Explore: SMC Leverage & Funging
 *
 * Shows the four funding displacement scenarios and how they combine
 * into leverage and funging adjustments for SMC.
 */

import { useState, useMemo } from 'react';
import { useSMCCountryData } from '../../data/useSMCCountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function SMCExploreLF() {
  const { data, loading, error } = useSMCCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No country data available</div>;

  const lf = country.supplementary.leverage_funging;
  const inputs = country.inputs.leverage_funging;

  const tiers: FlowTier[] = [
    {
      id: 'probabilities',
      label: 'Scenario Probabilities',
      annotation: 'Four mutually exclusive scenarios for what happens to funding if GiveWell does not fund this grant.',
      nodes: (
        <>
          <FlowNode title="Government replaces" category="subjective" values={[{ value: lf.prob_domestic, format: 'percent' }]} annotation="Funging \u2014 domestic government fills the gap" />
          <FlowNode title="Global Fund replaces" category="subjective" values={[{ value: lf.prob_global_fund, format: 'percent' }]} annotation="Funging \u2014 Global Fund fills the gap" />
          <FlowNode title="Upstream unchanged" category="subjective" values={[{ value: lf.prob_upstream_same, format: 'percent' }]} annotation="Leverage \u2014 other funders stay, government savings lost" />
          <FlowNode title="Goes unfunded" category="calculated" formula="1 - gov - GF - upstream" values={[{ value: lf.prob_unfunded, format: 'percent' }]} annotation="Leverage \u2014 no one fills the gap" />
        </>
      ),
    },
    {
      id: 'inputs',
      label: 'Key Inputs',
      nodes: (
        <>
          <FlowNode title="Adjusted UoV/$ rate" category="upstream" values={[{ value: lf.uov_per_dollar_adjusted }]} annotation="From Main CEA \u2014 value per dollar after grantee and intervention adjustments" />
          <FlowNode title="Baseline value" category="calculated" formula="grantee_spending \u00D7 adjusted_rate" values={[{ value: lf.baseline_value, format: 'number' }]} />
          <FlowNode
            title="Counterfactual effectiveness"
            category="subjective"
            values={[
              { label: 'Govt', value: inputs.counterfactual_domestic_gov },
              { label: 'Global Fund', value: inputs.counterfactual_global_fund },
            ]}
            annotation="How effective would replacement spending be (UoV/$)?"
          />
        </>
      ),
    },
    {
      id: 'scenarios',
      label: 'Weighted Scenario Impacts',
      annotation: 'Each scenario produces a value impact (positive = loss, negative = gain), weighted by its probability.',
      nodes: (
        <>
          <FlowNode title="A: Govt replaces" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_domestic * 100).toFixed(0)}%)`, value: lf.scenario_a_impact, format: 'number' }]} annotation="Funging" />
          <FlowNode title="B: GF replaces" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_global_fund * 100).toFixed(0)}%)`, value: lf.scenario_b_impact, format: 'number' }]} annotation="Funging" />
          <FlowNode title="C: Upstream same" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_upstream_same * 100).toFixed(0)}%)`, value: lf.scenario_c_impact, format: 'number' }]} annotation="Leverage" />
          <FlowNode title="D: Unfunded" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_unfunded * 100).toFixed(0)}%)`, value: lf.scenario_d_impact, format: 'number' }]} annotation="Leverage" />
        </>
      ),
    },
    {
      id: 'output',
      label: 'Combined Adjustment',
      nodes: (
        <>
          <FlowNode title="Leverage adjustment" category="output" formula="(C + D) / baseline" values={[{ value: lf.leverage_adj, format: 'percent' }]} annotation="Government co-funding attracted by GiveWell spending" />
          <FlowNode title="Funging adjustment" category="output" formula="(A + B) / baseline" values={[{ value: lf.funging_adj, format: 'percent' }]} annotation="Spending that would have happened without GiveWell" />
          <FlowNode title="Combined L&F" category="output" formula="leverage + funging" values={[{ value: lf.overall_adj, format: 'percent' }]} annotation="Feeds into Main CEA \u2014 multiplies the total value of outcomes" wide />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Leverage & Funging</h1>
      <div className="explore-ir__intro">
        <p><strong>What would happen to this grant's impact if GiveWell didn't fund it?</strong></p>
        <p>
          <strong>Leverage</strong> captures co-funding attracted by GiveWell's grant.
          <strong> Funging</strong> captures spending that would occur anyway from other sources.
          The net effect determines how much additional value GiveWell's funding creates.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="lf-country">Country</label>
          <select id="lf-country" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--empirical">Measured data</span>
        <span className="flow-legend__item flow-legend__item--subjective">Staff judgment</span>
        <span className="flow-legend__item flow-legend__item--calculated">Calculated</span>
        <span className="flow-legend__item flow-legend__item--upstream">From Main CEA</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

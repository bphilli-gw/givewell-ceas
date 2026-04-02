/**
 * Explore: VAS Leverage & Funging
 */

import { useState, useMemo } from 'react';
import { useVASCountryData } from '../../data/useVASCountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function VASExploreLF() {
  const { data, loading, error } = useVASCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No country data available</div>;

  const lf = country.supplementary.leverage_funging;

  const tiers: FlowTier[] = [
    {
      id: 'probabilities',
      label: 'Scenario Probabilities',
      annotation: 'VAS uses a 3-scenario model (plus a zero-probability S4). Each scenario represents a different outcome if GiveWell doesn\'t fund this grant.',
      nodes: (
        <>
          <FlowNode title="S1: Government replaces" category="subjective" values={[{ value: lf.prob_s1, format: 'percent' }]} annotation="Funging \u2014 government fills the gap" />
          <FlowNode title="S2: Philanthropy replaces" category="subjective" values={[{ value: lf.prob_s2, format: 'percent' }]} annotation="Funging \u2014 other philanthropic actors fill the gap" />
          <FlowNode title="S3: Program shrinks" category="calculated" formula="1 - S1 - S2" values={[{ value: lf.prob_s3, format: 'percent' }]} annotation="Leverage \u2014 program scales down without GiveWell funding" />
        </>
      ),
    },
    {
      id: 'inputs',
      label: 'Key Inputs',
      nodes: (
        <>
          <FlowNode title="UoV/$ (post-adjustment)" category="upstream" values={[{ value: lf.uov_per_dollar_post_adj }]} annotation="From Main CEA" />
          <FlowNode title="Value before L&F" category="calculated" values={[{ value: lf.value_before_lf, format: 'number' }]} />
          <FlowNode title="Lives saved (post-adj)" category="upstream" values={[{ value: lf.lives_saved_post_adj, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'scenarios',
      label: 'Weighted Scenario Impacts',
      nodes: (
        <>
          <FlowNode title="S1: Govt replaces" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_s1 * 100).toFixed(0)}%)`, value: lf.s1_weighted_change, format: 'number' }]} />
          <FlowNode title="S2: Philanthropy replaces" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_s2 * 100).toFixed(0)}%)`, value: lf.s2_weighted_change, format: 'number' }]} />
          <FlowNode title="S3: Program shrinks" category="calculated" values={[{ label: `Weighted (\u00D7${(lf.prob_s3 * 100).toFixed(0)}%)`, value: lf.s3_weighted_change, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'output',
      label: 'Combined Adjustment',
      nodes: (
        <>
          <FlowNode title="Leverage adjustment" category="output" values={[{ value: lf.leverage_adj, format: 'percent' }]} annotation="From program shrinkage scenario" />
          <FlowNode title="Funging adjustment" category="output" values={[{ value: lf.funging_adj, format: 'percent' }]} annotation="From government and philanthropy replacement" />
          <FlowNode title="Combined L&F" category="output" values={[{ value: lf.total_lf_adj, format: 'percent' }]} annotation="Feeds into Main CEA" wide />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Leverage & Funging</h1>
      <div className="explore-ir__intro">
        <p><strong>How does GiveWell's VAS funding interact with other actors?</strong></p>
        <p>
          The VAS model uses three scenarios: government replacement,
          philanthropic replacement, or program shrinkage. The net adjustment
          determines how much additional value GiveWell funding creates beyond
          what would happen anyway.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="lf-country">Country</label>
          <select id="lf-country" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (<option key={c.id} value={c.id}>{c.display_name}</option>))}
          </select>
        </div>
      </div>
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--subjective">Staff judgment</span>
        <span className="flow-legend__item flow-legend__item--calculated">Calculated</span>
        <span className="flow-legend__item flow-legend__item--upstream">From Main CEA</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

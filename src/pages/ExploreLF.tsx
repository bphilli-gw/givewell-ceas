/**
 * Explore: Leverage & Funging
 *
 * Shows the four funding displacement scenarios and how they combine
 * into the leverage and funging adjustments.
 */

import { useState, useMemo } from 'react';
import { useCountryData } from '../data/useCountryData';
import FlowDiagram from '../components/FlowDiagram';
import type { FlowTier } from '../components/FlowDiagram';
import FlowNode from '../components/FlowNode';

export default function ExploreLF() {
  const { data, loading, error } = useCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  // Compute L&F intermediates
  const lf = useMemo(() => {
    if (!country) return null;
    const inputs = country.inputs.leverage_funging;
    const r = country.results;
    const cost = country.inputs.cost;

    // Spending breakdown
    const totalSpending = cost.grant_size / cost.pct_cost_grantee;
    const granteeSpending = cost.pct_cost_grantee * totalSpending;
    const otherSpending = cost.pct_cost_other_philanthropic * totalSpending;
    const govSpending = cost.pct_cost_domestic_gov * totalSpending;
    const upstreamSpending = granteeSpending + otherSpending;

    // Adjusted value rate
    const adjRate = r.uov_per_dollar * (1 + r.grantee_adj_total) * (1 + r.intervention_adj_total);

    // Proportions
    const otherProportion = upstreamSpending > 0 ? otherSpending / upstreamSpending : 0;

    // Probabilities
    const probGov = inputs.prob_domestic_gov_replaces;
    const probGF = inputs.prob_global_fund_replaces;
    const probUpstream = inputs.prob_upstream_same;
    const probUnfunded = 1 - probGov - probGF - probUpstream;

    // Scenario A: Government replaces (funging)
    const valueA = granteeSpending * adjRate;
    const cfA = granteeSpending * inputs.counterfactual_domestic_gov;
    const netA = valueA - cfA;
    const impactA = -netA;
    const weightedA = impactA * probGov;

    // Scenario B: Global Fund replaces (funging)
    const valueB = granteeSpending * adjRate;
    const cfB = granteeSpending * inputs.counterfactual_global_fund;
    const netB = valueB - cfB;
    const impactB = -netB;
    const weightedB = impactB * probGF;

    // Scenario C: Upstream stays same (leverage)
    const govSpendingC = govSpending * (1 - otherProportion);
    const valueC = govSpendingC * inputs.counterfactual_domestic_gov;
    const impactC = -valueC;
    const weightedC = impactC * probUpstream;

    // Scenario D: Goes unfunded (leverage)
    const valueD = govSpending * inputs.counterfactual_domestic_gov;
    const impactD = -valueD;
    const weightedD = impactD * probUnfunded;

    // Aggregation
    const baseline = granteeSpending * adjRate;
    const leverage = weightedC + weightedD;
    const funging = weightedA + weightedB;
    const combined = leverage + funging;

    const leverageAdj = baseline !== 0 ? leverage / baseline : 0;
    const fungingAdj = baseline !== 0 ? funging / baseline : 0;

    return {
      inputs,
      granteeSpending, otherSpending, govSpending,
      adjRate, otherProportion,
      probGov, probGF, probUpstream, probUnfunded,
      valueA, cfA, netA, impactA, weightedA,
      valueB, cfB, netB, impactB, weightedB,
      govSpendingC, valueC, impactC, weightedC,
      valueD, impactD, weightedD,
      baseline, leverage, funging, combined,
      leverageAdj, fungingAdj,
    };
  }, [country]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country || !lf) return <div className="error">No country data available</div>;

  const tiers: FlowTier[] = [
    {
      id: 'probabilities',
      label: 'Scenario Probabilities',
      annotation: 'GiveWell estimates the probability of four mutually exclusive scenarios describing what would happen to funding if GiveWell did not fund this grant.',
      nodes: (
        <>
          <FlowNode
            title="Government replaces"
            category="subjective"
            values={[{ value: lf.probGov, format: 'percent' }]}
            annotation="Domestic government fills the gap — reduces value (funging)"
          />
          <FlowNode
            title="Global Fund replaces"
            category="subjective"
            values={[{ value: lf.probGF, format: 'percent' }]}
            annotation="Global Fund fills the gap — reduces value (funging)"
          />
          <FlowNode
            title="Upstream unchanged"
            category="subjective"
            values={[{ value: lf.probUpstream, format: 'percent' }]}
            annotation="Other upstream funders maintain spending — government savings are lost (leverage)"
          />
          <FlowNode
            title="Goes unfunded"
            category="calculated"
            formula="1 - gov - GF - upstream"
            values={[{ value: lf.probUnfunded, format: 'percent' }]}
            annotation="No one fills the gap — government co-funding is also lost (leverage)"
          />
        </>
      ),
    },
    {
      id: 'inputs',
      label: 'Key Inputs',
      nodes: (
        <>
          <FlowNode
            title="GiveWell spending"
            category="empirical"
            values={[{ value: lf.granteeSpending, format: 'number' }]}
          />
          <FlowNode
            title="Adjusted UoV/$ rate"
            category="upstream"
            formula="uov_per_dollar \u00D7 (1+grantee_adj) \u00D7 (1+intervention_adj)"
            values={[{ value: lf.adjRate }]}
            annotation="From Main CEA — value per dollar after grantee and intervention adjustments"
          />
          <FlowNode
            title="Counterfactual UoV/$"
            category="subjective"
            values={[
              { label: 'Govt', value: lf.inputs.counterfactual_domestic_gov },
              { label: 'Global Fund', value: lf.inputs.counterfactual_global_fund },
            ]}
            annotation="How effective would replacement spending be?"
          />
        </>
      ),
    },
    {
      id: 'funging',
      label: 'Funging Scenarios (Crowding Out)',
      annotation: 'When other funders replace GiveWell\'s spending, GiveWell\'s contribution produces less additional value because the same outcome would have occurred anyway (at lower effectiveness).',
      nodes: (
        <>
          <FlowNode
            title="A: Government replaces"
            category="calculated"
            values={[
              { label: 'GW value', value: lf.valueA, format: 'number' },
              { label: 'Counterfactual', value: lf.cfA, format: 'number' },
              { label: 'Net lost', value: lf.impactA, format: 'number' },
              { label: `Weighted (\u00D7${(lf.probGov * 100).toFixed(0)}%)`, value: lf.weightedA, format: 'number' },
            ]}
          />
          <FlowNode
            title="B: Global Fund replaces"
            category="calculated"
            values={[
              { label: 'GW value', value: lf.valueB, format: 'number' },
              { label: 'Counterfactual', value: lf.cfB, format: 'number' },
              { label: 'Net lost', value: lf.impactB, format: 'number' },
              { label: `Weighted (\u00D7${(lf.probGF * 100).toFixed(0)}%)`, value: lf.weightedB, format: 'number' },
            ]}
          />
        </>
      ),
    },
    {
      id: 'leverage',
      label: 'Leverage Scenarios (Crowding In)',
      annotation: 'When the grant goes unfunded, government co-funding is also lost. This means GiveWell\'s spending "leverages" additional government spending that wouldn\'t happen otherwise.',
      nodes: (
        <>
          <FlowNode
            title="C: Upstream unchanged"
            category="calculated"
            values={[
              { label: 'Govt at risk', value: lf.govSpendingC, format: 'number' },
              { label: 'Value lost', value: lf.valueC, format: 'number' },
              { label: `Weighted (\u00D7${(lf.probUpstream * 100).toFixed(0)}%)`, value: lf.weightedC, format: 'number' },
            ]}
            annotation="Government stops co-funding but other philanthropic funders stay"
          />
          <FlowNode
            title="D: Goes unfunded"
            category="calculated"
            values={[
              { label: 'Govt spending lost', value: lf.govSpending, format: 'number' },
              { label: 'Value lost', value: lf.valueD, format: 'number' },
              { label: `Weighted (\u00D7${(lf.probUnfunded * 100).toFixed(0)}%)`, value: lf.weightedD, format: 'number' },
            ]}
            annotation="All co-funding disappears — maximum leverage effect"
          />
        </>
      ),
    },
    {
      id: 'output',
      label: 'Combined Adjustment',
      annotation: 'The final adjustments are expressed as a percentage of the baseline value. Leverage is typically positive (GiveWell spending attracts co-funding), funging is typically negative (some spending would happen anyway).',
      nodes: (
        <>
          <FlowNode
            title="Baseline value"
            category="calculated"
            formula="grantee_spending \u00D7 adjusted_rate"
            values={[{ value: lf.baseline, format: 'number' }]}
          />
          <FlowNode
            title="Leverage adjustment"
            category="output"
            formula="(weighted_C + weighted_D) / baseline"
            values={[{ value: lf.leverageAdj, format: 'percent' }]}
            annotation="Positive = GiveWell spending attracts additional co-funding"
          />
          <FlowNode
            title="Funging adjustment"
            category="output"
            formula="(weighted_A + weighted_B) / baseline"
            values={[{ value: lf.fungingAdj, format: 'percent' }]}
            annotation="Negative = some spending would have happened without GiveWell"
          />
          <FlowNode
            title="Combined L&F"
            category="output"
            formula="leverage + funging"
            values={[{ value: lf.leverageAdj + lf.fungingAdj, format: 'percent' }]}
            annotation="Feeds into Main CEA — multiplies the total value of outcomes"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Leverage & Funging</h1>
      <div className="explore-ir__intro">
        <p>
          <strong>What would happen to this grant's impact if GiveWell didn't fund it?</strong>
        </p>
        <p>
          <strong>Leverage</strong> captures the co-funding that GiveWell's grant attracts:
          if the grant doesn't happen, government co-funding may also disappear.
          <strong> Funging</strong> captures the opposite: other funders might fill the gap,
          meaning GiveWell's spending is partially redundant.
        </p>
        <p>
          GiveWell models four scenarios — government replacement, Global Fund
          replacement, upstream unchanged, and unfunded — weighted by
          estimated probabilities, to produce the net leverage and funging
          adjustments.
        </p>
      </div>

      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="lf-country">Country</label>
          <select
            id="lf-country"
            value={country.id}
            onChange={(e) => setCountryId(e.target.value)}
          >
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

/**
 * Explore: NI Income & Cash Transfers
 */

import { useState, useMemo } from 'react';
import { useNICountryData } from '../../data/useNICountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function NIExploreIncome() {
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
  const o = country.inputs.outcomes;

  const tiers: FlowTier[] = [
    {
      id: 'income',
      label: 'Income Effects from Reduced Disease',
      annotation: 'Children who avoid vaccine-preventable diseases have better long-term health outcomes, which translates to higher lifetime income. The ratio is calibrated relative to SMC malaria income estimates.',
      nodes: (
        <>
          <FlowNode title="Income ratio" category="subjective" values={[{ value: o.income_ratio }]} annotation="Ratio of income increase per vaccination vs. per malaria case averted" />
          <FlowNode title="Income adj vs SMC" category="subjective" values={[{ value: o.income_adj_vs_smc, format: 'percent' }]} />
          <FlowNode title="Under-5 value" category="calculated" values={[{ value: r.value_u5, format: 'number' }]} />
          <FlowNode title="5-14 value" category="calculated" values={[{ value: r.value_5to14, format: 'number' }]} />
          <FlowNode title="Income value" category="output" values={[{ value: r.income_value, format: 'number' }]} annotation="Total income value from reduced morbidity across age bands" wide />
        </>
      ),
    },
    {
      id: 'cash',
      label: 'Cash Transfer Value',
      annotation: 'NI gives direct cash transfers to families as incentives for vaccination visits. This has independent welfare value for poor households — it\'s like a small GiveDirectly transfer bundled with the vaccination program.',
      nodes: (
        <>
          <FlowNode
            title="Cash transfer value"
            category="output"
            values={[{ value: r.cash_transfer_value, format: 'number' }]}
            annotation="Valued using GiveWell's standard consumption-based welfare framework"
            wide
          />
        </>
      ),
    },
    {
      id: 'total',
      label: 'Combined Non-Mortality Value',
      annotation: 'These income and cash transfer values are added to the mortality DALYs to produce the total value of outcomes before adjustments.',
      nodes: (
        <>
          <FlowNode
            title="Non-mortality components"
            category="output"
            values={[
              { label: 'Income', value: r.income_value, format: 'number' },
              { label: 'Cash transfers', value: r.cash_transfer_value, format: 'number' },
              { label: 'Total', value: r.income_value + r.cash_transfer_value, format: 'number' },
            ]}
            annotation="Combined with DALYs in Main CEA to produce total value of outcomes"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Income & Cash Transfers</h1>
      <div className="explore-ir__intro">
        <p><strong>What value comes from income effects and cash transfers?</strong></p>
        <p>
          Beyond mortality reduction, NI produces two additional value streams:
          long-term income gains from healthier children, and the direct welfare
          value of cash transfers to participating families.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="inc-state">State</label>
          <select id="inc-state" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (<option key={c.id} value={c.id}>{c.state}</option>))}
          </select>
        </div>
      </div>
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--subjective">Staff judgment</span>
        <span className="flow-legend__item flow-legend__item--calculated">Calculated</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

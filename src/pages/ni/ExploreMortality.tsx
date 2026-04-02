/**
 * Explore: NI Age-Band Mortality
 */

import { useState, useMemo } from 'react';
import { useNICountryData } from '../../data/useNICountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function NIExploreMortality() {
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
      id: 'u5',
      label: 'Under-5 Mortality',
      annotation: 'The primary impact age group. VPD mortality is adjusted for GBD coverage, multiplied by vaccine efficacy, and combined with indirect mortality effects.',
      nodes: (
        <>
          <FlowNode title="VPD total (adjusted)" category="empirical" values={[{ value: r.vpd_total_adj_u5 }]} />
          <FlowNode title="GBD adjustment" category="calculated" values={[{ value: r.gbd_adj_u5, format: 'percent' }]} />
          <FlowNode title="Incidence averted" category="calculated" values={[{ value: r.incidence_averted_u5, format: 'percent' }]} />
          <FlowNode title="DALYs (direct)" category="output" values={[{ value: r.daly_u5, format: 'number' }]} />
          <FlowNode title="DALYs (indirect)" category="output" values={[{ value: r.daly_u5_indirect, format: 'number' }]} annotation={`Indirect ratio: ${o.indirect_mort_ratio}`} />
        </>
      ),
    },
    {
      id: '5to14',
      label: 'Ages 5-14',
      annotation: 'Vaccine protection extends beyond age 5. Coverage, efficacy, and disease burden are each adjusted for this older age group, and DALYs are discounted.',
      nodes: (
        <>
          <FlowNode title="Unvaccinated probability" category="calculated" values={[{ value: r.unvacc_prob_5to14 }]} />
          <FlowNode title="GBD adjustment" category="calculated" values={[{ value: r.gbd_adj_5to14, format: 'percent' }]} />
          <FlowNode title="With indirect mortality" category="calculated" values={[{ value: r.indirect_mort_5to14 }]} />
          <FlowNode title="DALYs (undiscounted)" category="calculated" values={[{ value: r.daly_5to14, format: 'number' }]} />
          <FlowNode title="DALYs (discounted)" category="output" formula={`\u00F7 (1 + ${o.discount_rate})^${o.avg_years_5to14}`} values={[{ value: r.daly_5to14_discounted, format: 'number' }]} />
        </>
      ),
    },
    {
      id: '15to49',
      label: 'Ages 15-49',
      nodes: (
        <>
          <FlowNode title="Unvaccinated probability" category="calculated" values={[{ value: r.unvacc_prob_15to49 }]} />
          <FlowNode title="With indirect mortality" category="calculated" values={[{ value: r.indirect_mort_15to49 }]} />
          <FlowNode title="DALYs (discounted)" category="output" formula={`\u00F7 (1 + ${o.discount_rate})^${o.avg_years_15to49}`} values={[{ value: r.daly_15to49_discounted, format: 'number' }]} />
        </>
      ),
    },
    {
      id: '50to74',
      label: 'Ages 50-74',
      nodes: (
        <>
          <FlowNode title="Unvaccinated probability" category="calculated" values={[{ value: r.unvacc_prob_50to74 }]} />
          <FlowNode title="With indirect mortality" category="calculated" values={[{ value: r.indirect_mort_50to74 }]} />
          <FlowNode title="DALYs (discounted)" category="output" formula={`\u00F7 (1 + ${o.discount_rate})^${o.avg_years_50to74}`} values={[{ value: r.daly_50to74_discounted, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'total',
      label: 'Total DALYs',
      annotation: 'Sum across all age bands. Under-5 includes both direct and indirect mortality. Older age bands are discounted to present value.',
      nodes: (
        <>
          <FlowNode
            title="Total DALYs by age band"
            category="output"
            values={[
              { label: 'Under-5 (direct)', value: r.daly_u5_total, format: 'number' },
              { label: 'Under-5 (indirect)', value: r.daly_u5_indirect_total, format: 'number' },
              { label: '5-14 (disc)', value: r.daly_5to14_disc, format: 'number' },
              { label: '15-49 (disc)', value: r.daly_15to49_disc, format: 'number' },
              { label: '50-74 (disc)', value: r.daly_50to74_disc, format: 'number' },
            ]}
            annotation="Feeds into Main CEA value calculation"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Age-Band Mortality</h1>
      <div className="explore-ir__intro">
        <p><strong>How are mortality benefits calculated across age groups?</strong></p>
        <p>
          Childhood vaccination protects beyond age 5 — some vaccines (BCG, measles)
          provide decades of protection. The NI model calculates DALYs for four age
          bands, each with age-specific adjustments for coverage degradation, reduced
          efficacy, and time discounting.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="mort-state">State</label>
          <select id="mort-state" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (<option key={c.id} value={c.id}>{c.state}</option>))}
          </select>
        </div>
      </div>
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--empirical">Measured data</span>
        <span className="flow-legend__item flow-legend__item--calculated">Calculated</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

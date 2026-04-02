/**
 * Explore: VAS Counterfactual Mortality
 */

import { useState, useMemo } from 'react';
import { useVASCountryData } from '../../data/useVASCountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function VASExploreMortality() {
  const { data, loading, error } = useVASCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No country data available</div>;

  const cm = country.supplementary.counterfactual_mortality;
  const mort = country.inputs.mortality;

  const tiers: FlowTier[] = [
    {
      id: 'inputs',
      label: 'GBD Mortality Data',
      annotation: 'Under-5 malaria deaths from GBD, broken down by age. VAS is targeted at children 6 months to 5 years, so neonatal and very young infant deaths are excluded.',
      nodes: (
        <>
          <FlowNode title="Total under-5 deaths" category="empirical" values={[{ value: mort.total_mort_u5, format: 'number' }]} />
          <FlowNode title="Neonatal deaths" category="empirical" values={[{ value: mort.total_neonatal_mort, format: 'number' }]} />
          <FlowNode title="Deaths: 1-5 months" category="empirical" values={[{ value: mort.total_mort_1to5mo, format: 'number' }]} />
          <FlowNode title="Under-1 deaths" category="empirical" values={[{ value: mort.total_mort_u1, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'eligible',
      label: 'VAS-Eligible Deaths',
      annotation: 'Filter to deaths among children eligible for VAS (typically 6-59 months). Country-specific rules apply \u2014 Cameroon excludes under-1; others exclude neonatal and 1-5 month deaths.',
      nodes: (
        <>
          <FlowNode title="Eligible deaths" category="calculated" values={[{ value: cm.deaths_vas_eligible, format: 'number' }]} />
          <FlowNode title="Proportion of u5 deaths eligible" category="calculated" values={[{ value: cm.proportion_u5_deaths_vas_eligible, format: 'percent' }]} />
        </>
      ),
    },
    {
      id: 'population',
      label: 'Eligible Population',
      nodes: (
        <>
          <FlowNode title="Implied u5 population" category="calculated" formula="deaths / (rate_per_100k / 100000)" values={[{ value: cm.implied_u5_population, format: 'number' }]} />
          <FlowNode title="VAS-eligible population" category="calculated" formula="implied_u5 \u00D7 proportion_eligible" values={[{ value: cm.vas_eligible_population, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'rate',
      label: 'Mortality Rate',
      annotation: 'The annual mortality rate among VAS-eligible children, adjusted for systematic differences between GBD estimates and other data sources.',
      nodes: (
        <>
          <FlowNode title="Raw mortality rate" category="calculated" formula="eligible_deaths / eligible_population" values={[{ value: cm.annual_mort_rate_vas_eligible }]} />
          <FlowNode title="GBD vs. other adj" category="subjective" values={[{ value: mort.adj_gbd_vs_other, format: 'percent' }]} />
          {mort.adj_national_vs_subnational != null && (
            <FlowNode title="Subnational adj" category="subjective" values={[{ value: mort.adj_national_vs_subnational, format: 'percent' }]} />
          )}
          <FlowNode title="Adjusted mortality rate" category="calculated" formula="raw \u00D7 (1 + adj)\u00B2" values={[{ value: cm.adjusted_mort_rate }]} />
        </>
      ),
    },
    {
      id: 'output',
      label: 'Mortality During VAS Period',
      annotation: 'Only a fraction of annual mortality occurs during the VAS supplementation period. The proportion depends on how many rounds per year are administered.',
      nodes: (
        <>
          <FlowNode title="Proportion during VAS period" category="calculated" formula="rounds / 2" values={[{ value: cm.proportion_mort_during_vas_period, format: 'percent' }]} />
          <FlowNode
            title="Mortality during VAS period"
            category="output"
            formula="adjusted_rate \u00D7 proportion"
            values={[{ value: cm.mortality_during_vas_period }]}
            annotation="Feeds into Main CEA \u2014 the mortality rate used for deaths-averted calculation"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Counterfactual Mortality</h1>
      <div className="explore-ir__intro">
        <p><strong>What is the baseline mortality rate among VAS-eligible children?</strong></p>
        <p>
          This module filters GBD under-5 death data to the VAS-eligible age
          range (typically 6-59 months), computes the implied population, and
          calculates an adjusted mortality rate for the VAS supplementation period.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="cm-country">Country</label>
          <select id="cm-country" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
            {data.countries.map((c) => (<option key={c.id} value={c.id}>{c.display_name}</option>))}
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

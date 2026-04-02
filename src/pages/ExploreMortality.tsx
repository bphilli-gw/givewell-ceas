/**
 * Explore: Malaria Mortality
 *
 * Shows how country-specific malaria mortality rates are constructed
 * from GBD data and adjusted for SMC, vaccines, and local factors.
 */

import { useState, useMemo } from 'react';
import { useCountryData } from '../data/useCountryData';
import FlowDiagram from '../components/FlowDiagram';
import type { FlowTier } from '../components/FlowDiagram';
import FlowNode from '../components/FlowNode';
import { ITN_MORTALITY_GRAPH } from '../model/dependency-graph';
import { useDependencyHighlight } from '../hooks/useDependencyHighlight';

export default function ExploreMortality() {
  const { data, loading, error } = useCountryData();
  const [countryId, setCountryId] = useState<string>('');
  const h = useDependencyHighlight(ITN_MORTALITY_GRAPH);

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  // Compute intermediates from raw inputs
  const mort = useMemo(() => {
    if (!country) return null;
    const pop = country.inputs.population;
    const m = country.inputs.mortality;
    const supp = country.supplementary.malaria_mortality;

    // Population intermediates
    const pop12_59 = pop.under5 - pop.under1;
    const pop1_59 = pop.age_1_5_months + pop.age_6_11_months + pop12_59;

    // Death count intermediates
    const deaths12_59 = m.mort_under5 - m.mort_under1;
    const deaths1_59 = m.mort_1_5_months + m.mort_6_11_months + deaths12_59;

    // Raw mortality rate
    const rawRate = pop1_59 > 0 ? deaths1_59 / pop1_59 : 0;
    const baseRate = m.mortality_rate_override ?? rawRate;

    // SMC intermediates
    const smcProportion = m.smc_geographic_proportion ?? 1.0;
    const smcReduction = smcProportion * m.smc_deaths_averted / 1000;

    // Age ratio intermediates
    const deathsOver5 = m.gbd_mort_all_ages - m.gbd_mort_under5;
    const ratioLocation = m.gbd_mort_under5 > 0 ? deathsOver5 / m.gbd_mort_under5 : 0;

    return {
      pop, m, supp,
      pop12_59, pop1_59,
      deaths12_59, deaths1_59,
      rawRate, baseRate,
      smcProportion, smcReduction,
      deathsOver5, ratioLocation,
      hasOverride: m.mortality_rate_override != null,
    };
  }, [country]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country || !mort) return <div className="error">No country data available</div>;

  const tiers: FlowTier[] = [
    {
      id: 'population',
      label: 'Target Population',
      annotation: 'The target age group for malaria mortality is 1-59 months (roughly 1 month to 5 years). Neonates under 1 month are excluded because malaria is rarely the cause of death at that age.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('pop_u5')}
            title="Under-5 population"
            category="empirical"
            values={[{ value: mort.pop.under5, format: 'number' }]}
            annotation="GBD 2021 estimate"
          />
          <FlowNode
            {...h.propsFor('pop_u1')}
            title="Under-1 population"
            category="empirical"
            values={[{ value: mort.pop.under1, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('pop_1_5mo')}
            title="Age 1-5 months"
            category="empirical"
            values={[{ value: mort.pop.age_1_5_months, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('pop_6_11mo')}
            title="Age 6-11 months"
            category="empirical"
            values={[{ value: mort.pop.age_6_11_months, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('pop_target')}
            title="Target: 1-59 months"
            category="calculated"
            formula="1-5mo + 6-11mo + (u5 - u1)"
            values={[{ value: mort.pop1_59, format: 'number' }]}
          />
        </>
      ),
    },
    {
      id: 'deaths',
      label: 'Malaria Deaths (GBD)',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('deaths_1_5mo')}
            title="Deaths: 1-5 months"
            category="empirical"
            values={[{ value: mort.m.mort_1_5_months, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('deaths_6_11mo')}
            title="Deaths: 6-11 months"
            category="empirical"
            values={[{ value: mort.m.mort_6_11_months, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('deaths_u5')}
            title="Deaths: under-5 total"
            category="empirical"
            values={[{ value: mort.m.mort_under5, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('deaths_1_59')}
            title="Deaths: 1-59 months"
            category="calculated"
            formula="1-5mo + 6-11mo + (u5 - u1)"
            values={[{ value: mort.deaths1_59, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('raw_rate')}
            title="Raw mortality rate"
            category="calculated"
            formula="deaths_1-59 / pop_1-59"
            values={[{ value: mort.rawRate }]}
            annotation={mort.hasOverride ? 'Not used — this country has a subnational override' : 'Used as the base rate for adjustments'}
          />
        </>
      ),
    },
    {
      id: 'adjustments',
      label: 'Mortality Adjustments',
      annotation: 'The raw rate is adjusted for factors that make GBD estimates systematically too high or too low for the specific distribution area.',
      nodes: (
        <>
          {mort.hasOverride && (
            <FlowNode
              {...h.propsFor('subnational_override')}
              title="Subnational override"
              category="empirical"
              values={[{ value: mort.m.mortality_rate_override!, format: 'number' }]}
              annotation="Pre-computed subnational rate (used instead of raw GBD)"
            />
          )}
          <FlowNode
            {...h.propsFor('all_cause_adj')}
            title="All-cause mortality adj"
            category="subjective"
            values={[{ value: mort.m.all_cause_mort_adjustment, format: 'percent' }]}
            annotation="Adjusts for overall mortality level differences"
          />
          <FlowNode
            {...h.propsFor('malaria_share_adj')}
            title="Malaria share adj"
            category="subjective"
            values={[{ value: mort.m.malaria_share_adjustment, format: 'percent' }]}
            annotation="Adjusts for malaria's share of total deaths"
          />
          <FlowNode
            {...h.propsFor('rurality_adj')}
            title="Rurality adj"
            category="subjective"
            values={[{ value: mort.m.rurality_adjustment, format: 'percent' }]}
            annotation="Rural areas typically have higher malaria burden"
          />
          <FlowNode
            {...h.propsFor('subnational_adj')}
            title="Subnational adj"
            category="subjective"
            values={[{ value: mort.m.subnational_mort_adjustment, format: 'percent' }]}
            annotation="Adjusts for subnational variation within the country"
          />
        </>
      ),
    },
    {
      id: 'baseline-rate',
      label: 'Baseline Mortality Rate',
      annotation: 'The adjusted mortality rate represents the probability that a child aged 1-59 months dies from malaria in this location, accounting for local conditions.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('baseline_rate')}
            title="Baseline mortality rate"
            category="output"
            formula="base_rate \u00D7 (1+adj)\u2074"
            values={[{ value: mort.supp.baseline_mortality_rate }]}
            annotation="Feeds into Main CEA row 98 — the foundation for deaths-averted calculations"
            wide
          />
        </>
      ),
    },
    {
      id: 'smc',
      label: 'SMC Adjustment',
      annotation: 'Seasonal Malaria Chemoprevention (SMC) reduces malaria mortality in some areas. Part of this effect is already captured in GBD estimates, so we only count the portion not already reflected.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('smc_geo')}
            title="SMC geographic overlap"
            category="empirical"
            values={[{ value: mort.smcProportion, format: 'percent' }]}
            annotation="Proportion of ITN distribution area also covered by SMC"
          />
          <FlowNode
            {...h.propsFor('smc_averted')}
            title="SMC deaths averted"
            category="empirical"
            values={[{ value: mort.m.smc_deaths_averted }]}
            annotation="Per 1,000 children treated"
          />
          <FlowNode
            {...h.propsFor('smc_gbd')}
            title="SMC in GBD"
            category="subjective"
            values={[{ value: mort.m.smc_gbd_coverage, format: 'percent' }]}
            annotation="Proportion of SMC effect already captured in GBD estimates"
          />
          <FlowNode
            {...h.propsFor('smc_adj')}
            title="Net SMC adjustment"
            category="output"
            formula="overlap \u00D7 averted/1000 \u00D7 (1 - GBD_coverage)"
            values={[{ value: mort.supp.smc_adjustment }]}
            annotation="Additional mortality reduction from SMC not in GBD — feeds into Main CEA row 101"
          />
        </>
      ),
    },
    {
      id: 'age-ratio',
      label: '5+ Mortality Ratio',
      annotation: 'ITN trials measured mortality reduction for children under 5. To estimate the impact on older ages, GiveWell uses a weighted ratio of over-5 to under-5 malaria deaths.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('gbd_all_ages')}
            title="GBD deaths: all ages"
            category="empirical"
            values={[{ value: mort.m.gbd_mort_all_ages, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('gbd_u5')}
            title="GBD deaths: under 5"
            category="empirical"
            values={[{ value: mort.m.gbd_mort_under5, format: 'number' }]}
          />
          <FlowNode
            {...h.propsFor('local_ratio')}
            title="Local 5+/u5 ratio"
            category="calculated"
            formula="(all_ages - u5) / u5"
            values={[{ value: mort.ratioLocation }]}
          />
          <FlowNode
            {...h.propsFor('source_weights')}
            title="Source weights"
            category="subjective"
            values={[
              { label: 'Local GBD', value: mort.m.weight_gbd_local, format: 'percent' },
              { label: 'Global GBD', value: mort.m.weight_gbd_global, format: 'percent' },
              { label: 'WHO', value: mort.m.weight_who, format: 'percent' },
            ]}
          />
          <FlowNode
            {...h.propsFor('weighted_ratio')}
            title="Weighted 5+ ratio"
            category="output"
            formula="local\u00D7wt + global_gbd\u00D7wt + who\u00D7wt"
            values={[{ value: mort.supp.mortality_ratio_5plus }]}
            annotation="Feeds into Main CEA row 113 — scales under-5 deaths averted to estimate over-5 impact"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Malaria Mortality</h1>
      <div className="explore-ir__intro">
        <p>
          <strong>How are country-specific malaria mortality rates constructed?</strong>
        </p>
        <p>
          Malaria mortality varies enormously by location. GiveWell constructs
          each country's baseline rate from Global Burden of Disease (GBD)
          estimates, then adjusts for local factors: subnational variation,
          rurality, and the share of deaths attributable to malaria.
        </p>
        <p>
          This module also estimates the SMC adjustment (how much seasonal
          chemoprevention reduces mortality beyond what GBD already captures)
          and the age mortality ratio (how to extrapolate under-5 mortality
          reductions to older populations).
        </p>
      </div>

      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="mort-country">Country</label>
          <select
            id="mort-country"
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
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>

      <FlowDiagram tiers={tiers} />
    </div>
  );
}

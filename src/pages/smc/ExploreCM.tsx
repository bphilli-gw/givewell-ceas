/**
 * Explore: SMC Counterfactual Malaria
 *
 * Shows how baseline malaria mortality and incidence rates are
 * constructed for the SMC-eligible population (3-59 months).
 */

import { useState, useMemo } from 'react';
import { useSMCCountryData } from '../../data/useSMCCountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function SMCExploreCM() {
  const { data, loading, error } = useSMCCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No country data available</div>;

  const cm = country.supplementary.counterfactual_malaria;

  const tiers: FlowTier[] = [
    {
      id: 'mortality-inputs',
      label: 'GBD Mortality Data',
      annotation: 'Malaria deaths from the Global Burden of Disease, broken down by age group. SMC targets children 3-59 months, so we need to exclude neonates and very young infants.',
      nodes: (
        <>
          <FlowNode title="Deaths: under-5 total" category="empirical" values={[{ value: cm.mort_under5, format: 'number' }]} />
          <FlowNode title="Deaths: early neonatal" category="empirical" values={[{ value: cm.mort_early_neonatal, format: 'number' }]} />
          <FlowNode title="Deaths: late neonatal" category="empirical" values={[{ value: cm.mort_late_neonatal, format: 'number' }]} />
          <FlowNode title="Deaths: postneonatal" category="empirical" values={[{ value: cm.mort_postneonatal, format: 'number' }]} />
        </>
      ),
    },
    {
      id: 'smc-eligible',
      label: 'SMC-Eligible Population',
      annotation: 'Children under 3 months are excluded from SMC. We estimate the proportion of postneonatal deaths occurring before 3 months and subtract them.',
      nodes: (
        <>
          <FlowNode
            title="Postneonatal < 3 months"
            category="calculated"
            formula={`${cm.postneonatal_months_under3mo}/${cm.postneonatal_months_under1} of postneonatal`}
            values={[{ value: cm.prop_postneonatal_under3mo, format: 'percent' }]}
          />
          <FlowNode
            title="SMC-eligible deaths"
            category="calculated"
            formula="u5 - (early_neo + late_neo + post_<3mo)"
            values={[{ value: cm.smc_eligible_mort, format: 'number' }]}
          />
          <FlowNode
            title="Proportion eligible"
            category="calculated"
            formula="eligible / under-5"
            values={[{ value: cm.prop_smc_eligible, format: 'percent' }]}
          />
        </>
      ),
    },
    {
      id: 'mortality-rate',
      label: 'Mortality Rate (3-59 Months)',
      annotation: 'The mortality rate converts death counts to a probability, adjusting for the time children spend in the eligible age range.',
      nodes: (
        <>
          <FlowNode
            title="Implied population"
            category="calculated"
            formula="(u5_deaths / annual_rate) \u00D7 100k"
            values={[{ value: cm.mort_rate_per100k, format: 'number' }]}
          />
          <FlowNode
            title="Eligible months proportion"
            category="calculated"
            formula={`(${cm.total_months_under5} - ${cm.months_under3mo}) / ${cm.total_months_under5}`}
            values={[{ value: cm.prop_smc_eligible_months, format: 'percent' }]}
          />
          <FlowNode
            title="SMC-eligible mortality rate"
            category="calculated"
            formula="eligible_deaths / (population \u00D7 months_prop)"
            values={[{ value: cm.smc_eligible_mort_rate }]}
          />
          <FlowNode
            title="ITN adjustment"
            category="subjective"
            values={[{ value: cm.itn_adjustment, format: 'percent' }]}
            annotation="Adjusts for the mortality reduction already achieved by existing ITN coverage"
          />
          <FlowNode
            title="Annual mortality rate (3-59mo)"
            category="output"
            formula="eligible_rate \u00D7 (1 + ITN_adj)"
            values={[{ value: cm.annual_mort_rate_3_59mo }]}
            annotation="Feeds into Main CEA row 50 \u2014 basis for deaths-averted calculation"
            wide
          />
        </>
      ),
    },
    {
      id: 'older-ratio',
      label: 'Older Population Mortality Ratio',
      annotation: 'SMC trials measured effects on children 3-59 months. To estimate spillover mortality effects on older populations, we compute the ratio of non-eligible to eligible malaria deaths.',
      nodes: (
        <>
          <FlowNode title="Total malaria mortality (all ages)" category="empirical" values={[{ value: cm.total_malaria_mort, format: 'number' }]} />
          <FlowNode
            title="Non-eligible deaths"
            category="calculated"
            formula="total - under-5"
            values={[{ value: cm.smc_eligible_diff, format: 'number' }]}
          />
          <FlowNode
            title="Older-per-eligible ratio"
            category="output"
            formula="non_eligible / smc_eligible"
            values={[{ value: cm.older_per_smc_eligible }]}
            annotation="Feeds into Main CEA row 69 \u2014 scales under-5 deaths averted to estimate spillover impact"
          />
        </>
      ),
    },
    {
      id: 'incidence',
      label: 'Adjusted Incidence Rates',
      annotation: 'GBD reports malaria incidence per 100,000. We convert to proportions and adjust for existing ITN coverage, since the model needs the counterfactual incidence (what it would be without ITNs).',
      nodes: (
        <>
          <FlowNode title="GBD incidence: under-5 (per 100k)" category="empirical" values={[{ value: cm.incidence_under5, format: 'number' }]} />
          <FlowNode title="GBD incidence: 5-14 (per 100k)" category="empirical" values={[{ value: cm.incidence_5_to_14, format: 'number' }]} />
          <FlowNode
            title="ITN incidence adjustment"
            category="subjective"
            values={[{ value: cm.itn_adjustment_incidence, format: 'percent' }]}
          />
          <FlowNode
            title="Adjusted incidence (proportions)"
            category="output"
            formula="(per_100k / 100000) \u00D7 (1 + ITN_adj)"
            values={[
              { label: 'Under-5', value: cm.adjusted_incidence_under5 },
              { label: '5-14', value: cm.adjusted_incidence_5_to_14 },
            ]}
            annotation="Feeds into Main CEA rows 74-75 \u2014 used for cases-averted and income calculations"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Counterfactual Malaria</h1>
      <div className="explore-ir__intro">
        <p><strong>What is the baseline malaria burden for the SMC-eligible population?</strong></p>
        <p>
          SMC targets children aged 3-59 months during the malaria transmission
          season. This module calculates the mortality rate for this specific age
          group, the ratio of older-population to under-5 deaths (for spillover
          estimates), and incidence rates adjusted for existing ITN coverage.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="cm-country">Country</label>
          <select id="cm-country" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
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

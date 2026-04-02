/**
 * Explore: VAS External Validity
 *
 * High-level flow showing how trial results are adjusted for the
 * specific location's vitamin A deficiency and disease profile.
 */

import { useState, useMemo } from 'react';
import { useVASCountryData } from '../../data/useVASCountryData';
import FlowDiagram from '../../components/FlowDiagram';
import type { FlowTier } from '../../components/FlowDiagram';
import FlowNode from '../../components/FlowNode';

export default function VASExploreEV() {
  const { data, loading, error } = useVASCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country) return <div className="error">No country data available</div>;

  const ev = country.supplementary.external_validity;

  const tiers: FlowTier[] = [
    {
      id: 'vad-sources',
      label: 'Vitamin A Deficiency (VAD) Estimates',
      annotation: 'VAD prevalence determines how applicable VAS trial results are to this location. Higher VAD means more potential benefit. GiveWell blends two sources: national surveys (when available) and GBD modeled estimates.',
      nodes: (
        <>
          {ev.projected_national_vad != null && ev.projected_national_vad !== 0 && (
            <FlowNode
              title="Survey-based VAD"
              category="empirical"
              values={[{ value: ev.projected_national_vad, format: 'percent' }]}
              annotation="National survey projected to model year"
            />
          )}
          {ev.state_level_vad != null && (
            <FlowNode
              title="State-level VAD"
              category="empirical"
              values={[{ value: ev.state_level_vad, format: 'percent' }]}
              annotation="Proxy-adjusted state estimate (Nigeria only)"
            />
          )}
          <FlowNode
            title="GBD 2021 VAD (age-weighted)"
            category="empirical"
            values={[{ value: ev.vad_gbd_2021_weighted, format: 'percent' }]}
          />
          <FlowNode
            title="GBD 2023 VAD (age-weighted)"
            category="empirical"
            values={[{ value: ev.vad_gbd_2023_weighted, format: 'percent' }]}
          />
          <FlowNode
            title="Weighted GBD VAD"
            category="calculated"
            formula="0.4 \u00D7 GBD2021 + 0.6 \u00D7 GBD2023"
            values={[{ value: ev.weighted_gbd_vad, format: 'percent' }]}
          />
          {ev.projected_gbd_vad != null && (
            <FlowNode
              title="Projected GBD VAD"
              category="calculated"
              values={[{ value: ev.projected_gbd_vad, format: 'percent' }]}
              annotation="GBD estimate projected to model year using annual change rate"
            />
          )}
        </>
      ),
    },
    {
      id: 'vad-final',
      label: 'Final VAD & EV Adjustment',
      annotation: 'The final VAD estimate blends survey and GBD sources (when both available), adjusted for existing VAS coverage. The EV adjustment compares this to VAD levels in the original trials.',
      nodes: (
        <>
          <FlowNode
            title="Final estimated VAD"
            category="calculated"
            formula="survey \u00D7 wt + GBD \u00D7 wt (coverage-adjusted)"
            values={[{ value: ev.final_estimated_vad, format: 'percent' }]}
          />
          <FlowNode
            title="VAD EV adjustment"
            category="output"
            formula="(local_VAD / trial_VAD) - 1"
            values={[{ value: ev.ev_adj_vad, format: 'percent' }]}
            annotation={ev.ev_adj_vad === 0 ? 'No adjustment (insufficient data)' : 'Adjusts for difference in VAD between this location and trial settings'}
          />
        </>
      ),
    },
    {
      id: 'mortality-composition',
      label: 'Mortality Composition',
      annotation: 'VAS trials showed larger effects on measles and diarrheal deaths than on other causes. If this location has a different disease mix than the trial populations, the expected effect size changes.',
      nodes: (
        <>
          <FlowNode
            title="Eligible deaths by cause"
            category="empirical"
            values={[
              { label: 'Measles + diarrhea', value: ev.deaths_measles_eligible + ev.deaths_diarrheal_eligible, format: 'number' },
              { label: 'Other infectious', value: ev.deaths_infectious_eligible, format: 'number' },
            ]}
            annotation="GBD disease-specific deaths filtered to VAS-eligible ages"
          />
          <FlowNode
            title="Disease proportions"
            category="calculated"
            values={[
              { label: 'Measles + diarrhea', value: ev.prop_measles_diarrheal, format: 'percent' },
              { label: 'Other infectious', value: ev.prop_other_infectious, format: 'percent' },
            ]}
          />
          <FlowNode
            title="Composition EV adjustments"
            category="calculated"
            values={[
              { label: 'Measles/diarrheal', value: ev.ev_adj_measles_diarrheal, format: 'percent' },
              { label: 'Other infectious', value: ev.ev_adj_other_infectious, format: 'percent' },
            ]}
            annotation="Compares local disease proportions to trial populations"
          />
          <FlowNode
            title="Mortality composition adj"
            category="output"
            formula="weighted blend of disease adjustments"
            values={[{ value: ev.ev_adj_mortality_composition, format: 'percent' }]}
          />
        </>
      ),
    },
    {
      id: 'final',
      label: 'Combined External Validity Adjustment',
      annotation: 'The three components \u2014 VAD, mortality composition, and non-independence/frequency adjustments \u2014 multiply together to produce the final EV adjustment applied to the mortality reduction estimate.',
      nodes: (
        <>
          <FlowNode title="Non-independence adj" category="subjective" values={[{ value: ev.adj_mortality_non_independence, format: 'percent' }]} annotation="Accounts for overlap between VAD and mortality composition effects" />
          <FlowNode
            title="Final external validity adjustment"
            category="output"
            formula="(1 + VAD_adj) \u00D7 (1 + mort_comp_adj) \u00D7 (1 + non_indep) - 1"
            values={[{ value: ev.final_external_validity_adj, format: 'percent' }]}
            annotation="Feeds into Main CEA \u2014 scales the implied mortality reduction for this specific location"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: External Validity</h1>
      <div className="explore-ir__intro">
        <p><strong>How applicable are VAS trial results to this specific location?</strong></p>
        <p>
          The VAS mortality reduction estimate (24%) comes from trials conducted
          in specific settings. Two factors determine how well these results
          transfer: the level of vitamin A deficiency (higher VAD = more benefit)
          and the disease mix (VAS is more effective against measles and diarrhea
          than other causes).
        </p>
        <p>
          This module estimates local VAD by blending survey data with GBD
          modeled estimates, compares the disease-specific mortality profile to
          trial populations, and produces a combined adjustment.
        </p>
      </div>
      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="ev-country">Country</label>
          <select id="ev-country" value={country.id} onChange={(e) => setCountryId(e.target.value)}>
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

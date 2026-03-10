/**
 * Explore: Insecticide Resistance
 *
 * A visual flowchart showing how resistance inputs feed through
 * calculations to produce the weighted adjustment that enters the
 * Main CEA. All intermediate values are visible and color-coded by
 * data source category.
 */

import { useState, useMemo } from 'react';
import { useCountryData } from '../data/useCountryData';
import FlowDiagram from '../components/FlowDiagram';
import type { FlowTier } from '../components/FlowDiagram';
import FlowNode from '../components/FlowNode';
import type { Attribution } from '../model/insecticideResistance';
import { calculateIR } from '../model/insecticideResistance';

export default function ExploreIR() {
  const { data, loading, error } = useCountryData();
  const [countryId, setCountryId] = useState<string>('');

  // Pick country (default to first)
  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  // Compute intermediates from the TS calculation
  const ir = useMemo(() => {
    if (!country) return null;
    const irData = country.inputs.insecticide_resistance;
    const dur = country.supplementary.durability;
    if (!irData || !dur) return null;
    const attribution: [Attribution, Attribution, Attribution] = [
      dur.attribution_yr1 as Attribution,
      dur.attribution_yr2 as Attribution,
      dur.attribution_yr3 as Attribution,
    ];
    return calculateIR(irData, attribution);
  }, [country]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country || !ir) return <div className="error">No country data available</div>;

  const irInputs = country.inputs.insecticide_resistance;

  // Build the 4-tier flow
  const tiers: FlowTier[] = [
    // ---- TIER 1: Resistance Data ----
    {
      id: 'inputs',
      label: 'Resistance Data',
      nodes: (
        <>
          <FlowNode
            title="Bioassay mortality rate"
            category="empirical"
            values={[{ value: irInputs.avg_pyrethroid_mortality_rate, format: 'percent' }]}
            annotation="Lab-measured mosquito mortality from pyrethroid exposure"
          />
          <FlowNode
            title="Bioassay year"
            category="empirical"
            values={[{ value: irInputs.avg_bioassay_year, format: 'year' }]}
            annotation="Average year bioassay data was collected"
          />
          <FlowNode
            title="Distribution year"
            category="empirical"
            values={[{ value: irInputs.expected_distribution_year, format: 'year' }]}
            annotation="Expected year nets will be distributed"
          />
          <FlowNode
            title="Annual mortality change"
            category="subjective"
            values={[{ value: irInputs.annual_mortality_change }]}
            formula="per year"
            annotation="GiveWell staff estimate of annual resistance trend"
          />
        </>
      ),
    },

    // ---- TIER 2: Projected Resistance ----
    {
      id: 'projection',
      label: 'Projected Resistance at Distribution',
      annotation:
        'We project resistance forward because bioassay data is often several years old by distribution time.',
      nodes: (
        <>
          <FlowNode
            title="Years gap"
            category="calculated"
            formula="distribution_year - bioassay_year"
            values={[{ value: ir.years_gap }]}
          />
          <FlowNode
            title="Projected mortality"
            category="calculated"
            formula="bioassay_rate + (change x gap)"
            values={[{ value: ir.projected_mortality, format: 'percent' }]}
            annotation="Estimated mosquito mortality at distribution time"
          />
          <FlowNode
            title="Killing power loss"
            category="calculated"
            formula="projected_mortality - 1.0"
            values={[{ value: ir.killing_power_loss, format: 'percent' }]}
            annotation="How much killing effectiveness is lost vs. full susceptibility"
          />
          <FlowNode
            title="Durability attribution"
            category="upstream"
            values={[
              { label: 'Yr 1', value: `${(ir.attribution[0][0] * 100).toFixed(1)}% / ${(ir.attribution[0][1] * 100).toFixed(1)}% / ${(ir.attribution[0][2] * 100).toFixed(1)}%`, format: 'raw' },
              { label: 'Yr 2', value: `${(ir.attribution[1][0] * 100).toFixed(1)}% / ${(ir.attribution[1][1] * 100).toFixed(1)}% / ${(ir.attribution[1][2] * 100).toFixed(1)}%`, format: 'raw' },
              { label: 'Yr 3', value: `${(ir.attribution[2][0] * 100).toFixed(1)}% / ${(ir.attribution[2][1] * 100).toFixed(1)}% / ${(ir.attribution[2][2] * 100).toFixed(1)}%`, format: 'raw' },
            ]}
            formula="physical / chemical / joint shares"
            annotation="From Durability sheet — how protection splits between physical barrier and insecticide"
            wide
          />
        </>
      ),
    },

    // ---- TIER 3: Per-Net-Type Adjustments ----
    {
      id: 'net-types',
      label: 'Per-Net-Type Adjustments',
      annotation:
        'Different net types handle resistance differently. PBO nets restore some killing power; chlorfenapyr nets use a different insecticide entirely.',
      nodes: (
        <>
          <FlowNode
            title="Standard ITN"
            category="calculated"
            formula="phys + chem(1+loss) + joint(1+loss) - 1"
            values={[
              { label: 'Year 1', value: ir.standard_adj[0], format: 'percent' },
              { label: 'Year 2', value: ir.standard_adj[1], format: 'percent' },
              { label: 'Year 3', value: ir.standard_adj[2], format: 'percent' },
            ]}
            annotation={`${(irInputs.pct_standard_itns * 100).toFixed(0)}% of net mix`}
          />
          <FlowNode
            title="PBO Net"
            category="calculated"
            formula="std x (1 - (1-residual)(1+washout))"
            values={[
              { label: 'Year 1', value: ir.pbo_adj[0], format: 'percent' },
              { label: 'Year 2', value: ir.pbo_adj[1], format: 'percent' },
              { label: 'Year 3', value: ir.pbo_adj[2], format: 'percent' },
            ]}
            annotation={`Residual resistance: ${(ir.residual_resistance * 100).toFixed(1)}% | ${(irInputs.pct_pbo_nets * 100).toFixed(0)}% of net mix`}
          />
          <FlowNode
            title="Chlorfenapyr Net"
            category="subjective"
            formula="Fixed adjustment (not resistance-dependent)"
            values={[
              { label: 'Year 1', value: ir.chlorfenapyr_adj[0], format: 'percent' },
              { label: 'Year 2', value: ir.chlorfenapyr_adj[1], format: 'percent' },
              { label: 'Year 3', value: ir.chlorfenapyr_adj[2], format: 'percent' },
            ]}
            annotation={`GiveWell assumption | ${(irInputs.pct_chlorfenapyr_nets * 100).toFixed(0)}% of net mix`}
          />
          <FlowNode
            title="Dual AI Net"
            category="calculated"
            formula="Same as standard (pyrethroid base)"
            values={[
              { label: 'Year 1', value: ir.dual_ai_adj[0], format: 'percent' },
              { label: 'Year 2', value: ir.dual_ai_adj[1], format: 'percent' },
              { label: 'Year 3', value: ir.dual_ai_adj[2], format: 'percent' },
            ]}
            annotation={`${(irInputs.pct_other_dual_ai_nets * 100).toFixed(0)}% of net mix`}
          />
        </>
      ),
    },

    // ---- TIER 4: Weighted Result ----
    {
      id: 'output',
      label: 'Weighted Result',
      annotation:
        'The final adjustment is a weighted average based on which net types are actually being distributed in this country.',
      nodes: (
        <>
          <FlowNode
            title="Net mix"
            category="empirical"
            values={[
              { label: 'Standard', value: irInputs.pct_standard_itns, format: 'percent' },
              { label: 'PBO', value: irInputs.pct_pbo_nets, format: 'percent' },
              { label: 'Chlorfenapyr', value: irInputs.pct_chlorfenapyr_nets, format: 'percent' },
              { label: 'Dual AI', value: irInputs.pct_other_dual_ai_nets, format: 'percent' },
            ]}
            annotation="Proportions of each net type in planned distribution"
          />
          <FlowNode
            title="Weighted resistance adjustment"
            category="output"
            formula="SUMPRODUCT(net_adj x proportion)"
            values={[
              { label: 'Year 1', value: ir.weighted_adj[0], format: 'percent' },
              { label: 'Year 2', value: ir.weighted_adj[1], format: 'percent' },
              { label: 'Year 3', value: ir.weighted_adj[2], format: 'percent' },
            ]}
            annotation="Feeds into Main CEA mortality reduction (rows 87, 91, 95)"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      {/* Header */}
      <h1>Explore: Insecticide Resistance</h1>
      <div className="explore-ir__intro">
        <p>
          <strong>How does insecticide resistance affect net effectiveness?</strong>
        </p>
        <p>
          Pyrethroid resistance — when mosquitoes become less susceptible to the
          insecticides in bed nets — has spread significantly since the original
          ITN trials. This means nets may kill fewer mosquitoes than those trials
          measured.
        </p>
        <p>
          To account for this, GiveWell projects resistance forward from the most
          recent lab data (bioassays) to the expected distribution year, then
          estimates how much each type of net is affected. Newer net types like
          PBO and chlorfenapyr nets are designed to partially counteract
          resistance.
        </p>
      </div>

      {/* Country selector */}
      <div className="explore-ir__controls">
        <div className="control-group">
          <label htmlFor="ir-country">Country</label>
          <select
            id="ir-country"
            value={country.id}
            onChange={(e) => setCountryId(e.target.value)}
          >
            {data.countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flow-legend">
        <span className="flow-legend__item flow-legend__item--empirical">
          Measured data
        </span>
        <span className="flow-legend__item flow-legend__item--subjective">
          Staff judgment
        </span>
        <span className="flow-legend__item flow-legend__item--calculated">
          Calculated
        </span>
        <span className="flow-legend__item flow-legend__item--upstream">
          From another sheet
        </span>
        <span className="flow-legend__item flow-legend__item--output">
          Output
        </span>
      </div>

      {/* Flow diagram */}
      <FlowDiagram tiers={tiers} />
    </div>
  );
}

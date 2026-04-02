/**
 * Explore: Net Durability
 *
 * Shows how physical deterioration and chemical decay combine to
 * determine net protective effectiveness over 3 years.
 */

import { useState, useMemo } from 'react';
import { useCountryData } from '../data/useCountryData';
import FlowDiagram from '../components/FlowDiagram';
import type { FlowTier } from '../components/FlowDiagram';
import FlowNode from '../components/FlowNode';
import { ITN_DURABILITY_GRAPH } from '../model/dependency-graph';
import { useDependencyHighlight } from '../hooks/useDependencyHighlight';

export default function ExploreDurability() {
  const { data, loading, error } = useCountryData();
  const [countryId, setCountryId] = useState<string>('');
  const h = useDependencyHighlight(ITN_DURABILITY_GRAPH);

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  // Compute intermediates from raw inputs + pre-computed supplementary
  const dur = useMemo(() => {
    if (!country) return null;
    const phys = country.inputs.durability_physical;
    const chem = country.inputs.durability_chemical;
    const ir = country.inputs.insecticide_resistance;
    const supp = country.supplementary.durability;

    // Quadratic polynomial coefficients for chemical protection
    const a = ir.coeff_x_squared;
    const b = ir.coeff_x;
    const c = ir.y_intercept;
    const quad = (x: number) => a * x * x + b * x + c;

    // Physical protection by year (SUMPRODUCT of damage state × effectiveness)
    const physical = [
      phys.year1_severe * chem.effect_retained_severe + phys.year1_moderate * chem.effect_retained_moderate + phys.year1_good * chem.effect_retained_good,
      phys.year2_severe * chem.effect_retained_severe + phys.year2_moderate * chem.effect_retained_moderate + phys.year2_good * chem.effect_retained_good,
      phys.year3_severe * chem.effect_retained_severe + phys.year3_moderate * chem.effect_retained_moderate + phys.year3_good * chem.effect_retained_good,
    ];

    // Chemical protection (quadratic applied to pyrethroid remaining)
    const chemical = [
      quad(chem.pyrethroid_remaining_std_year1),
      quad(chem.pyrethroid_remaining_std_year2),
      quad(chem.pyrethroid_remaining_std_year3),
    ];

    const chemCtn = quad(chem.pyrethroid_remaining_ctn_year1);

    return { phys, chem, physical, chemical, chemCtn, supp, ir };
  }, [country]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country || !dur) return <div className="error">No country data available</div>;

  const { phys, chem, physical, chemical, supp } = dur;

  const tiers: FlowTier[] = [
    {
      id: 'physical-inputs',
      label: 'Physical Condition (Net Damage States)',
      annotation: 'Each year after distribution, nets are surveyed and classified as good, moderate, or severely damaged. These proportions are country-specific.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('yr1_condition')}
            title="Year 1 condition"
            category="empirical"
            values={[
              { label: 'Good', value: phys.year1_good, format: 'percent' },
              { label: 'Moderate', value: phys.year1_moderate, format: 'percent' },
              { label: 'Severe', value: phys.year1_severe, format: 'percent' },
            ]}
            annotation="Proportion of nets in each damage state after 1 year"
          />
          <FlowNode
            {...h.propsFor('yr2_condition')}
            title="Year 2 condition"
            category="empirical"
            values={[
              { label: 'Good', value: phys.year2_good, format: 'percent' },
              { label: 'Moderate', value: phys.year2_moderate, format: 'percent' },
              { label: 'Severe', value: phys.year2_severe, format: 'percent' },
            ]}
          />
          <FlowNode
            {...h.propsFor('yr3_condition')}
            title="Year 3 condition"
            category="empirical"
            values={[
              { label: 'Good', value: phys.year3_good, format: 'percent' },
              { label: 'Moderate', value: phys.year3_moderate, format: 'percent' },
              { label: 'Severe', value: phys.year3_severe, format: 'percent' },
            ]}
          />
          <FlowNode
            {...h.propsFor('effectiveness')}
            title="Effectiveness by condition"
            category="subjective"
            values={[
              { label: 'Good', value: chem.effect_retained_good, format: 'percent' },
              { label: 'Moderate', value: chem.effect_retained_moderate, format: 'percent' },
              { label: 'Severe', value: chem.effect_retained_severe, format: 'percent' },
            ]}
            annotation="Proportion of protective effect retained at each damage level"
          />
        </>
      ),
    },
    {
      id: 'physical-protection',
      label: 'Physical Protection',
      annotation: 'Physical protection each year = SUMPRODUCT(damage proportions × effectiveness retained). As nets deteriorate, physical protection drops.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('physical_protection')}
            title="Physical protection by year"
            category="calculated"
            formula="SUMPRODUCT(condition × effectiveness)"
            values={[
              { label: 'Year 1', value: physical[0], format: 'percent' },
              { label: 'Year 2', value: physical[1], format: 'percent' },
              { label: 'Year 3', value: physical[2], format: 'percent' },
            ]}
            wide
          />
        </>
      ),
    },
    {
      id: 'chemical-inputs',
      label: 'Chemical Protection (Insecticide Decay)',
      annotation: 'Insecticide decays as the active ingredient washes out over time. Protection is modeled as a quadratic function of the proportion of pyrethroid remaining.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('pyrethroid_remaining')}
            title="Pyrethroid remaining"
            category="empirical"
            values={[
              { label: 'Year 1', value: chem.pyrethroid_remaining_std_year1, format: 'percent' },
              { label: 'Year 2', value: chem.pyrethroid_remaining_std_year2, format: 'percent' },
              { label: 'Year 3', value: chem.pyrethroid_remaining_std_year3, format: 'percent' },
            ]}
            annotation="Fraction of original insecticide still active"
          />
          <FlowNode
            {...h.propsFor('poly_coefficients')}
            title="Polynomial coefficients"
            category="subjective"
            values={[
              { label: 'x\u00B2', value: dur.ir.coeff_x_squared },
              { label: 'x', value: dur.ir.coeff_x },
              { label: 'intercept', value: dur.ir.y_intercept },
            ]}
            formula="protection = ax\u00B2 + bx + c"
            annotation="Fitted from lab data on insecticide effectiveness vs. remaining concentration"
          />
          <FlowNode
            {...h.propsFor('chemical_protection')}
            title="Chemical protection by year"
            category="calculated"
            formula="a(remaining)\u00B2 + b(remaining) + c"
            values={[
              { label: 'Year 1', value: chemical[0], format: 'percent' },
              { label: 'Year 2', value: chemical[1], format: 'percent' },
              { label: 'Year 3', value: chemical[2], format: 'percent' },
            ]}
          />
        </>
      ),
    },
    {
      id: 'attribution',
      label: 'Effect Attribution',
      annotation: 'Net protection comes from three sources: the physical barrier alone (blocks mosquitoes), the chemical alone (kills/repels on contact), and the joint interaction (barrier keeps mosquitoes near insecticide longer).',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('effect_shares')}
            title="Effect shares"
            category="subjective"
            values={[
              { label: 'Physical only', value: supp.physical_share, format: 'percent' },
              { label: 'Chemical only', value: supp.chemical_share, format: 'percent' },
              { label: 'Joint (interaction)', value: supp.joint_share, format: 'percent' },
            ]}
            annotation="How much of total protection comes from each mechanism"
          />
        </>
      ),
    },
    {
      id: 'combined',
      label: 'Combined Protection',
      annotation: 'Total protection = (physical \u00D7 phys_share) + (chemical \u00D7 chem_share) + (physical \u00D7 chemical \u00D7 joint_share). This output feeds into the Insecticide Resistance and Coverage calculations.',
      nodes: (
        <>
          <FlowNode
            {...h.propsFor('combined_protection')}
            title="Combined protection"
            category="output"
            formula="phys\u00D7share + chem\u00D7share + phys\u00D7chem\u00D7joint"
            values={[
              { label: 'Year 1', value: supp.combined_protection[0], format: 'percent' },
              { label: 'Year 2', value: supp.combined_protection[1], format: 'percent' },
              { label: 'Year 3', value: supp.combined_protection[2], format: 'percent' },
            ]}
            annotation="Feeds into Insecticide Resistance sheet (attribution decomposition) and Coverage sheet"
            wide
          />
          <FlowNode
            {...h.propsFor('attribution')}
            title="Year-by-year attribution"
            category="output"
            values={[
              { label: 'Yr 1', value: `${(supp.attribution_yr1[0] * 100).toFixed(1)}% / ${(supp.attribution_yr1[1] * 100).toFixed(1)}% / ${(supp.attribution_yr1[2] * 100).toFixed(1)}%`, format: 'raw' },
              { label: 'Yr 2', value: `${(supp.attribution_yr2[0] * 100).toFixed(1)}% / ${(supp.attribution_yr2[1] * 100).toFixed(1)}% / ${(supp.attribution_yr2[2] * 100).toFixed(1)}%`, format: 'raw' },
              { label: 'Yr 3', value: `${(supp.attribution_yr3[0] * 100).toFixed(1)}% / ${(supp.attribution_yr3[1] * 100).toFixed(1)}% / ${(supp.attribution_yr3[2] * 100).toFixed(1)}%`, format: 'raw' },
            ]}
            formula="physical / chemical / joint proportions"
            annotation="Feeds into Insecticide Resistance — determines how resistance affects each component"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Net Durability</h1>
      <div className="explore-ir__intro">
        <p>
          <strong>How does net protective effectiveness decay over time?</strong>
        </p>
        <p>
          Bed nets protect through two mechanisms: a physical barrier (the mesh)
          and chemical treatment (insecticide). Both degrade over the 3-year
          lifespan of a net. Physical damage accumulates through use, washing,
          and environmental exposure. Insecticide washes out gradually.
        </p>
        <p>
          This module tracks both types of decay and combines them into an
          overall protection estimate, which feeds into the Insecticide
          Resistance and Coverage calculations downstream.
        </p>
      </div>

      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="dur-country">Country</label>
          <select
            id="dur-country"
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

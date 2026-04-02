/**
 * Explore: Effective Coverage
 *
 * Shows how net retention, durability-adjusted protection, and baseline
 * coverage combine to determine effective ITN coverage over 3 years.
 */

import { useState, useMemo } from 'react';
import { useCountryData } from '../data/useCountryData';
import FlowDiagram from '../components/FlowDiagram';
import type { FlowTier } from '../components/FlowDiagram';
import FlowNode from '../components/FlowNode';

export default function ExploreCoverage() {
  const { data, loading, error } = useCountryData();
  const [countryId, setCountryId] = useState<string>('');

  const country = useMemo(() => {
    if (!data) return null;
    return data.countries.find((c) => c.id === countryId) ?? data.countries[0];
  }, [data, countryId]);

  // Compute coverage intermediates
  const cov = useMemo(() => {
    if (!country) return null;
    const nd = country.inputs.net_distribution;
    const ret = country.inputs.net_retention;
    const supp = country.supplementary;
    const results = country.results;

    // Under-5 sleeping proportion (from main CEA)
    const u5sleep = results.under5_sleeping_proportion;

    // Year-by-year proportion still sleeping under distributed nets
    const propSleeping = [
      u5sleep * ret.itn_remaining_year1,
      u5sleep * ret.itn_remaining_year2,
      u5sleep * ret.itn_remaining_year3,
    ];

    // Distribution-only coverage = sleeping proportion × combined protection
    const distCoverage = [
      propSleeping[0] * supp.durability.combined_protection[0],
      propSleeping[1] * supp.durability.combined_protection[1],
      propSleeping[2] * supp.durability.combined_protection[2],
    ];

    // Baseline coverage (from supplementary)
    const baseline = supp.coverage.baseline_coverage;

    // Total coverage = distribution + non-recipients × baseline
    const totalCoverage = [
      distCoverage[0] + (1 - propSleeping[0]) * baseline,
      distCoverage[1] + (1 - propSleeping[1]) * baseline,
      distCoverage[2] + (1 - propSleeping[2]) * baseline,
    ];

    // Average retention and protection
    const avgRetention = (ret.itn_remaining_year1 + ret.itn_remaining_year2 + ret.itn_remaining_year3) / 3;
    const avgProtection = supp.durability.combined_protection.reduce((a: number, b: number) => a + b, 0) / 3;

    return {
      nd, ret, u5sleep, propSleeping, distCoverage,
      baseline, totalCoverage, avgRetention, avgProtection,
      combinedProtection: supp.durability.combined_protection,
    };
  }, [country]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !data) return <div className="error">{error ?? 'Failed to load data'}</div>;
  if (!country || !cov) return <div className="error">No country data available</div>;

  const tiers: FlowTier[] = [
    {
      id: 'usage-inputs',
      label: 'Net Usage & Retention',
      annotation: 'After distribution, not everyone uses their net, and nets are lost or discarded over time. These inputs determine how many people remain protected each year.',
      nodes: (
        <>
          <FlowNode
            title="Usage rate"
            category="empirical"
            values={[{ value: cov.nd.proportion_used, format: 'percent' }]}
            annotation="Proportion of distributed ITNs that are actually used"
          />
          <FlowNode
            title="Under-5 use adjustment"
            category="subjective"
            values={[{ value: cov.nd.under5_use_adjustment, format: 'percent' }]}
            annotation="Under-5s use nets at higher rates than the general population"
          />
          <FlowNode
            title="Under-5 sleeping proportion"
            category="calculated"
            formula="prop_sleeping \u00D7 (1 + under5_adj)"
            values={[{ value: cov.u5sleep, format: 'percent' }]}
            annotation="Effective proportion of under-5s sleeping under a distributed net"
          />
          <FlowNode
            title="Net retention by year"
            category="empirical"
            values={[
              { label: 'Year 1', value: cov.ret.itn_remaining_year1, format: 'percent' },
              { label: 'Year 2', value: cov.ret.itn_remaining_year2, format: 'percent' },
              { label: 'Year 3', value: cov.ret.itn_remaining_year3, format: 'percent' },
            ]}
            annotation="Proportion of distributed nets still in use each year"
          />
        </>
      ),
    },
    {
      id: 'sleeping',
      label: 'People Still Sleeping Under Nets',
      annotation: 'Each year, the proportion protected by distributed nets drops as nets are lost (retention) and as the initial sleeping proportion decays.',
      nodes: (
        <>
          <FlowNode
            title="Sleeping proportion by year"
            category="calculated"
            formula="under5_sleeping \u00D7 retention"
            values={[
              { label: 'Year 1', value: cov.propSleeping[0], format: 'percent' },
              { label: 'Year 2', value: cov.propSleeping[1], format: 'percent' },
              { label: 'Year 3', value: cov.propSleeping[2], format: 'percent' },
            ]}
            wide
          />
          <FlowNode
            title="Combined protection (from Durability)"
            category="upstream"
            values={[
              { label: 'Year 1', value: cov.combinedProtection[0], format: 'percent' },
              { label: 'Year 2', value: cov.combinedProtection[1], format: 'percent' },
              { label: 'Year 3', value: cov.combinedProtection[2], format: 'percent' },
            ]}
            annotation="How effective are the nets that remain? (from Durability sheet)"
          />
        </>
      ),
    },
    {
      id: 'dist-coverage',
      label: 'Distribution Coverage',
      annotation: 'Effective coverage from distributed nets = proportion still sleeping under them \u00D7 how well those nets still work (combined protection).',
      nodes: (
        <>
          <FlowNode
            title="Distribution coverage by year"
            category="calculated"
            formula="sleeping_proportion \u00D7 combined_protection"
            values={[
              { label: 'Year 1', value: cov.distCoverage[0], format: 'percent' },
              { label: 'Year 2', value: cov.distCoverage[1], format: 'percent' },
              { label: 'Year 3', value: cov.distCoverage[2], format: 'percent' },
            ]}
            wide
          />
        </>
      ),
    },
    {
      id: 'baseline',
      label: 'Baseline Coverage (Without This Distribution)',
      annotation: 'Some people would have access to ITNs anyway — from routine health channels (ANC/EPI) or other sources (private sector, other donors). This baseline applies to non-recipients of the distribution.',
      nodes: (
        <>
          <FlowNode
            title="Baseline effective coverage"
            category="calculated"
            formula="routine_coverage + other_sources"
            values={[{ value: cov.baseline, format: 'percent' }]}
            annotation="Effective ITN coverage in the absence of this distribution"
          />
          <FlowNode
            title="Average retention"
            category="calculated"
            formula="mean(yr1, yr2, yr3 retention)"
            values={[{ value: cov.avgRetention, format: 'percent' }]}
          />
          <FlowNode
            title="Average protection"
            category="calculated"
            formula="mean(yr1, yr2, yr3 combined protection)"
            values={[{ value: cov.avgProtection, format: 'percent' }]}
          />
        </>
      ),
    },
    {
      id: 'total',
      label: 'Total Effective Coverage',
      annotation: 'Total coverage = distribution coverage + non-recipients \u00D7 baseline. People who received a net get the distribution coverage; everyone else gets the baseline coverage from other sources.',
      nodes: (
        <>
          <FlowNode
            title="Total effective coverage"
            category="output"
            formula="dist_coverage + (1 - sleeping) \u00D7 baseline"
            values={[
              { label: 'Year 1', value: cov.totalCoverage[0], format: 'percent' },
              { label: 'Year 2', value: cov.totalCoverage[1], format: 'percent' },
              { label: 'Year 3', value: cov.totalCoverage[2], format: 'percent' },
            ]}
            annotation="Feeds into Main CEA — used to compute coverage increase (total - baseline)"
            wide
          />
          <FlowNode
            title="Coverage increase"
            category="output"
            formula="total_coverage - baseline"
            values={[
              { label: 'Year 1', value: cov.totalCoverage[0] - cov.baseline, format: 'percent' },
              { label: 'Year 2', value: cov.totalCoverage[1] - cov.baseline, format: 'percent' },
              { label: 'Year 3', value: cov.totalCoverage[2] - cov.baseline, format: 'percent' },
            ]}
            annotation="The additional coverage attributable to this distribution — drives mortality reduction"
            wide
          />
        </>
      ),
    },
  ];

  return (
    <div className="page explore-ir">
      <h1>Explore: Effective Coverage</h1>
      <div className="explore-ir__intro">
        <p>
          <strong>What proportion of the target population is effectively protected by ITNs?</strong>
        </p>
        <p>
          Effective coverage accounts for three factors: how many people sleep
          under a net, how many nets are still in use (retention), and how well
          those nets still work (durability-adjusted protection). Coverage
          declines each year as nets are lost and degrade.
        </p>
        <p>
          The coverage <em>increase</em> — total coverage minus what people would
          have had anyway (baseline) — is what drives the mortality reduction
          in the main CEA pipeline.
        </p>
      </div>

      <div className="explore-controls">
        <div className="control-group">
          <label htmlFor="cov-country">Country</label>
          <select
            id="cov-country"
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
        <span className="flow-legend__item flow-legend__item--upstream">From another sheet</span>
        <span className="flow-legend__item flow-legend__item--output">Output</span>
      </div>

      <FlowDiagram tiers={tiers} />
    </div>
  );
}

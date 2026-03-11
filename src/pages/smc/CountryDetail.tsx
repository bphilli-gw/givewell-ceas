import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSMCCountry } from '../../data/useSMCCountryData';
import { useSMCSources } from '../../data/useSourceData';
import CalculationSection from '../../components/CalculationSection';
import type { Row } from '../../components/CalculationSection';

export default function SMCCountryDetail() {
  const { id } = useParams<{ id: string }>();
  const { country, loading, error } = useSMCCountry(id);
  const { getSource } = useSMCSources();

  const withSources = useMemo(() => {
    return (rows: Row[]): Row[] =>
      rows.map((row) => {
        const source = getSource(row.label);
        return source ? { ...row, source } : row;
      });
  }, [getSource]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!country) return <div className="error">Country not found</div>;

  const r = country.results;

  return (
    <div className="page detail-page">
      <Link to="/smc" className="back-link">
        &larr; Back to Overview
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-header">
            <h1>{country.display_name}</h1>
            <div className="detail-ce">
              <span className="ce-value">{r.final_ce.toFixed(1)}</span>
              <span className="ce-label">CE (units of value per dollar / benchmark)</span>
            </div>
          </div>

          <div className="key-metrics">
            <div className="metric">
              <div className="metric-value">{Math.round(r.counterfactual_lives_saved).toLocaleString()}</div>
              <div className="metric-label">Lives Saved</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.cost_per_counterfactual_life).toLocaleString()}</div>
              <div className="metric-label">Cost per Life</div>
            </div>
            <div className="metric">
              <div className="metric-value">{Math.round(r.total_children_covered).toLocaleString()}</div>
              <div className="metric-label">Children Covered</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.grantee_spending).toLocaleString()}</div>
              <div className="metric-label">GiveWell Spending</div>
            </div>
          </div>

          <CalculationSection
            title="1. Costs"
            defaultOpen={true}
            rows={withSources([
              { label: 'Total spending', value: r.total_spending, format: 'currency' },
              { label: 'GiveWell (grantee) spending', value: r.grantee_spending, format: 'currency', indent: true },
              { label: 'Other philanthropic spending', value: r.other_spending, format: 'currency', indent: true },
              { label: 'Government spending', value: r.gov_spending, format: 'currency', indent: true },
              { label: 'Upstream spending', value: r.upstream_spending, format: 'currency' },
              { label: 'Downstream spending', value: r.downstream_spending, format: 'currency' },
              { label: 'Cost per cycle', value: r.cost_per_cycle, format: 'currency' },
              { label: 'Cycles per year', value: r.cycles_per_year },
              { label: 'Total cost per child', value: r.total_cost_per_child, format: 'currency' },
              { label: 'Upstream cost per child', value: r.upstream_cost_per_child, format: 'currency' },
            ])}
          />

          <CalculationSection
            title="2. Outputs"
            rows={withSources([
              { label: 'Total children covered', value: r.total_children_covered, format: 'number' },
            ])}
          />

          <CalculationSection
            title="3. Mortality Impact (Under 5)"
            rows={withSources([
              { label: 'Expected incidence reduction', value: r.expected_incidence_reduction, format: 'percent' },
              { label: 'Expected mortality reduction', value: r.expected_mortality_reduction, format: 'percent' },
              { label: 'Annual mortality rate (3-59 months)', value: r.annual_mort_rate_3_59mo },
              { label: 'Total mortality rate', value: r.total_mort_rate },
              { label: 'Vaccine-adjusted mortality rate', value: r.vaccine_adj_mort_rate },
              { label: 'Seasonal mortalities', value: r.seasonal_mortalities },
              { label: 'Deaths averted under 5', value: r.deaths_averted_under5, highlight: true, format: 'number' },
            ])}
          />

          <CalculationSection
            title="4. Mortality Impact (Over 5)"
            rows={withSources([
              { label: 'Spillover incidence reduction', value: r.spillover_incidence_reduction, format: 'percent' },
              { label: 'Spillover mortality reduction', value: r.spillover_mortality_reduction },
              { label: 'Older mortality per eligible', value: r.older_mort_per_eligible },
              { label: 'Deaths averted over 5', value: r.deaths_averted_over5, highlight: true, format: 'number' },
            ])}
          />

          <CalculationSection
            title="5. Incidence & Income"
            rows={withSources([
              { label: 'Cases averted under 5', value: r.cases_averted_under5, format: 'number' },
              { label: 'Cases averted 5-14', value: r.cases_averted_5_to_14, format: 'number' },
              { label: 'PV lifetime benefits per case', value: r.pv_lifetime_benefits_per_case, format: 'currency' },
              { label: 'Total PV income', value: r.total_pv_income, format: 'currency' },
            ])}
          />

          <CalculationSection
            title="6. Value of Outcomes"
            rows={withSources([
              { label: 'UoV from under-5 deaths', value: r.uov_deaths_under5 },
              { label: 'UoV from over-5 deaths', value: r.uov_deaths_over5 },
              { label: 'UoV from income', value: r.uov_income },
              { label: 'Total UoV', value: r.total_uov, highlight: true },
              { label: 'UoV per dollar', value: r.uov_per_dollar },
              { label: 'CE before adjustments', value: r.ce_before_adj, format: 'multiplier' },
              { label: 'Total lives saved', value: r.total_lives_saved },
              { label: 'Cost per life saved', value: r.cost_per_life_saved, format: 'currency' },
            ])}
          />

          <CalculationSection
            title="7. Adjustments"
            rows={withSources([
              { label: 'Grantee-level adjustment total', value: r.grantee_adj_total, format: 'percent' },
              { label: 'Intervention-level adjustment total', value: r.intervention_adj_total, format: 'percent' },
              { label: 'Leverage adjustment', value: r.leverage_adj, format: 'percent' },
              { label: 'Funging adjustment', value: r.funging_adj, format: 'percent' },
              { label: 'L&F overall adjustment', value: r.lf_overall_adj, format: 'percent' },
            ])}
          />

          <CalculationSection
            title="8. Final Cost-Effectiveness"
            defaultOpen={true}
            rows={withSources([
              { label: 'Total value after adjustments', value: r.total_value_after_adj },
              { label: 'Final UoV per dollar', value: r.uov_per_dollar_final },
              { label: 'Final CE', value: r.final_ce, format: 'multiplier', highlight: true },
              { label: 'Counterfactual people covered', value: r.counterfactual_people_covered, format: 'number' },
              { label: 'Cost per counterfactual person', value: r.cost_per_counterfactual_person, format: 'currency' },
              { label: 'Counterfactual lives saved', value: r.counterfactual_lives_saved, format: 'number' },
              { label: 'Cost per counterfactual life', value: r.cost_per_counterfactual_life, format: 'currency', highlight: true },
            ])}
          />
        </div>

        <aside className="detail-sidebar">
          <div className="sidebar-card">
            <h3>Interactive Editing</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Interactive parameter editing is not yet available for SMC.
              The SMC TypeScript model will be ported in a future update.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

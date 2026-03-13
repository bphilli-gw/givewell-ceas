import { useParams, Link } from 'react-router-dom';
import { useVASCountry } from '../../data/useVASCountryData';
import CalculationSection from '../../components/CalculationSection';
import type { Row } from '../../components/CalculationSection';

export default function VASCountryDetail() {
  const { id } = useParams<{ id: string }>();
  const { country, loading, error } = useVASCountry(id);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!country) return <div className="error">Country not found</div>;

  const r = country.results;

  return (
    <div className="page detail-page">
      <Link to="/vas" className="back-link">
        &larr; Back to Overview
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-header">
            <h1>{country.display_name}</h1>
            {country.implementer && (
              <span className="implementer-badge">{country.implementer}</span>
            )}
            <div className="detail-ce">
              <span className="ce-value">
                {r.ce_multiple.toFixed(1)}
              </span>
              <span className="ce-label">CE (units of value per dollar / benchmark)</span>
            </div>
          </div>

          <div className="key-metrics">
            <div className="metric">
              <div className="metric-value">{Math.round(r.counterfactual_lives_saved).toLocaleString()}</div>
              <div className="metric-label">Lives Saved</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.cost_per_life_saved).toLocaleString()}</div>
              <div className="metric-label">Cost per Life</div>
            </div>
            <div className="metric">
              <div className="metric-value">{Math.round(r.children_covered).toLocaleString()}</div>
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
            rows={[
              { label: 'Total spending', value: r.total_spending, format: 'currency' },
              { label: 'GiveWell (grantee) spending', value: r.grantee_spending, format: 'currency', indent: true },
              { label: 'NI capsule spending', value: r.ni_spending, format: 'currency', indent: true },
              { label: 'Other philanthropic spending', value: r.other_phil_spending, format: 'currency', indent: true },
              { label: 'Govt financial spending', value: r.govt_financial_spending, format: 'currency', indent: true },
              { label: 'Govt in-kind spending', value: r.govt_in_kind_spending, format: 'currency', indent: true },
              { label: 'Upstream spending', value: r.upstream_spending, format: 'currency' },
              { label: 'Downstream spending', value: r.downstream_spending, format: 'currency' },
              { label: 'Cost per child-year', value: r.cost_per_child_year, format: 'currency' },
              { label: 'Upstream cost per child-year', value: r.upstream_cost_per_child_year, format: 'currency' },
            ] as Row[]}
          />

          <CalculationSection
            title="2. Coverage"
            rows={[
              { label: 'Children covered', value: r.children_covered, format: 'number' },
              { label: 'Counterfactual coverage', value: r.counterfactual_coverage, format: 'percent' },
              { label: 'Additional children', value: r.additional_children, format: 'number', highlight: true },
            ] as Row[]}
          />

          <CalculationSection
            title="3. Mortality Reduction"
            rows={[
              { label: 'Implied mortality reduction', value: r.implied_mort_reduction, format: 'percent' },
              { label: 'Expected mortality reduction', value: r.expected_mort_reduction, format: 'percent' },
              { label: 'Mortality rate in absence of VAS', value: r.mortality_rate_absence_vas },
              { label: 'Deaths averted', value: r.deaths_averted, highlight: true, format: 'number' },
            ] as Row[]}
          />

          <CalculationSection
            title="4. Income Effects"
            rows={[
              { label: 'VAS income-to-mortality ratio', value: r.vas_income_ratio },
              { label: 'UoV from deaths averted', value: r.uov_from_deaths },
              { label: 'UoV from income', value: r.uov_from_income },
            ] as Row[]}
          />

          <CalculationSection
            title="5. Value of Outcomes"
            rows={[
              { label: 'UoV from deaths (pre-adj)', value: r.uov_deaths_pre_adj },
              { label: 'UoV from income (pre-adj)', value: r.uov_income_pre_adj },
              { label: 'Total UoV (pre-adj)', value: r.total_uov_pre_adj, highlight: true },
              { label: 'UoV per dollar (pre-adj)', value: r.uov_per_dollar_pre_adj },
              { label: 'CE before adjustments', value: r.ce_multiple_pre_adj, format: 'multiplier' },
              { label: '% from mortality', value: r.pct_mortality, format: 'percent' },
              { label: '% from income', value: r.pct_income, format: 'percent' },
            ] as Row[]}
          />

          <CalculationSection
            title="6. Adjustments"
            rows={[
              { label: 'Grantee-level adjustment total', value: r.total_grantee_adj, format: 'percent' },
              { label: 'Intervention-level adjustment total', value: r.total_intervention_adj, format: 'percent' },
              { label: 'Leverage adjustment', value: r.leverage_adj, format: 'percent' },
              { label: 'Funging adjustment', value: r.funging_adj, format: 'percent' },
              { label: 'L&F total adjustment', value: r.total_lf_adj, format: 'percent' },
            ] as Row[]}
          />

          <CalculationSection
            title="7. Final Cost-Effectiveness"
            defaultOpen={true}
            rows={[
              { label: 'Total value after adjustments', value: r.total_value_after_adj },
              { label: 'Final UoV per dollar', value: r.uov_per_dollar_after_adj },
              { label: 'Final CE', value: r.ce_multiple, format: 'multiplier', highlight: true },
              { label: 'Counterfactual people covered', value: r.counterfactual_people_covered, format: 'number' },
              { label: 'Cost per counterfactual person', value: r.cost_per_person_covered, format: 'currency' },
              { label: 'Counterfactual lives saved', value: r.counterfactual_lives_saved, format: 'number' },
              { label: 'Cost per life saved', value: r.cost_per_life_saved, format: 'currency', highlight: true },
            ] as Row[]}
          />
        </div>
      </div>
    </div>
  );
}

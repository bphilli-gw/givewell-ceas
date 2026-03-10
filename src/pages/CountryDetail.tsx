import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCountry } from '../data/useCountryData';
import CalculationSection from '../components/CalculationSection';
import ParameterEditor from '../components/ParameterEditor';
import type { MainCEAResult } from '../model/types';

export default function CountryDetail() {
  const { id } = useParams<{ id: string }>();
  const { country, loading, error } = useCountry(id);
  const [result, setResult] = useState<MainCEAResult | null>(null);

  const onRecalculate = useCallback((newResult: MainCEAResult) => {
    setResult(newResult);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!country) return <div className="error">Country not found</div>;

  const r = result ?? country.results;
  const isModified = result !== null;

  return (
    <div className="page detail-page">
      <Link to="/" className="back-link">
        &larr; Back to Overview
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-header">
            <h1>{country.display_name}</h1>
            <div className="detail-ce">
              <span className={`ce-value ${isModified ? 'modified' : ''}`}>
                {(r.final_ce_multiple ?? 0).toFixed(3)}x
              </span>
              <span className="ce-label">GiveDirectly</span>
              {isModified && (
                <span className="ce-original">
                  (was {(country.results.final_ce_multiple ?? 0).toFixed(3)}x)
                </span>
              )}
            </div>
          </div>

          <div className="key-metrics">
            <div className="metric">
              <div className="metric-value">{(r.deaths_averted_under5 + r.deaths_averted_over5).toFixed(1)}</div>
              <div className="metric-label">Deaths Averted</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.cost_per_life_counterfactual ?? 0).toLocaleString()}</div>
              <div className="metric-label">Cost per Life</div>
            </div>
            <div className="metric">
              <div className="metric-value">{Math.round(r.nets_distributed).toLocaleString()}</div>
              <div className="metric-label">Nets Distributed</div>
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
              { label: 'Other philanthropic spending', value: r.other_spending, format: 'currency', indent: true },
              { label: 'Government spending', value: r.gov_spending, format: 'currency', indent: true },
              { label: 'Upstream spending', value: r.upstream_spending, format: 'currency' },
              { label: 'Cost per net', value: r.cost_per_net, format: 'currency' },
              { label: 'Upstream cost per net', value: r.upstream_cost_per_net, format: 'currency' },
            ]}
          />

          <CalculationSection
            title="2. Distribution & Usage"
            rows={[
              { label: 'Nets distributed', value: r.nets_distributed, format: 'number' },
              { label: 'Target population', value: r.target_population, format: 'number' },
              { label: 'People sleeping under nets', value: r.people_sleeping, format: 'number' },
              { label: 'Proportion sleeping under nets', value: r.prop_sleeping, format: 'percent' },
              { label: 'Under-5 sleeping proportion', value: r.under5_sleeping_proportion, format: 'percent' },
              { label: 'Proportion under 5', value: r.prop_under5, format: 'percent' },
              { label: 'Proportion 5-14', value: r.prop_5_14, format: 'percent' },
              { label: 'Target under 5', value: r.target_under5, format: 'number' },
              { label: 'Target 5-14', value: r.target_5_14, format: 'number' },
            ]}
          />

          <CalculationSection
            title="3. Effective Coverage"
            rows={[
              { label: 'Baseline coverage', value: r.baseline_coverage, format: 'percent' },
              { label: 'Coverage increase Year 1', value: r.coverage_increase_yr1, format: 'percent' },
              { label: 'Coverage increase Year 2', value: r.coverage_increase_yr2, format: 'percent' },
              { label: 'Coverage increase Year 3', value: r.coverage_increase_yr3, format: 'percent' },
            ]}
          />

          <CalculationSection
            title="4. Efficacy Chain"
            rows={[
              { label: 'Trial coverage difference', value: r.trial_coverage_diff },
              { label: 'Net efficacy (per unit coverage)', value: r.net_efficacy, highlight: true },
              { label: 'Mortality reduction Year 1', value: r.mortality_reduction_yr1, format: 'percent' },
              { label: 'Mortality reduction Year 2', value: r.mortality_reduction_yr2, format: 'percent' },
              { label: 'Mortality reduction Year 3', value: r.mortality_reduction_yr3, format: 'percent' },
            ]}
          />

          <CalculationSection
            title="5. Mortality Impact"
            rows={[
              { label: 'Baseline mortality (adjusted)', value: r.baseline_mortality_adjusted },
              { label: 'Net of SMC', value: r.mortality_net_of_smc },
              { label: 'Mortality adjusted (vaccine)', value: r.mortality_adjusted },
              { label: 'Prevalence reduction from existing nets', value: r.prevalence_reduction, format: 'percent' },
              { label: 'Mortality without any nets', value: r.mortality_without_nets },
              { label: 'Potential deaths (under 5)', value: r.potential_deaths },
              { label: 'Avg mortality reduction (3yr)', value: r.avg_mortality_reduction, format: 'percent' },
              { label: 'Deaths averted under 5', value: r.deaths_averted_under5, highlight: true },
              { label: 'Deaths averted 5+', value: r.deaths_averted_over5, highlight: true },
            ]}
          />

          <CalculationSection
            title="6. Incidence & Income"
            rows={[
              { label: 'Cases averted under 5', value: r.cases_averted_under5 },
              { label: 'Cases averted 5-14', value: r.cases_averted_5_14 },
              { label: 'Income PV per case averted', value: r.income_pv_per_case, format: 'currency' },
              { label: 'Total income value', value: r.total_income_value, format: 'currency' },
            ]}
          />

          <CalculationSection
            title="7. Value of Outcomes (Units of Value)"
            rows={[
              { label: 'UoV from under-5 deaths', value: r.uov_under5_deaths },
              { label: 'UoV from 5+ deaths', value: r.uov_over5_deaths },
              { label: 'UoV from income', value: r.uov_income },
              { label: 'Total UoV', value: r.total_uov, highlight: true },
              { label: 'UoV per dollar', value: r.uov_per_dollar },
              { label: 'CE multiple (pre-adjustments)', value: r.ce_multiple_before_adj, format: 'multiplier' },
              { label: 'Total lives saved', value: r.total_lives_saved },
              { label: 'Cost per life (pre-adjustments)', value: r.cost_per_life_before_adj, format: 'currency' },
            ]}
          />

          <CalculationSection
            title="8. Adjustments"
            rows={[
              { label: 'Grantee-level adjustment total', value: r.grantee_adj_total, format: 'percent' },
              { label: 'Intervention-level adjustment total', value: r.intervention_adj_total, format: 'percent' },
              { label: 'Leverage adjustment', value: r.leverage_adj, format: 'percent' },
              { label: 'Funging adjustment', value: r.funging_adj, format: 'percent' },
              { label: 'L&F total', value: r.lf_total, format: 'percent' },
            ]}
          />

          <CalculationSection
            title="9. Final Cost-Effectiveness"
            defaultOpen={true}
            rows={[
              { label: 'Total value after adjustments', value: r.total_value_after_adj },
              { label: 'Final UoV per dollar', value: r.final_uov_per_dollar },
              { label: 'Final CE multiple', value: r.final_ce_multiple, format: 'multiplier', highlight: true },
              { label: 'Counterfactual nets distributed', value: r.counterfactual_nets },
              { label: 'Counterfactual lives saved', value: r.counterfactual_lives },
              { label: 'Cost per life (counterfactual)', value: r.cost_per_life_counterfactual, format: 'currency', highlight: true },
            ]}
          />
        </div>

        <aside className="detail-sidebar">
          <ParameterEditor country={country} onRecalculate={onRecalculate} />
        </aside>
      </div>
    </div>
  );
}

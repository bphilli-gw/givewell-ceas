import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNICountry } from '../../data/useNICountryData';
import { useNISources } from '../../data/useSourceData';
import CalculationSection from '../../components/CalculationSection';
import type { Row } from '../../components/CalculationSection';

export default function NICountryDetail() {
  const { id } = useParams<{ id: string }>();
  const { country, loading, error } = useNICountry(id);
  const { getSource } = useNISources();

  const withSources = useMemo(() => {
    return (rows: Row[]): Row[] =>
      rows.map((row) => {
        const source = getSource(row.label);
        return source ? { ...row, source } : row;
      });
  }, [getSource]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!country) return <div className="error">State not found</div>;

  const r = country.results;

  return (
    <div className="page detail-page">
      <Link to="/ni" className="back-link">
        &larr; Back to Overview
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-header">
            <h1>{country.state}</h1>
            <span className={`group-badge group-${country.group}`}>{country.group}</span>
            <span className="implementer-badge">{country.implementer}</span>
            <div className="detail-ce">
              <span className="ce-value">
                {r.final_ce_multiple.toFixed(1)}
              </span>
              <span className="ce-label">CE (units of value per dollar / benchmark)</span>
            </div>
          </div>

          <div className="key-metrics">
            <div className="metric">
              <div className="metric-value">{Math.round(r.adjusted_outcome_children).toLocaleString()}</div>
              <div className="metric-label">Outcome Children</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.cost_per_outcome_child).toLocaleString()}</div>
              <div className="metric-label">Cost per Outcome Child</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.cost_per_daly).toLocaleString()}</div>
              <div className="metric-label">Cost per DALY</div>
            </div>
            <div className="metric">
              <div className="metric-value">${Math.round(r.spending).toLocaleString()}</div>
              <div className="metric-label">Grant Spending</div>
            </div>
          </div>

          <CalculationSection
            title="1. Costs"
            defaultOpen={true}
            rows={withSources([
              { label: 'Grant spending', value: r.spending, format: 'currency' },
              { label: 'Cost per child enrolled', value: r.cost_per_child, format: 'currency' },
            ] as Row[])}
          />

          <CalculationSection
            title="2. Enrollment & Coverage"
            rows={withSources([
              { label: 'Children enrolled', value: r.children_enrolled, format: 'number' },
              { label: 'Counterfactual vaccination rate', value: r.counterfactual_vaccination, format: 'percent' },
              { label: 'Unvaccinated proportion', value: r.unvaccinated_proportion, format: 'percent' },
              { label: 'Overall treatment effect', value: r.overall_effect, format: 'percent' },
              { label: 'Adjusted treatment effect', value: r.adjusted_effect, format: 'percent' },
              { label: 'Coverage increase', value: r.coverage_increase, format: 'percent', highlight: true },
              { label: 'Outcome children', value: r.outcome_children, format: 'number', highlight: true },
            ] as Row[])}
          />

          <CalculationSection
            title="3. Under-5 Mortality"
            rows={withSources([
              { label: 'VPD total (adjusted)', value: r.vpd_total_adj_u5 },
              { label: 'GBD adjustment', value: r.gbd_adj_u5, format: 'percent' },
              { label: 'Incidence averted', value: r.incidence_averted_u5, format: 'percent' },
              { label: 'Unvaccinated probability', value: r.unvacc_total_u5 },
              { label: 'With indirect mortality', value: r.indirect_mort_u5 },
              { label: 'DALYs (under-5)', value: r.daly_u5, format: 'number', highlight: true },
              { label: 'DALYs (under-5 indirect)', value: r.daly_u5_indirect, format: 'number' },
            ] as Row[])}
          />

          <CalculationSection
            title="4. Mortality: Ages 5-14"
            rows={withSources([
              { label: 'Unvaccinated probability', value: r.unvacc_prob_5to14 },
              { label: 'With indirect mortality', value: r.indirect_mort_5to14 },
              { label: 'DALYs (undiscounted)', value: r.daly_5to14, format: 'number' },
              { label: 'DALYs (discounted)', value: r.daly_5to14_discounted, format: 'number', highlight: true },
            ] as Row[])}
          />

          <CalculationSection
            title="5. Mortality: Ages 15-49"
            rows={withSources([
              { label: 'Unvaccinated probability', value: r.unvacc_prob_15to49 },
              { label: 'With indirect mortality', value: r.indirect_mort_15to49 },
              { label: 'DALYs (undiscounted)', value: r.daly_15to49, format: 'number' },
              { label: 'DALYs (discounted)', value: r.daly_15to49_discounted, format: 'number', highlight: true },
            ] as Row[])}
          />

          <CalculationSection
            title="6. Mortality: Ages 50-74"
            rows={withSources([
              { label: 'Unvaccinated probability', value: r.unvacc_prob_50to74 },
              { label: 'With indirect mortality', value: r.indirect_mort_50to74 },
              { label: 'DALYs (undiscounted)', value: r.daly_50to74, format: 'number' },
              { label: 'DALYs (discounted)', value: r.daly_50to74_discounted, format: 'number', highlight: true },
            ] as Row[])}
          />

          <CalculationSection
            title="7. Income & Cash Transfer"
            rows={withSources([
              { label: 'Income value', value: r.income_value, format: 'number' },
              { label: 'Cash transfer value', value: r.cash_transfer_value, format: 'number' },
            ] as Row[])}
          />

          <CalculationSection
            title="8. Pre-Leverage CE"
            rows={withSources([
              { label: 'Total value of outcomes', value: r.total_value, format: 'number' },
              { label: 'Pre-leverage CE ratio', value: r.pre_leverage_ce },
              { label: 'Pre-leverage CE multiple', value: r.pre_leverage_multiple, format: 'multiplier', highlight: true },
            ] as Row[])}
          />

          <CalculationSection
            title="9. Adjustments"
            rows={withSources([
              { label: 'Grantee adjustment total', value: r.grantee_adj_sum, format: 'percent' },
              { label: 'Intervention adjustment total', value: r.intervention_adj_sum, format: 'percent' },
              { label: 'Leverage/funging adjustment', value: r.leverage_funging_adj, format: 'percent' },
            ] as Row[])}
          />

          <CalculationSection
            title="10. Final Cost-Effectiveness"
            defaultOpen={true}
            rows={withSources([
              { label: 'Adjusted total value', value: r.adjusted_total_value, format: 'number' },
              { label: 'Final CE ratio', value: r.final_ce },
              { label: 'Final CE multiple', value: r.final_ce_multiple, format: 'multiplier', highlight: true },
              { label: 'Adjusted outcome children', value: r.adjusted_outcome_children, format: 'number' },
              { label: 'Cost per outcome child', value: r.cost_per_outcome_child, format: 'currency', highlight: true },
              { label: 'Adjusted DALYs', value: r.adjusted_dalys, format: 'number' },
              { label: 'Cost per DALY', value: r.cost_per_daly, format: 'currency', highlight: true },
            ] as Row[])}
          />
        </div>
      </div>
    </div>
  );
}

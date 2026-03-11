import { useNavigate } from 'react-router-dom';
import { useSMCCountryData } from '../../data/useSMCCountryData';
import type { SMCCountryData } from '../../model/smc-types';

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function SMCOverview() {
  const { data, loading, error } = useSMCCountryData();
  const navigate = useNavigate();

  if (loading) return <div className="loading">Loading SMC data...</div>;
  if (error) return <div className="error">Error loading data: {error}</div>;
  if (!data) return null;

  const countries = data.countries;
  const avgCE = countries.reduce((sum, c) => sum + c.results.final_ce, 0) / countries.length;
  const totalLives = countries.reduce((sum, c) => sum + c.results.counterfactual_lives_saved, 0);

  // Max P95 for uncertainty bar scaling
  const maxP95 = Math.max(
    ...countries.map((c) => c.monte_carlo?.summary.p95 ?? c.results.final_ce)
  );

  return (
    <div className="page overview-page">
      <h1>SMC Cost-Effectiveness Analysis</h1>
      <p className="subtitle">
        {countries.length} country/region combinations ranked by cost-effectiveness.
        Click any row to see the full calculation breakdown.
      </p>

      <div className="summary-cards">
        <div className="card">
          <div className="card-value">{countries.length}</div>
          <div className="card-label">Countries</div>
        </div>
        <div className="card">
          <div className="card-value">{avgCE.toFixed(1)}</div>
          <div className="card-label">Avg CE</div>
        </div>
        <div className="card">
          <div className="card-value">{fmtInt(totalLives)}</div>
          <div className="card-label">Total Lives Saved</div>
        </div>
      </div>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th>Country</th>
              <th className="num">CE</th>
              <th className="num">Uncertainty (P5–P95)</th>
              <th className="num">Lives Saved</th>
              <th className="num">Cost per Life</th>
              <th className="num">Children Covered</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c: SMCCountryData, i: number) => {
              const mc = c.monte_carlo;
              const ce = c.results.final_ce;
              return (
                <tr
                  key={c.id}
                  className="clickable-row"
                  onClick={() => navigate(`/smc/country/${c.id}`)}
                >
                  <td className="rank-col">{i + 1}</td>
                  <td>{c.display_name}</td>
                  <td className="num highlight">{fmt(ce, 1)}</td>
                  <td className="num uncertainty-cell">
                    {mc ? (
                      <div className="uncertainty-bar-wrapper">
                        <span className="uncertainty-range">
                          {mc.summary.p5.toFixed(1)}–{mc.summary.p95.toFixed(1)}
                        </span>
                        <div className="uncertainty-bar">
                          <div
                            className="uncertainty-bar-outer"
                            style={{
                              left: `${(mc.summary.p5 / maxP95) * 100}%`,
                              width: `${((mc.summary.p95 - mc.summary.p5) / maxP95) * 100}%`,
                            }}
                          />
                          <div
                            className="uncertainty-bar-inner"
                            style={{
                              left: `${(mc.summary.p25 / maxP95) * 100}%`,
                              width: `${((mc.summary.p75 - mc.summary.p25) / maxP95) * 100}%`,
                            }}
                          />
                          <div
                            className="uncertainty-bar-point"
                            style={{ left: `${(ce / maxP95) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="num">{fmtInt(c.results.counterfactual_lives_saved)}</td>
                  <td className="num">{fmtCurrency(c.results.cost_per_counterfactual_life)}</td>
                  <td className="num">{fmtInt(c.results.total_children_covered)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="disclaimer">
        CE values represent units of value per dollar relative to our benchmark.
        See the Sensitivity page for uncertainty ranges.
      </p>
    </div>
  );
}

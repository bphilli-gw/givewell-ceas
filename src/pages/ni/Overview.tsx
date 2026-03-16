import { useNavigate } from 'react-router-dom';
import { useNICountryData } from '../../data/useNICountryData';
import type { NICountryData } from '../../model/ni-types';

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

export default function NIOverview() {
  const { data, loading, error } = useNICountryData();
  const navigate = useNavigate();

  if (loading) return <div className="loading">Loading NI data...</div>;
  if (error) return <div className="error">Error loading data: {error}</div>;
  if (!data) return null;

  const countries = data.countries;
  const avgCE = countries.reduce((sum, c) => sum + c.results.final_ce_multiple, 0) / countries.length;
  const currentStates = countries.filter((c) => c.group === 'current');
  const prospectiveStates = countries.filter((c) => c.group === 'prospective');

  return (
    <div className="page overview-page">
      <h1>New Incentives Cost-Effectiveness Analysis</h1>
      <p className="subtitle">
        {countries.length} Nigerian states ranked by cost-effectiveness.
        {currentStates.length} current states, {prospectiveStates.length} prospective.
        Click any row to see the full calculation breakdown.
      </p>

      <div className="summary-cards">
        <div className="card">
          <div className="card-value">{countries.length}</div>
          <div className="card-label">States</div>
        </div>
        <div className="card">
          <div className="card-value">{avgCE.toFixed(1)}</div>
          <div className="card-label">Avg CE</div>
        </div>
        <div className="card">
          <div className="card-value">{currentStates.length}</div>
          <div className="card-label">Current</div>
        </div>
        <div className="card">
          <div className="card-value">{prospectiveStates.length}</div>
          <div className="card-label">Prospective</div>
        </div>
      </div>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th>State</th>
              <th className="num">Group</th>
              <th className="num">CE</th>
              <th className="num">Pre-Leverage CE</th>
              <th className="num">Outcome Children</th>
              <th className="num">Cost/Outcome Child</th>
              <th className="num">Cost/DALY</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c: NICountryData, i: number) => {
              const r = c.results;
              return (
                <tr
                  key={c.id}
                  className="clickable-row"
                  onClick={() => navigate(`/ni/country/${c.id}`)}
                >
                  <td className="rank-col">{i + 1}</td>
                  <td>{c.state}</td>
                  <td className="num">
                    <span className={`group-badge group-${c.group}`}>
                      {c.group}
                    </span>
                  </td>
                  <td className="num highlight">{fmt(r.final_ce_multiple, 1)}</td>
                  <td className="num">{fmt(r.pre_leverage_multiple, 1)}</td>
                  <td className="num">{fmtInt(r.adjusted_outcome_children)}</td>
                  <td className="num">{fmtCurrency(r.cost_per_outcome_child)}</td>
                  <td className="num">{fmtCurrency(r.cost_per_daly)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="disclaimer">
        CE values represent units of value per dollar relative to the benchmark.
        "Current" states are where New Incentives currently operates; "prospective" are potential expansion targets.
      </p>
    </div>
  );
}

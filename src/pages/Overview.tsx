import { useCountryData } from '../data/useCountryData';
import ResultsTable from '../components/ResultsTable';

export default function Overview() {
  const { data, loading, error } = useCountryData();

  if (loading) return <div className="loading">Loading CEA data...</div>;
  if (error) return <div className="error">Error loading data: {error}</div>;
  if (!data) return null;

  const countries = data.countries;
  const avgCE =
    countries.reduce((sum, c) => sum + (c.results.final_ce_multiple ?? 0), 0) / countries.length;
  const totalDeaths = countries.reduce(
    (sum, c) =>
      sum + (c.results.deaths_averted_under5 ?? 0) + (c.results.deaths_averted_over5 ?? 0),
    0
  );

  return (
    <div className="page overview-page">
      <h1>ITN Cost-Effectiveness Analysis</h1>
      <p className="subtitle">
        {countries.length} country/region combinations ranked by cost-effectiveness
        (as multiples of GiveDirectly).
        Click any row to see the full calculation breakdown.
      </p>

      <div className="summary-cards">
        <div className="card">
          <div className="card-value">{countries.length}</div>
          <div className="card-label">Countries</div>
        </div>
        <div className="card">
          <div className="card-value">{avgCE.toFixed(1)}x</div>
          <div className="card-label">Avg CE Multiple</div>
        </div>
        <div className="card">
          <div className="card-value">{totalDeaths.toFixed(0)}</div>
          <div className="card-label">Total Deaths Averted</div>
        </div>
      </div>

      <ResultsTable countries={countries} />

      <p className="disclaimer">
        All figures assume a $1,000,000 grant size per country. CE multiples and deaths averted
        are rounded to reduce false precision — see the Sensitivity page for uncertainty ranges.
      </p>
    </div>
  );
}

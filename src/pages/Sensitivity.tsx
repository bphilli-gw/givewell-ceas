import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useCountryData } from '../data/useCountryData';
import { calculateMainCEA } from '../model/cea';
import type { CountryData, ITNInputs, TornadoEntry } from '../model/types';

// ── Parameter sweep config (unchanged) ──────────────────────────────────

interface SweepParam {
  key: string;
  label: string;
  path: string[];
  defaultRange: [number, number];
  format: 'currency' | 'percent' | 'number';
}

const SWEEP_PARAMS: SweepParam[] = [
  { key: 'grant_size', label: 'Grant Size', path: ['cost', 'grant_size'], defaultRange: [500_000, 20_000_000], format: 'currency' },
  { key: 'cost_per_net', label: 'Cost per Net', path: ['cost', 'cost_per_net'], defaultRange: [1, 10], format: 'currency' },
  { key: 'death_under5', label: 'Moral Weight: Death <5', path: ['value_weights', 'death_under5'], defaultRange: [50, 200], format: 'number' },
  { key: 'death_over5', label: 'Moral Weight: Death 5+', path: ['value_weights', 'death_over5'], defaultRange: [50, 200], format: 'number' },
  { key: 'discount_rate', label: 'Discount Rate', path: ['economic', 'discount_rate'], defaultRange: [0.01, 0.15], format: 'percent' },
  { key: 'proportion_used', label: 'ITN Usage Rate', path: ['net_distribution', 'proportion_used'], defaultRange: [0.3, 1.0], format: 'percent' },
];

function getNestedValue(obj: Record<string, unknown>, path: string[]): number {
  let current: unknown = obj;
  for (const key of path) {
    current = (current as Record<string, unknown>)[key];
  }
  return current as number;
}

function setNestedValue(obj: Record<string, unknown>, path: string[], value: number): Record<string, unknown> {
  const result = { ...obj };
  if (path.length === 1) {
    result[path[0]] = value;
    return result;
  }
  result[path[0]] = setNestedValue(
    { ...(obj[path[0]] as Record<string, unknown>) },
    path.slice(1),
    value
  );
  return result;
}

function computeSweep(
  country: CountryData,
  param: SweepParam,
  globalPhysicalAdjusted: number,
  steps: number = 20,
): { paramValue: number; ce: number }[] {
  const [lo, hi] = param.defaultRange;
  const results: { paramValue: number; ce: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const val = lo + (hi - lo) * (i / steps);
    const modifiedInputs = setNestedValue(
      JSON.parse(JSON.stringify(country.inputs)) as Record<string, unknown>,
      param.path,
      val
    );

    const result = calculateMainCEA(
      modifiedInputs as unknown as ITNInputs,
      country.supplementary,
      globalPhysicalAdjusted
    );
    results.push({ paramValue: val, ce: result.final_ce_multiple ?? 0 });
  }

  return results;
}

const COLORS = [
  '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
];

// ── Friendly parameter labels ───────────────────────────────────────────

const PARAM_LABELS: Record<string, string> = {
  cost_per_under5_reached: 'Cost per Under-5 Reached',
  proportion_sleeping_counterfactual: 'Counterfactual Coverage',
  years_of_coverage: 'Years of Coverage',
  malaria_mortality_rate_under5: 'Mortality Rate (Under 5)',
  effect_of_itn_on_deaths: 'Effect on Deaths',
  adj_mortality_over5: 'Over-5 Mortality Adj.',
  adj_developmental_benefits: 'Developmental Benefits Adj.',
  adj_program_benefits: 'Program Benefits Adj.',
  adj_grantee_factors: 'Grantee Factors Adj.',
  adj_funging: 'Funging Adj.',
};

function friendlyParam(name: string): string {
  return PARAM_LABELS[name] ?? name.replace(/_/g, ' ');
}

// ── Component ───────────────────────────────────────────────────────────

export default function Sensitivity() {
  const { data, loading, error } = useCountryData();
  const [selectedParam, setSelectedParam] = useState<string>(SWEEP_PARAMS[0].key);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [tornadoCountryId, setTornadoCountryId] = useState<string>('');

  // Pick the tornado reference country (default to highest CE with MC data)
  const tornadoCountry = useMemo(() => {
    if (!data) return null;
    if (tornadoCountryId) {
      return data.countries.find((c) => c.id === tornadoCountryId) ?? null;
    }
    return data.countries.find((c) => c.monte_carlo != null) ?? data.countries[0] ?? null;
  }, [data, tornadoCountryId]);

  // Format MC tornado data for Recharts
  const tornadoData = useMemo(() => {
    if (!tornadoCountry?.monte_carlo) return null;

    return tornadoCountry.monte_carlo.tornado.map((t: TornadoEntry) => {
      const lo = Math.min(t.p25_pct_delta, t.p75_pct_delta) * 100;
      const hi = Math.max(t.p25_pct_delta, t.p75_pct_delta) * 100;
      return {
        param: friendlyParam(t.parameter),
        low: lo,
        high: hi,
        spread: Math.abs(hi - lo),
      };
    }).sort((a: { spread: number }, b: { spread: number }) => b.spread - a.spread);
  }, [tornadoCountry]);

  // Histogram data
  const histogramData = useMemo(() => {
    if (!tornadoCountry?.monte_carlo) return null;
    const baseCE = tornadoCountry.results.final_ce_multiple ?? 0;
    return tornadoCountry.monte_carlo.histogram.map((bin) => ({
      x: (bin.x0 + bin.x1) / 2,
      count: bin.count,
      isBaseline: bin.x0 <= baseCE && baseCE < bin.x1,
    }));
  }, [tornadoCountry]);

  // Sweep data for selected param and countries
  const sweepData = useMemo(() => {
    if (!data || selectedCountries.length === 0) return null;
    const param = SWEEP_PARAMS.find((p) => p.key === selectedParam);
    if (!param) return null;

    const countrySweeps = selectedCountries.map((cId) => {
      const country = data.countries.find((c) => c.id === cId);
      if (!country) return null;
      return { country, sweep: computeSweep(country, param, data.global_physical_adjusted) };
    }).filter(Boolean) as { country: CountryData; sweep: { paramValue: number; ce: number }[] }[];

    if (countrySweeps.length === 0) return null;
    const merged = countrySweeps[0].sweep.map((point, i) => {
      const row: Record<string, number> = { paramValue: point.paramValue };
      for (const cs of countrySweeps) {
        row[cs.country.display_name] = cs.sweep[i].ce;
      }
      return row;
    });

    return { param, countrySweeps, merged };
  }, [data, selectedParam, selectedCountries]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return null;

  const toggleCountry = (id: string) => {
    setSelectedCountries((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id].slice(-5)
    );
  };

  const mc = tornadoCountry?.monte_carlo;

  return (
    <div className="page sensitivity-page">
      <h1>Sensitivity Analysis</h1>
      <p className="subtitle">
        Monte Carlo uncertainty analysis ({mc?.n_simulations?.toLocaleString() ?? '—'} simulations)
        and parameter sweeps.
      </p>

      {/* ── Country selector for MC sections ── */}
      <section className="section">
        <div className="control-group">
          <label>Reference country:</label>
          <select
            value={tornadoCountry?.id ?? ''}
            onChange={(e) => setTornadoCountryId(e.target.value)}
          >
            {data.countries.filter((c) => c.monte_carlo != null).map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── MC Summary Stats ── */}
      {mc && (
        <section className="section">
          <h2>Distribution Summary — {tornadoCountry?.display_name}</h2>
          <div className="mc-stats-row">
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.mean.toFixed(2)}x</span>
              <span className="mc-stat-label">Mean</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.median.toFixed(2)}x</span>
              <span className="mc-stat-label">Median</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.p5.toFixed(2)}x</span>
              <span className="mc-stat-label">P5</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.p25.toFixed(2)}x — {mc.summary.p75.toFixed(2)}x</span>
              <span className="mc-stat-label">IQR (P25–P75)</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.p95.toFixed(2)}x</span>
              <span className="mc-stat-label">P95</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{((mc.summary.std / mc.summary.mean) * 100).toFixed(0)}%</span>
              <span className="mc-stat-label">CV</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Histogram ── */}
      {histogramData && (
        <section className="section">
          <h2>CE Distribution — {tornadoCountry?.display_name}</h2>
          <p className="section-desc">
            Distribution of cost-effectiveness multiples from {mc?.n_simulations?.toLocaleString()} Monte Carlo draws.
            The highlighted bar contains the point estimate.
          </p>
          <div className="chart-container" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ left: 10, right: 20, top: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="x"
                  label={{ value: 'CE Multiple', position: 'bottom', offset: 10 }}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(val: number) => [val, 'Simulations']}
                  labelFormatter={(v: number) => `CE ≈ ${Number(v).toFixed(2)}x`}
                />
                <ReferenceLine
                  x={tornadoCountry?.results.final_ce_multiple ?? 0}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: 'Point est.', position: 'top', fill: '#dc2626', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Simulations">
                  {histogramData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isBaseline ? '#dc2626' : '#2563eb'}
                      fillOpacity={entry.isBaseline ? 0.9 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── MC-based Tornado ── */}
      {tornadoData && tornadoData.length > 0 && (
        <section className="section">
          <h2>Tornado Diagram — {tornadoCountry?.display_name}</h2>
          <p className="section-desc">
            One-at-a-time sensitivity: each parameter is held at its P25 and P75 while all others
            vary via Monte Carlo. Bars show the % change in mean CE relative to the baseline.
          </p>
          <div className="chart-container" style={{ height: Math.max(250, tornadoData.length * 36 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={tornadoData}
                margin={{ left: 160, right: 30, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                  label={{ value: '% Change in Mean CE', position: 'bottom', offset: 0 }}
                />
                <YAxis type="category" dataKey="param" width={150} tick={{ fontSize: 13 }} />
                <Tooltip
                  formatter={(val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                />
                <ReferenceLine x={0} stroke="#666" />
                <Bar dataKey="low" fill="#ef4444" name="Low end" stackId="a" />
                <Bar dataKey="high" fill="#22c55e" name="High end" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── No MC data fallback ── */}
      {!mc && (
        <section className="section">
          <p className="hint">
            No Monte Carlo data available for the selected country.
            Run the precompute script to generate MC results.
          </p>
        </section>
      )}

      {/* ── Parameter Sweep (unchanged) ── */}
      <section className="section">
        <h2>Parameter Sweep</h2>
        <p className="section-desc">
          Select a parameter and up to 5 countries to see how CE changes across the parameter range.
        </p>

        <div className="sweep-controls">
          <div className="control-group">
            <label>Parameter:</label>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
            >
              {SWEEP_PARAMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Countries ({selectedCountries.length}/5):</label>
            <div className="country-chips">
              {data.countries.map((c) => (
                <button
                  key={c.id}
                  className={`chip ${selectedCountries.includes(c.id) ? 'active' : ''}`}
                  onClick={() => toggleCountry(c.id)}
                >
                  {c.display_name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sweepData && (
          <div className="chart-container" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweepData.merged} margin={{ left: 20, right: 20, top: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="paramValue"
                  label={{ value: sweepData.param.label, position: 'bottom', offset: 10 }}
                  tickFormatter={(v: number) =>
                    sweepData.param.format === 'currency'
                      ? '$' + v.toLocaleString()
                      : sweepData.param.format === 'percent'
                        ? (v * 100).toFixed(0) + '%'
                        : v.toFixed(1)
                  }
                />
                <YAxis label={{ value: 'CE Multiple', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(val) => Number(val).toFixed(3) + 'x'}
                  labelFormatter={(v) => {
                    const n = Number(v);
                    return sweepData.param.format === 'currency'
                      ? '$' + n.toLocaleString()
                      : sweepData.param.format === 'percent'
                        ? (n * 100).toFixed(1) + '%'
                        : n.toFixed(2);
                  }}
                />
                <Legend />
                {sweepData.countrySweeps.map((cs, i) => (
                  <Line
                    key={cs.country.id}
                    type="monotone"
                    dataKey={cs.country.display_name}
                    stroke={COLORS[i % COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!sweepData && selectedCountries.length === 0 && (
          <p className="hint">Select at least one country to see the sweep chart.</p>
        )}
      </section>
    </div>
  );
}

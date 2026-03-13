import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useVASCountryData } from '../../data/useVASCountryData';
import type { TornadoEntry } from '../../model/vas-types';

const PARAM_LABELS: Record<string, string> = {
  cost_per_u5_reached: 'Cost per U5 Reached',
  counterfactual_coverage: 'Counterfactual Coverage',
  mortality_rate: 'Mortality Rate',
  vas_effect: 'VAS Effect on Mortality',
  developmental_benefits: 'Developmental Benefits',
  intervention_adj: 'Intervention Adj.',
  grantee_adj: 'Grantee Adj.',
  funging_adj: 'Funging Adj.',
};

function friendlyParam(name: string): string {
  return PARAM_LABELS[name] ?? name.replace(/_/g, ' ');
}

export default function VASSensitivity() {
  const { data, loading, error } = useVASCountryData();
  const [tornadoCountryId, setTornadoCountryId] = useState<string>('');

  const tornadoCountry = useMemo(() => {
    if (!data) return null;
    if (tornadoCountryId) {
      return data.countries.find((c) => c.id === tornadoCountryId) ?? null;
    }
    return data.countries.find((c) => c.monte_carlo != null) ?? data.countries[0] ?? null;
  }, [data, tornadoCountryId]);

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

  const histogramData = useMemo(() => {
    if (!tornadoCountry?.monte_carlo) return null;
    const baseCE = tornadoCountry.results.ce_multiple;
    return tornadoCountry.monte_carlo.histogram.map((bin) => ({
      x: (bin.x0 + bin.x1) / 2,
      count: bin.count,
      isBaseline: bin.x0 <= baseCE && baseCE < bin.x1,
    }));
  }, [tornadoCountry]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return null;

  const mc = tornadoCountry?.monte_carlo;

  return (
    <div className="page sensitivity-page">
      <h1>VAS Sensitivity Analysis</h1>
      <p className="subtitle">
        Monte Carlo uncertainty analysis ({mc?.n_simulations?.toLocaleString() ?? '—'} simulations).
      </p>

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

      {mc && (
        <section className="section">
          <h2>Distribution Summary — {tornadoCountry?.display_name}</h2>
          <div className="mc-stats-row">
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.mean.toFixed(1)}</span>
              <span className="mc-stat-label">Mean</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.median.toFixed(1)}</span>
              <span className="mc-stat-label">Median</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.p5.toFixed(1)}</span>
              <span className="mc-stat-label">P5</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.p25.toFixed(1)} — {mc.summary.p75.toFixed(1)}</span>
              <span className="mc-stat-label">IQR (P25–P75)</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{mc.summary.p95.toFixed(1)}</span>
              <span className="mc-stat-label">P95</span>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-value">{((mc.summary.std / mc.summary.mean) * 100).toFixed(0)}%</span>
              <span className="mc-stat-label">CV</span>
            </div>
          </div>
        </section>
      )}

      {histogramData && (
        <section className="section">
          <h2>CE Distribution — {tornadoCountry?.display_name}</h2>
          <p className="section-desc">
            Distribution of cost-effectiveness from {mc?.n_simulations?.toLocaleString()} Monte Carlo draws.
            The highlighted bar contains the point estimate.
          </p>
          <div className="chart-container" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ left: 10, right: 20, top: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="x"
                  label={{ value: 'CE', position: 'bottom', offset: 10 }}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={((val: number) => [val, 'Simulations']) as any}
                  labelFormatter={((v: number) => `CE ≈ ${Number(v).toFixed(2)}`) as any}
                />
                <ReferenceLine
                  x={tornadoCountry?.results.ce_multiple ?? 0}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: 'Point est.', position: 'top', fill: '#dc2626', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Simulations">
                  {histogramData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isBaseline ? '#dc2626' : '#d97706'}
                      fillOpacity={entry.isBaseline ? 0.9 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
                  formatter={((val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`) as any}
                />
                <ReferenceLine x={0} stroke="#666" />
                <Bar dataKey="low" fill="#ef4444" name="Low end" stackId="a" />
                <Bar dataKey="high" fill="#22c55e" name="High end" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {!mc && (
        <section className="section">
          <p className="hint">
            No Monte Carlo data available for the selected country.
          </p>
        </section>
      )}
    </div>
  );
}

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
} from 'recharts';
import { useCountryData } from '../data/useCountryData';
import { calculateMainCEA } from '../model/cea';
import type { CountryData, ITNInputs } from '../model/types';

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

export default function Sensitivity() {
  const { data, loading, error } = useCountryData();
  const [selectedParam, setSelectedParam] = useState<string>(SWEEP_PARAMS[0].key);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Tornado data: for each param, compute CE at low and high ends for a reference country
  const tornadoData = useMemo(() => {
    if (!data) return [];
    const ref = data.countries[0]; // highest CE country
    if (!ref) return [];

    return SWEEP_PARAMS.map((param) => {
      const baseVal = getNestedValue(ref.inputs as unknown as Record<string, unknown>, param.path);
      const [lo, hi] = param.defaultRange;

      const computeAt = (val: number) => {
        const modified = setNestedValue(
          JSON.parse(JSON.stringify(ref.inputs)) as Record<string, unknown>,
          param.path,
          val
        );
        return calculateMainCEA(modified as unknown as ITNInputs, ref.supplementary, data.global_physical_adjusted)
          .final_ce_multiple ?? 0;
      };

      const baseCE = ref.results.final_ce_multiple ?? 0;
      const loCE = computeAt(lo);
      const hiCE = computeAt(hi);

      return {
        param: param.label,
        baseCE,
        low: Math.min(loCE, hiCE) - baseCE,
        high: Math.max(loCE, hiCE) - baseCE,
        range: Math.abs(hiCE - loCE),
        baseVal,
      };
    }).sort((a, b) => b.range - a.range);
  }, [data]);

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

    // Merge into chart-friendly format
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

  const refCountry = data.countries[0];

  return (
    <div className="page sensitivity-page">
      <h1>Sensitivity Analysis</h1>
      <p className="subtitle">
        Explore how changing key parameters affects cost-effectiveness.
      </p>

      <section className="section">
        <h2>Tornado Diagram — {refCountry?.display_name}</h2>
        <p className="section-desc">
          Impact of sweeping each parameter from its low to high bound on the CE multiple.
        </p>
        <div className="chart-container" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={tornadoData}
              margin={{ left: 120, right: 20, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: 'Change in CE Multiple', position: 'bottom' }} />
              <YAxis type="category" dataKey="param" width={110} />
              <Tooltip
                formatter={(val) => {
                  const n = Number(val);
                  return (n > 0 ? '+' : '') + n.toFixed(2) + 'x';
                }}
              />
              <ReferenceLine x={0} stroke="#666" />
              <Bar dataKey="low" fill="#ef4444" name="Low end" stackId="a" />
              <Bar dataKey="high" fill="#22c55e" name="High end" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

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

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useNICountryData } from '../../data/useNICountryData';
import type { NICountryData } from '../../model/ni-types';

const COLORS = ['#7c3aed', '#2563eb', '#dc2626', '#059669', '#d97706'];

interface ComparisonMetric {
  key: string;
  label: string;
  getValue: (c: NICountryData) => number;
  format: 'currency' | 'number' | 'multiplier' | 'percent';
}

const METRICS: ComparisonMetric[] = [
  {
    key: 'final_ce_multiple',
    label: 'CE Multiple',
    getValue: (c) => c.results.final_ce_multiple,
    format: 'multiplier',
  },
  {
    key: 'outcome_children',
    label: 'Outcome Children',
    getValue: (c) => c.results.adjusted_outcome_children,
    format: 'number',
  },
  {
    key: 'cost_per_outcome_child',
    label: 'Cost/Outcome Child',
    getValue: (c) => c.results.cost_per_outcome_child,
    format: 'currency',
  },
  {
    key: 'adjusted_dalys',
    label: 'Adjusted DALYs',
    getValue: (c) => c.results.adjusted_dalys,
    format: 'number',
  },
  {
    key: 'cost_per_daly',
    label: 'Cost/DALY',
    getValue: (c) => c.results.cost_per_daly,
    format: 'currency',
  },
  {
    key: 'pre_leverage_multiple',
    label: 'Pre-Leverage CE',
    getValue: (c) => c.results.pre_leverage_multiple,
    format: 'multiplier',
  },
];

function formatMetric(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return '$' + Math.round(value).toLocaleString();
    case 'multiplier':
      return value.toFixed(2);
    case 'percent':
      return (value * 100).toFixed(1) + '%';
    default:
      return value < 1 ? value.toFixed(6) : value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
}

export default function NICompare() {
  const { data, loading, error } = useNICountryData();
  const [selected, setSelected] = useState<string[]>([]);

  const selectedCountries = useMemo(() => {
    if (!data) return [];
    return selected
      .map((id) => data.countries.find((c) => c.id === id))
      .filter(Boolean) as NICountryData[];
  }, [data, selected]);

  const barData = useMemo(() => {
    return METRICS.slice(0, 5).map((metric) => {
      const row: Record<string, string | number> = { metric: metric.label };
      for (const c of selectedCountries) {
        row[c.state] = metric.getValue(c);
      }
      return row;
    });
  }, [selectedCountries]);

  const radarData = useMemo(() => {
    if (selectedCountries.length === 0) return [];
    const radarMetrics = [METRICS[0], METRICS[1], METRICS[3], METRICS[5]];
    return radarMetrics.map((metric) => {
      const values = selectedCountries.map((c) => metric.getValue(c));
      const max = Math.max(...values, 1);
      const row: Record<string, string | number> = { metric: metric.label };
      for (let i = 0; i < selectedCountries.length; i++) {
        row[selectedCountries[i].state] = (values[i] / max) * 100;
      }
      return row;
    });
  }, [selectedCountries]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return null;

  const toggleCountry = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id].slice(-5)
    );
  };

  return (
    <div className="page compare-page">
      <h1>Compare NI States</h1>
      <p className="subtitle">Select up to 5 states to compare side-by-side.</p>

      <div className="country-chips">
        {data.countries.map((c) => (
          <button
            key={c.id}
            className={`chip ${selected.includes(c.id) ? 'active' : ''}`}
            onClick={() => toggleCountry(c.id)}
          >
            {c.state}
          </button>
        ))}
      </div>

      {selectedCountries.length > 0 && (
        <>
          <section className="section">
            <h2>Key Metrics Comparison</h2>
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {selectedCountries.map((c) => (
                      <th key={c.id}>{c.state}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric) => (
                    <tr key={metric.key}>
                      <td>{metric.label}</td>
                      {selectedCountries.map((c) => (
                        <td key={c.id} className="num">
                          {formatMetric(metric.getValue(c), metric.format)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section">
            <h2>CE Comparison</h2>
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedCountries.map((c) => ({
                    name: c.state,
                    ce: c.results.final_ce_multiple,
                  }))}
                  margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'CE', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(val) => Number(val).toFixed(3)} />
                  <Bar dataKey="ce" name="CE">
                    {selectedCountries.map((_, i) => (
                      <rect key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {selectedCountries.length >= 2 && (
            <section className="section">
              <h2>Profile Comparison</h2>
              <div className="chart-container" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    {selectedCountries.map((c, i) => (
                      <Radar
                        key={c.id}
                        name={c.state}
                        dataKey={c.state}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.15}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="section">
            <h2>Breakdown Comparison</h2>
            <div className="chart-container" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedCountries.map((c, i) => (
                    <Bar
                      key={c.id}
                      dataKey={c.state}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {selectedCountries.length === 0 && (
        <p className="hint">Select at least one state to begin comparing.</p>
      )}
    </div>
  );
}

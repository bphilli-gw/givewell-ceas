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
import { useVASCountryData } from '../../data/useVASCountryData';
import type { VASCountryData } from '../../model/vas-types';

const COLORS = ['#d97706', '#2563eb', '#dc2626', '#059669', '#7c3aed'];

interface ComparisonMetric {
  key: string;
  label: string;
  getValue: (c: VASCountryData) => number;
  format: 'currency' | 'number' | 'multiplier' | 'percent';
}

const METRICS: ComparisonMetric[] = [
  {
    key: 'ce_multiple',
    label: 'CE',
    getValue: (c) => c.results.ce_multiple,
    format: 'multiplier',
  },
  {
    key: 'deaths_averted',
    label: 'Deaths Averted',
    getValue: (c) => c.results.deaths_averted,
    format: 'number',
  },
  {
    key: 'cost_per_life',
    label: 'Cost per Life',
    getValue: (c) => c.results.cost_per_life_saved,
    format: 'currency',
  },
  {
    key: 'children_covered',
    label: 'Children Covered',
    getValue: (c) => c.results.children_covered,
    format: 'number',
  },
  {
    key: 'additional_children',
    label: 'Additional Children',
    getValue: (c) => c.results.additional_children,
    format: 'number',
  },
  {
    key: 'counterfactual_lives',
    label: 'Counterfactual Lives Saved',
    getValue: (c) => c.results.counterfactual_lives_saved,
    format: 'number',
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

export default function VASCompare() {
  const { data, loading, error } = useVASCountryData();
  const [selected, setSelected] = useState<string[]>([]);

  const selectedCountries = useMemo(() => {
    if (!data) return [];
    return selected
      .map((id) => data.countries.find((c) => c.id === id))
      .filter(Boolean) as VASCountryData[];
  }, [data, selected]);

  const barData = useMemo(() => {
    return METRICS.slice(0, 5).map((metric) => {
      const row: Record<string, string | number> = { metric: metric.label };
      for (const c of selectedCountries) {
        row[c.display_name] = metric.getValue(c);
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
        row[selectedCountries[i].display_name] = (values[i] / max) * 100;
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
      <h1>Compare VAS Countries</h1>
      <p className="subtitle">Select up to 5 countries to compare side-by-side.</p>

      <div className="country-chips">
        {data.countries.map((c) => (
          <button
            key={c.id}
            className={`chip ${selected.includes(c.id) ? 'active' : ''}`}
            onClick={() => toggleCountry(c.id)}
          >
            {c.display_name}
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
                      <th key={c.id}>{c.display_name}</th>
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
                    name: c.display_name,
                    ce: c.results.ce_multiple,
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
                        name={c.display_name}
                        dataKey={c.display_name}
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
                      dataKey={c.display_name}
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
        <p className="hint">Select at least one country to begin comparing.</p>
      )}
    </div>
  );
}

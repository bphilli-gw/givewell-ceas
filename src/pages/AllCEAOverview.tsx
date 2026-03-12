import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountryData } from '../data/useCountryData';
import { useSMCCountryData } from '../data/useSMCCountryData';

// ============================================================================
// Types
// ============================================================================

interface MoralWeights {
  death_under5: number;
  death_over5: number;
  ln_consumption_unit: number;
  benchmark_uov_per_dollar: number;
}

interface UnifiedRow {
  id: string;
  display_name: string;
  cea_type: 'ITN' | 'SMC';
  route: string;
  orig_ce: number;
  uov_u5: number;
  uov_o5: number;
  uov_income: number;
  lives_saved: number;
  cost_per_life: number;
  mc: { p5: number; p25: number; p75: number; p95: number } | null;
}

interface CEAGroup {
  type: 'ITN' | 'SMC';
  label: string;
  description: string;
  color: string;
  rows: UnifiedRow[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WEIGHTS: MoralWeights = {
  death_under5: 116.25262,
  death_over5: 73.1914,
  ln_consumption_unit: 1.4426950408889634,
  benchmark_uov_per_dollar: 0.00333,
};

const SLIDER_CONFIG: {
  key: keyof MoralWeights;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}[] = [
  {
    key: 'death_under5',
    label: 'Under-5 death averted',
    hint: 'Default: ~116',
    min: 0, max: 250, step: 1,
    format: (v) => v.toFixed(0),
  },
  {
    key: 'death_over5',
    label: 'Over-5 death averted',
    hint: 'Default: ~73',
    min: 0, max: 200, step: 1,
    format: (v) => v.toFixed(0),
  },
  {
    key: 'ln_consumption_unit',
    label: 'ln(consumption) unit',
    hint: 'Default: 1.44',
    min: 0, max: 5, step: 0.01,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'benchmark_uov_per_dollar',
    label: 'Benchmark UOV/$',
    hint: 'Default: 0.0033',
    min: 0.001, max: 0.01, step: 0.0001,
    format: (v) => v.toFixed(4),
  },
];

const CEA_CONFIGS: { type: 'ITN' | 'SMC'; label: string; description: string; color: string }[] = [
  {
    type: 'ITN',
    label: 'Insecticide-Treated Nets',
    description: 'Nets distributed by AMF and Malaria Consortium across 26 locations.',
    color: '#2563eb',
  },
  {
    type: 'SMC',
    label: 'Seasonal Malaria Chemoprevention',
    description: 'Preventive antimalarial treatment for children across 20 locations.',
    color: '#059669',
  },
];

// ============================================================================
// Helpers
// ============================================================================

function rescaleCE(
  origCE: number, uov_u5: number, uov_o5: number, uov_income: number,
  newWeights: MoralWeights,
): number {
  const origTotal = uov_u5 + uov_o5 + uov_income;
  if (origTotal === 0) return origCE;
  const newTotal =
    uov_u5 * (newWeights.death_under5 / DEFAULT_WEIGHTS.death_under5) +
    uov_o5 * (newWeights.death_over5 / DEFAULT_WEIGHTS.death_over5) +
    uov_income * (newWeights.ln_consumption_unit / DEFAULT_WEIGHTS.ln_consumption_unit);
  const uovRatio = newTotal / origTotal;
  const benchmarkRatio = DEFAULT_WEIGHTS.benchmark_uov_per_dollar / newWeights.benchmark_uov_per_dollar;
  return origCE * uovRatio * benchmarkRatio;
}

function getCE(row: UnifiedRow, weights: MoralWeights): number {
  return rescaleCE(row.orig_ce, row.uov_u5, row.uov_o5, row.uov_income, weights);
}

function fmtCurrency(n: number): string {
  if (!isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtInt(n: number): string {
  if (!isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

// ============================================================================
// Component
// ============================================================================

export default function AllCEAOverview() {
  const { data: itnData, loading: itnLoading, error: itnError } = useCountryData();
  const { data: smcData, loading: smcLoading, error: smcError } = useSMCCountryData();
  const navigate = useNavigate();

  const [weights, setWeights] = useState<MoralWeights>({ ...DEFAULT_WEIGHTS });
  const [hoveredDot, setHoveredDot] = useState<UnifiedRow | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const loading = itnLoading || smcLoading;
  const error = itnError || smcError;

  // Build unified rows
  const allRows: UnifiedRow[] = useMemo(() => {
    const rows: UnifiedRow[] = [];
    if (itnData) {
      for (const c of itnData.countries) {
        rows.push({
          id: `itn-${c.id}`, display_name: c.display_name, cea_type: 'ITN',
          route: `/itn/country/${c.id}`,
          orig_ce: c.results.final_ce_multiple ?? 0,
          uov_u5: c.results.uov_under5_deaths ?? 0,
          uov_o5: c.results.uov_over5_deaths ?? 0,
          uov_income: c.results.uov_income ?? 0,
          lives_saved: c.results.counterfactual_lives ?? 0,
          cost_per_life: c.results.cost_per_life_counterfactual ?? 0,
          mc: c.monte_carlo ? { p5: c.monte_carlo.summary.p5, p25: c.monte_carlo.summary.p25, p75: c.monte_carlo.summary.p75, p95: c.monte_carlo.summary.p95 } : null,
        });
      }
    }
    if (smcData) {
      for (const c of smcData.countries) {
        rows.push({
          id: `smc-${c.id}`, display_name: c.display_name, cea_type: 'SMC',
          route: `/smc/country/${c.id}`,
          orig_ce: c.results.final_ce ?? 0,
          uov_u5: c.results.total_uov_under5_deaths ?? 0,
          uov_o5: c.results.total_uov_over5_deaths ?? 0,
          uov_income: c.results.total_uov_income ?? 0,
          lives_saved: c.results.counterfactual_lives_saved ?? 0,
          cost_per_life: c.results.cost_per_counterfactual_life ?? 0,
          mc: c.monte_carlo ? { p5: c.monte_carlo.summary.p5, p25: c.monte_carlo.summary.p25, p75: c.monte_carlo.summary.p75, p95: c.monte_carlo.summary.p95 } : null,
        });
      }
    }
    return rows;
  }, [itnData, smcData]);

  // Group by CEA type
  const groups: CEAGroup[] = useMemo(() => {
    return CEA_CONFIGS.map((cfg) => ({
      ...cfg,
      rows: allRows
        .filter((r) => r.cea_type === cfg.type)
        .sort((a, b) => getCE(b, weights) - getCE(a, weights)),
    }));
  }, [allRows, weights]);

  // Global scale for strip plots
  const globalScale = useMemo(() => {
    const allCEs = allRows.map((r) => getCE(r, weights));
    return { min: 0, max: Math.max(...allCEs, 1) };
  }, [allRows, weights]);

  const weightsChanged = Object.keys(DEFAULT_WEIGHTS).some(
    (k) => weights[k as keyof MoralWeights] !== DEFAULT_WEIGHTS[k as keyof MoralWeights],
  );

  if (loading) return <div className="loading">Loading CEA data...</div>;
  if (error) return <div className="error">Error loading data: {error}</div>;

  return (
    <div className="page all-cea-page">
      <div className="all-cea-header">
        <h1>GiveWell CEA Explorer</h1>
        <p className="all-cea-subtitle">
          Interactive cost-effectiveness analyses across {allRows.length} locations and{' '}
          {groups.length} intervention types. Each model is validated against the original
          spreadsheets to &lt;1e-6 tolerance. Hover over any dot to see details, click to explore.
        </p>
      </div>

      <div className="all-cea-layout">
        {/* Main content */}
        <div className="all-cea-main">
          {groups.map((group) => {
            const sorted = group.rows;
            const minCE = sorted.length > 0 ? getCE(sorted[sorted.length - 1], weights) : 0;
            const maxCE = sorted.length > 0 ? getCE(sorted[0], weights) : 0;

            return (
              <div key={group.type} className="cea-charity-card">
                <div className="charity-card-header" style={{ borderLeftColor: group.color }}>
                  <div className="charity-card-title">
                    <span className={`type-badge type-${group.type.toLowerCase()}`}>
                      {group.type}
                    </span>
                    <h3>{group.label}</h3>
                    <span className="charity-range">
                      {minCE.toFixed(0)}× – {maxCE.toFixed(0)}×
                    </span>
                  </div>
                  <p className="charity-card-desc">{group.description}</p>
                </div>

                <div className="strip-plot-area">
                  <div className="strip-plot">
                    <div
                      className="strip-range-bar"
                      style={{
                        left: `${(minCE / globalScale.max) * 100}%`,
                        width: `${((maxCE - minCE) / globalScale.max) * 100}%`,
                        backgroundColor: group.color,
                      }}
                    />
                    {sorted.map((row) => {
                      const ce = getCE(row, weights);
                      return (
                        <div
                          key={row.id}
                          className="strip-dot"
                          style={{
                            left: `${(ce / globalScale.max) * 100}%`,
                            backgroundColor: group.color,
                          }}
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setHoveredDot(row);
                            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredDot(null)}
                          onClick={() => navigate(row.route)}
                        />
                      );
                    })}
                    <div className="strip-axis">
                      <span>0×</span>
                      <span>{globalScale.max.toFixed(0)}×</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <p className="disclaimer">
            All figures assume a $1,000,000 grant size per location. CE multiples represent units of
            value per dollar relative to the benchmark. Adjusting moral weights rescales the CE
            proportionally via UOV decomposition.
          </p>
        </div>

        {/* Sidebar — Moral Weights */}
        <aside className="all-cea-sidebar">
          <div className="mw-sidebar-card">
            <div className="mw-sidebar-header">
              <h3>Moral Weights</h3>
              {weightsChanged && (
                <button className="reset-btn" onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}>
                  Reset
                </button>
              )}
            </div>
            <p className="mw-sidebar-desc">
              Adjust the value assigned to different outcomes. Changes rescale all CE multiples in
              real time.
            </p>
            <div className="mw-sidebar-sliders">
              {SLIDER_CONFIG.map((cfg) => (
                <div key={cfg.key} className="mw-slider">
                  <div className="mw-slider-label">
                    <span>{cfg.label}</span>
                    <span className="mw-slider-value">{cfg.format(weights[cfg.key])}</span>
                  </div>
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={weights[cfg.key]}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [cfg.key]: parseFloat(e.target.value) }))
                    }
                  />
                  <span className="mw-slider-hint">{cfg.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Floating tooltip */}
      {hoveredDot && (
        <div
          className="dot-tooltip"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
          }}
        >
          <div className="dot-tooltip-header">
            <span className={`type-badge type-${hoveredDot.cea_type.toLowerCase()}`}>
              {hoveredDot.cea_type}
            </span>
            <strong>{hoveredDot.display_name}</strong>
          </div>
          <div className="dot-tooltip-ce">
            {getCE(hoveredDot, weights).toFixed(1)}× benchmark
          </div>
          <div className="dot-tooltip-stats">
            <div>
              <span className="dot-tooltip-stat-label">Lives saved</span>
              <span>{fmtInt(hoveredDot.lives_saved)}</span>
            </div>
            <div>
              <span className="dot-tooltip-stat-label">Cost per life</span>
              <span>{fmtCurrency(hoveredDot.cost_per_life)}</span>
            </div>
            {hoveredDot.mc && (
              <div>
                <span className="dot-tooltip-stat-label">P5–P95</span>
                <span>
                  {hoveredDot.mc.p5.toFixed(1)}× – {hoveredDot.mc.p95.toFixed(1)}×
                </span>
              </div>
            )}
          </div>
          <div className="dot-tooltip-hint">Click to explore</div>
        </div>
      )}
    </div>
  );
}

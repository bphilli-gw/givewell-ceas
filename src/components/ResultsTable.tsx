import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CountryData } from '../model/types';

type SortKey = 'display_name' | 'final_ce_multiple' | 'deaths_averted' | 'cost_per_life' | 'grant_size';
type SortDir = 'asc' | 'desc';

function getValue(c: CountryData, key: SortKey): number | string {
  switch (key) {
    case 'display_name':
      return c.display_name;
    case 'final_ce_multiple':
      return c.results.final_ce_multiple ?? 0;
    case 'deaths_averted':
      return (c.results.deaths_averted_under5 ?? 0) + (c.results.deaths_averted_over5 ?? 0);
    case 'cost_per_life':
      return c.results.cost_per_life_counterfactual ?? Infinity;
    case 'grant_size':
      return c.inputs.cost.grant_size;
  }
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function ResultsTable({ countries }: { countries: CountryData[] }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('final_ce_multiple');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const arr = [...countries];
    arr.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = va as number;
      const nb = vb as number;
      return sortDir === 'asc' ? na - nb : nb - na;
    });
    return arr;
  }, [countries, sortKey, sortDir]);

  // Compute the max P95 for scaling the uncertainty bars
  const maxP95 = useMemo(() => {
    let max = 0;
    for (const c of countries) {
      const p95 = c.monte_carlo?.summary.p95 ?? c.results.final_ce_multiple ?? 0;
      if (p95 > max) max = p95;
    }
    return max;
  }, [countries]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'display_name' ? 'asc' : 'desc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (key !== sortKey) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
            <th className="rank-col">#</th>
            <th className="clickable" onClick={() => handleSort('display_name')}>
              Country{sortIndicator('display_name')}
            </th>
            <th className="clickable num" onClick={() => handleSort('final_ce_multiple')}>
              CE Multiple{sortIndicator('final_ce_multiple')}
            </th>
            <th className="num">Uncertainty (P5–P95)</th>
            <th className="clickable num" onClick={() => handleSort('deaths_averted')}>
              Deaths Averted{sortIndicator('deaths_averted')}
            </th>
            <th className="clickable num" onClick={() => handleSort('cost_per_life')}>
              Cost per Life{sortIndicator('cost_per_life')}
            </th>
            <th className="clickable num" onClick={() => handleSort('grant_size')}>
              Grant Size{sortIndicator('grant_size')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const totalDeaths =
              (c.results.deaths_averted_under5 ?? 0) + (c.results.deaths_averted_over5 ?? 0);
            const mc = c.monte_carlo;
            const ce = c.results.final_ce_multiple ?? 0;

            return (
              <tr
                key={c.id}
                className="clickable-row"
                onClick={() => navigate(`/country/${c.id}`)}
              >
                <td className="rank-col">{i + 1}</td>
                <td>{c.display_name}</td>
                <td className="num highlight">{fmt(c.results.final_ce_multiple)}x</td>
                <td className="num uncertainty-cell">
                  {mc ? (
                    <div className="uncertainty-bar-wrapper">
                      <span className="uncertainty-range">
                        {mc.summary.p5.toFixed(1)}–{mc.summary.p95.toFixed(1)}x
                      </span>
                      <div className="uncertainty-bar">
                        {/* P5–P95 range (light) */}
                        <div
                          className="uncertainty-bar-outer"
                          style={{
                            left: `${(mc.summary.p5 / maxP95) * 100}%`,
                            width: `${((mc.summary.p95 - mc.summary.p5) / maxP95) * 100}%`,
                          }}
                        />
                        {/* P25–P75 range (dark) */}
                        <div
                          className="uncertainty-bar-inner"
                          style={{
                            left: `${(mc.summary.p25 / maxP95) * 100}%`,
                            width: `${((mc.summary.p75 - mc.summary.p25) / maxP95) * 100}%`,
                          }}
                        />
                        {/* Point estimate marker */}
                        <div
                          className="uncertainty-bar-point"
                          style={{
                            left: `${(ce / maxP95) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="num">{fmt(totalDeaths, 1)}</td>
                <td className="num">{fmtCurrency(c.results.cost_per_life_counterfactual)}</td>
                <td className="num">{fmtCurrency(c.inputs.cost.grant_size)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

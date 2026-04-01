import { useState, type ReactNode } from 'react';
import type { SourceEntry } from '../data/useSourceData';

export interface Row {
  label: string;
  value: number | string | null | undefined;
  format?: 'number' | 'currency' | 'percent' | 'multiplier';
  indent?: boolean;
  highlight?: boolean;
  tooltip?: string;
  source?: SourceEntry;
}

function formatValue(value: number | string | null | undefined, format?: string): string {
  if (value == null) return '\u2014';
  if (typeof value === 'string') return value;
  if (!isFinite(value)) return '\u2014';

  switch (format) {
    case 'currency':
      return '$' + Math.round(value).toLocaleString('en-US');
    case 'percent':
      return Math.round(value * 100) + '%';
    case 'multiplier':
      return value.toFixed(1) + 'x';
    case 'number':
      return Math.round(value).toLocaleString('en-US');
    default:
      if (Math.abs(value) >= 1000) {
        return Math.round(value).toLocaleString('en-US');
      }
      if (Math.abs(value) < 0.0001 && value !== 0) {
        return value.toExponential(4);
      }
      return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
}

function SourceBadge({ source }: { source: SourceEntry }) {
  if (source.type === 'calculated') return null;

  const typeClass = `source-badge source-badge--${source.type}`;
  const title = source.additional_sources
    ? `${source.source} (also: ${source.additional_sources.join(', ')})`
    : source.source;

  return (
    <span className="source-badges">
      <span className={typeClass} title={title}>
        {source.source}
      </span>
      {source.report_url && (
        <a
          href={source.report_url}
          target="_blank"
          rel="noopener noreferrer"
          className="report-link"
          title={source.report_section ? `See: ${source.report_section}` : 'View in intervention report'}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
          </svg>
        </a>
      )}
    </span>
  );
}

interface Props {
  title: string;
  rows: Row[];
  defaultOpen?: boolean;
  children?: ReactNode;
}

export default function CalculationSection({ title, rows, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="calc-section">
      <button className="calc-section-header" onClick={() => setOpen(!open)}>
        <span className="calc-section-arrow">{open ? '\u25BC' : '\u25B6'}</span>
        <span className="calc-section-title">{title}</span>
      </button>
      {open && (
        <div className="calc-section-body">
          {children}
          <table className="calc-table">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={row.highlight ? 'highlight-row' : ''}>
                  <td className={row.indent ? 'indent' : ''}>
                    {row.label}
                    {row.source && <SourceBadge source={row.source} />}
                  </td>
                  <td className="num">
                    {row.tooltip ? (
                      <span className="has-tooltip">
                        {formatValue(row.value, row.format)}
                        <span className="tooltip-text">{row.tooltip}</span>
                      </span>
                    ) : (
                      formatValue(row.value, row.format)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState, type ReactNode } from 'react';

interface Row {
  label: string;
  value: number | string | null | undefined;
  format?: 'number' | 'currency' | 'percent' | 'multiplier';
  indent?: boolean;
  highlight?: boolean;
}

function formatValue(value: number | string | null | undefined, format?: string): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (!isFinite(value)) return '—';

  switch (format) {
    case 'currency':
      return '$' + Math.round(value).toLocaleString('en-US');
    case 'percent':
      return (value * 100).toFixed(2) + '%';
    case 'multiplier':
      return value.toFixed(3) + 'x';
    default:
      if (Math.abs(value) >= 1000) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
      }
      if (Math.abs(value) < 0.0001 && value !== 0) {
        return value.toExponential(4);
      }
      return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
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
                  <td className={row.indent ? 'indent' : ''}>{row.label}</td>
                  <td className="num">{formatValue(row.value, row.format)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

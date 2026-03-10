/**
 * FlowNode — a single calculation step in a flow diagram.
 *
 * Displays a label, optional formula, one or more values, and a
 * color-coded left border indicating the data category.
 */

export type NodeCategory =
  | 'empirical'   // blue — measured / observed data
  | 'subjective'  // amber — GiveWell staff judgment
  | 'calculated'  // gray — derived from other values
  | 'output'      // green — feeds into downstream sheets
  | 'upstream';   // purple — from another supplementary sheet

export interface FlowNodeValue {
  label?: string;   // e.g. "Year 1" — omit for single-value nodes
  value: number | string;
  format?: 'number' | 'percent' | 'year' | 'raw';
}

export interface FlowNodeProps {
  title: string;
  category: NodeCategory;
  formula?: string;           // displayed in monospace below the title
  values: FlowNodeValue[];
  annotation?: string;        // small muted text below values
  wide?: boolean;             // take more horizontal space
}

function formatValue(v: FlowNodeValue): string {
  if (typeof v.value === 'string') return v.value;
  const fmt = v.format ?? 'number';
  switch (fmt) {
    case 'percent':
      return `${(v.value * 100).toFixed(1)}%`;
    case 'year':
      return v.value.toFixed(v.value % 1 === 0 ? 0 : 2);
    case 'raw':
      return String(v.value);
    default:
      // Smart formatting: more decimals for small numbers
      if (Math.abs(v.value) < 0.001 && v.value !== 0)
        return v.value.toExponential(3);
      if (Math.abs(v.value) < 1)
        return v.value.toFixed(4);
      return v.value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
}

export default function FlowNode({
  title,
  category,
  formula,
  values,
  annotation,
  wide,
}: FlowNodeProps) {
  return (
    <div className={`flow-node flow-node--${category}${wide ? ' flow-node--wide' : ''}`}>
      <div className="flow-node__title">{title}</div>
      {formula && <div className="flow-node__formula">{formula}</div>}
      <div className="flow-node__values">
        {values.map((v, i) => (
          <div key={i} className="flow-node__value-row">
            {v.label && <span className="flow-node__value-label">{v.label}</span>}
            <span className="flow-node__value">{formatValue(v)}</span>
          </div>
        ))}
      </div>
      {annotation && <div className="flow-node__annotation">{annotation}</div>}
    </div>
  );
}

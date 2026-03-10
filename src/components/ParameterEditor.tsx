import { useState, useCallback } from 'react';
import type { CountryData } from '../model/types';
import { calculateMainCEA } from '../model/cea';
import type { MainCEAResult } from '../model/types';

interface ParamDef {
  key: string;
  label: string;
  path: string[];  // path into inputs object
  format: 'currency' | 'percent' | 'number' | 'multiplier';
  step?: number;
  min?: number;
  max?: number;
}

const EDITABLE_PARAMS: ParamDef[] = [
  { key: 'grant_size', label: 'Grant Size ($)', path: ['cost', 'grant_size'], format: 'currency', step: 100000, min: 0 },
  { key: 'cost_per_net', label: 'Cost per Net ($)', path: ['cost', 'cost_per_net'], format: 'currency', step: 0.1, min: 0.1 },
  { key: 'death_under5', label: 'Moral Weight: Death <5', path: ['value_weights', 'death_under5'], format: 'number', step: 1, min: 0 },
  { key: 'death_over5', label: 'Moral Weight: Death 5+', path: ['value_weights', 'death_over5'], format: 'number', step: 1, min: 0 },
  { key: 'ln_consumption_unit', label: 'Value per ln(consumption)', path: ['value_weights', 'ln_consumption_unit'], format: 'number', step: 0.1, min: 0 },
  { key: 'discount_rate', label: 'Discount Rate', path: ['economic', 'discount_rate'], format: 'percent', step: 0.005, min: 0, max: 0.2 },
  { key: 'internal_validity_adj', label: 'Internal Validity Adj', path: ['efficacy', 'internal_validity_adj'], format: 'percent', step: 0.01 },
  { key: 'external_validity_adj', label: 'External Validity Adj', path: ['efficacy', 'external_validity_adj'], format: 'percent', step: 0.01 },
  { key: 'proportion_used', label: 'ITN Usage Rate', path: ['net_distribution', 'proportion_used'], format: 'percent', step: 0.01, min: 0, max: 1 },
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

function displayValue(val: number, format: string): string {
  switch (format) {
    case 'currency':
      return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
    case 'percent':
      return (val * 100).toFixed(1);
    case 'multiplier':
      return val.toFixed(3);
    default:
      return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
}

function parseInput(val: string, format: string): number {
  const n = parseFloat(val.replace(/,/g, ''));
  if (format === 'percent') return n / 100;
  return n;
}

interface Props {
  country: CountryData;
  globalPhysicalAdjusted: number;
  onRecalculate: (result: MainCEAResult | null, modifiedInputs: Record<string, unknown>) => void;
}

export default function ParameterEditor({ country, globalPhysicalAdjusted, onRecalculate }: Props) {
  const [inputs, setInputs] = useState<Record<string, unknown>>(
    JSON.parse(JSON.stringify(country.inputs))
  );
  const [modified, setModified] = useState<Set<string>>(new Set());

  const handleChange = useCallback(
    (param: ParamDef, rawValue: string) => {
      const numValue = parseInput(rawValue, param.format);
      if (isNaN(numValue)) return;

      const newInputs = setNestedValue(inputs, param.path, numValue) as Record<string, unknown>;
      setInputs(newInputs);
      setModified((prev) => new Set(prev).add(param.key));

      // Recalculate
      const result = calculateMainCEA(
        newInputs as unknown as CountryData['inputs'],
        country.supplementary,
        globalPhysicalAdjusted
      );
      onRecalculate(result, newInputs);
    },
    [inputs, country, onRecalculate]
  );

  const handleReset = useCallback(() => {
    const original = JSON.parse(JSON.stringify(country.inputs));
    setInputs(original);
    setModified(new Set());
    // Pass null to restore original pre-computed results
    onRecalculate(null, original);
  }, [country, onRecalculate]);

  return (
    <div className="param-editor">
      <div className="param-editor-header">
        <h3>Edit Parameters</h3>
        {modified.size > 0 && (
          <button className="reset-btn" onClick={handleReset}>
            Reset All
          </button>
        )}
      </div>
      <div className="param-list">
        {EDITABLE_PARAMS.map((param) => {
          const currentVal = getNestedValue(inputs as Record<string, unknown>, param.path);
          const isModified = modified.has(param.key);
          return (
            <div key={param.key} className={`param-row ${isModified ? 'modified' : ''}`}>
              <label className="param-label">{param.label}</label>
              <div className="param-input-wrapper">
                {param.format === 'currency' && <span className="param-prefix">$</span>}
                <input
                  type="number"
                  className="param-input"
                  value={displayValue(currentVal, param.format)}
                  step={param.format === 'percent' ? (param.step ?? 0.01) * 100 : param.step}
                  min={param.min != null ? (param.format === 'percent' ? param.min * 100 : param.min) : undefined}
                  max={param.max != null ? (param.format === 'percent' ? param.max * 100 : param.max) : undefined}
                  onChange={(e) => handleChange(param, e.target.value)}
                />
                {param.format === 'percent' && <span className="param-suffix">%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

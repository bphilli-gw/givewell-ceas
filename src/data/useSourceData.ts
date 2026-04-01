import { useState, useEffect, useCallback } from 'react';

export interface SourceEntry {
  source: string;
  type: 'academic' | 'data' | 'analysis' | 'estimate' | 'judgment' | 'input' | 'calculated';
  additional_sources?: string[];
  report_url?: string;
  report_section?: string;
}

type SourceMap = Record<string, SourceEntry>;

const cache: Partial<Record<string, SourceMap>> = {};

function useSourceMap(ceaType: string) {
  const cached = cache[ceaType] ?? null;
  const [sources, setSources] = useState<SourceMap | null>(cached);

  useEffect(() => {
    if (cached) return;

    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/${ceaType}_sources.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SourceMap) => {
        cache[ceaType] = json;
        setSources(json);
      })
      .catch(() => {
        // Sources are non-critical; fail silently
        setSources({});
      });
  }, [ceaType, cached]);

  const getSource = useCallback(
    (label: string): SourceEntry | undefined => sources?.[label],
    [sources]
  );

  return { sources, getSource };
}

export function useITNSources() {
  return useSourceMap('itn');
}

export function useSMCSources() {
  return useSourceMap('smc');
}

export function useVASSources() {
  return useSourceMap('vas');
}

export function useNISources() {
  return useSourceMap('ni');
}

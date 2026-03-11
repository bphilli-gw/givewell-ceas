import { useState, useEffect, useCallback } from 'react';

export interface SourceEntry {
  source: string;
  type: 'academic' | 'data' | 'analysis' | 'estimate' | 'judgment' | 'input' | 'calculated';
  additional_sources?: string[];
}

type SourceMap = Record<string, SourceEntry>;

let cachedITN: SourceMap | null = null;
let cachedSMC: SourceMap | null = null;

function useSourceMap(ceaType: 'itn' | 'smc') {
  const cached = ceaType === 'itn' ? cachedITN : cachedSMC;
  const [sources, setSources] = useState<SourceMap | null>(cached);

  useEffect(() => {
    if (cached) return;

    const base = import.meta.env.BASE_URL;
    const file = ceaType === 'itn' ? 'itn_sources.json' : 'smc_sources.json';
    fetch(`${base}data/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SourceMap) => {
        if (ceaType === 'itn') cachedITN = json;
        else cachedSMC = json;
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

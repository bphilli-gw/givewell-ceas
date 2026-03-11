import { useState, useEffect } from 'react';
import type { SMCCountriesData, SMCCountryData } from '../model/smc-types';

let cachedData: SMCCountriesData | null = null;

export function useSMCCountryData() {
  const [data, setData] = useState<SMCCountriesData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) return;

    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/smc_countries.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SMCCountriesData) => {
        cachedData = json;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useSMCCountry(id: string | undefined): {
  country: SMCCountryData | null;
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useSMCCountryData();
  const country = data?.countries.find((c) => c.id === id) ?? null;
  return { country, loading, error };
}

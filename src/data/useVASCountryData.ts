import { useState, useEffect } from 'react';
import type { VASCountriesData, VASCountryData } from '../model/vas-types';

let cachedData: VASCountriesData | null = null;

export function useVASCountryData() {
  const [data, setData] = useState<VASCountriesData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) return;

    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/vas_countries.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: VASCountriesData) => {
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

export function useVASCountry(id: string | undefined): {
  country: VASCountryData | null;
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useVASCountryData();
  const country = data?.countries.find((c) => c.id === id) ?? null;
  return { country, loading, error };
}

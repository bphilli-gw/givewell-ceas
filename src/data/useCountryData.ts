import { useState, useEffect } from 'react';
import type { CountriesData, CountryData } from '../model/types';

let cachedData: CountriesData | null = null;

export function useCountryData() {
  const [data, setData] = useState<CountriesData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) return;

    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/countries.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: CountriesData) => {
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

export function useCountry(id: string | undefined): {
  country: CountryData | null;
  globalPhysicalAdjusted: number;
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useCountryData();
  const country = data?.countries.find((c) => c.id === id) ?? null;
  const globalPhysicalAdjusted = data?.global_physical_adjusted ?? 0;
  return { country, globalPhysicalAdjusted, loading, error };
}

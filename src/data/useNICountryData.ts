import { useState, useEffect } from 'react';
import type { NICountriesData, NICountryData } from '../model/ni-types';

let cachedData: NICountriesData | null = null;

export function useNICountryData() {
  const [data, setData] = useState<NICountriesData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) return;

    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/ni_countries.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: NICountriesData) => {
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

export function useNICountry(id: string | undefined): {
  country: NICountryData | null;
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useNICountryData();
  const country = data?.countries.find((c) => c.id === id) ?? null;
  return { country, loading, error };
}

import { useState, useEffect } from 'react';

export const useNetwork = () => {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNetwork = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8787/api/network', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setNetwork(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      clearTimeout(timeoutId);
      setError('Local monitoring service is unavailable');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  return { network, loading, error, fetchNetwork };
};

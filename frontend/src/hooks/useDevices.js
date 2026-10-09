import { useState, useEffect } from 'react';

export const useDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8787/api/devices', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDevices(data.devices || []);
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
    fetchDevices();
  }, []);

  const triggerScan = async () => {
    try {
      setLoading(true);
      await fetch('http://localhost:8787/api/scan', { method: 'POST' });
      // The websocket will update the devices when scan is complete
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return { devices, loading, error, triggerScan, fetchDevices, setDevices };
};

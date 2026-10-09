import { useState, useCallback } from 'react';

const STORAGE_KEY = 'device_aliases_v1';

/**
 * Build a stable, network-scoped alias key for a device.
 * Priority: MAC > hostname > ip+networkId
 */
export const getAliasKey = (device, networkId = '') => {
  if (device.mac && device.mac !== 'N/A') {
    // MAC is globally stable; prefix with 'mac:'
    return `mac:${device.mac.toUpperCase()}`;
  }
  if (device.hostname && device.hostname !== '_gateway') {
    return `host:${device.hostname.toLowerCase()}`;
  }
  // IP-based key is scoped to the current networkId to avoid DHCP confusion
  return `ip:${networkId}:${device.ip}`;
};

const loadAliases = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveAliases = (aliases) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aliases));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
};

export const useDeviceAliases = () => {
  const [aliases, setAliases] = useState(() => loadAliases());

  const setAlias = useCallback((device, newName, networkId = '') => {
    const key = getAliasKey(device, networkId);
    setAliases(prev => {
      const updated = { ...prev, [key]: newName.trim() };
      saveAliases(updated);
      return updated;
    });
  }, []);

  const removeAlias = useCallback((device, networkId = '') => {
    const key = getAliasKey(device, networkId);
    setAliases(prev => {
      const updated = { ...prev };
      delete updated[key];
      saveAliases(updated);
      return updated;
    });
  }, []);

  const getAlias = useCallback((device, networkId = '') => {
    const key = getAliasKey(device, networkId);
    return aliases[key] || null;
  }, [aliases]);

  return { aliases, setAlias, removeAlias, getAlias };
};

import { getDeviceCategory } from './deviceUtils';

export const filterDevices = (devices, searchQuery, filterType) => {
  let filtered = devices;

  // Apply filterType
  if (filterType !== 'All') {
    if (filterType === 'Active') {
      filtered = filtered.filter(d => d.status === 'active' || d.status === 'recently_seen');
    } else {
      filtered = filtered.filter(d => getDeviceCategory(d) === filterType);
    }
  }

  // Apply searchQuery — search against enriched _displayName + _alias + raw fields
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(d => {
      // Prefer pre-computed _displayName from buildDisplayNames
      const display = (d._displayName || d.name || '').toLowerCase();
      const alias = (d._alias || '').toLowerCase();
      return (
        display.includes(q) ||
        alias.includes(q) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.hostname && d.hostname.toLowerCase().includes(q)) ||
        (d.type && d.type.toLowerCase().includes(q)) ||
        (d.ip && d.ip.includes(q)) ||
        (d.mac && d.mac.toLowerCase().includes(q)) ||
        (d.manufacturer && d.manufacturer.toLowerCase().includes(q))
      );
    });
  }

  return filtered;
};

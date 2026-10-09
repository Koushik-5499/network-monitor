const { getManufacturer } = require('./oui');
const { classifyDevice, generateDisplayName } = require('../utils/classification');

async function mergeDevices(allRawDevices, existingDevices = [], currentNetwork = null) {
  let gatewayMac = null;
  if (currentNetwork && currentNetwork.gateway) {
    const gwRaw = allRawDevices.find(d => d.ip === currentNetwork.gateway && d.mac);
    if (gwRaw) gatewayMac = gwRaw.mac;
    
    // Cleanup proxy MACs in existing devices that might have been stored previously
    if (gatewayMac) {
      existingDevices.forEach(d => {
        if (d.mac === gatewayMac && d.ip !== currentNetwork.gateway) {
          d.mac = null;
        }
      });
    }
  }

  // First, group all raw devices from this scan by IP
  const scanByIp = new Map();
  for (const raw of allRawDevices) {
    if (!raw.ip) continue;

    // Reject proxy ARP (gateway MAC on non-gateway IPs)
    if (gatewayMac && raw.mac === gatewayMac && raw.ip !== currentNetwork.gateway) {
      raw.mac = null;
      raw.isProxyArp = true;
    }

    if (!scanByIp.has(raw.ip)) {
      scanByIp.set(raw.ip, {
        ip: raw.ip,
        mac: raw.mac || null,
        hostname: raw.hostname || null,
        explicitName: raw.explicitName || null,
        manufacturer: raw.manufacturer || 'Unknown',
        sources: new Set(),
        isProxyArp: raw.isProxyArp || false
      });
    }
    const grouped = scanByIp.get(raw.ip);
    if (raw.source) grouped.sources.add(raw.source);
    if (raw.isProxyArp) grouped.isProxyArp = true;
    if (!grouped.mac && raw.mac) grouped.mac = raw.mac;
    if (!grouped.hostname && raw.hostname) grouped.hostname = raw.hostname;
    if (!grouped.explicitName && raw.explicitName) grouped.explicitName = raw.explicitName;
    if (grouped.manufacturer === 'Unknown' && raw.manufacturer) grouped.manufacturer = raw.manufacturer;
  }

  const finalDevicesMap = new Map(); // Keyed by MAC (if available) or IP
  const ipToKey = new Map(); // Index IP -> Key

  // Keep existing devices, keyed by MAC || IP
  existingDevices.forEach(d => {
    const key = d.mac || d.ip;
    finalDevicesMap.set(key, { ...d, sources: new Set(d.sources), status: 'recently_seen' });
    if (d.ip) ipToKey.set(d.ip, key);
  });

  // Now merge this scan's grouped devices into the final map
  for (const raw of scanByIp.values()) {
    let key = raw.mac;
    let isConflict = false;
    
    if (key && finalDevicesMap.has(key)) {
      const existingMacDevice = finalDevicesMap.get(key);
      if (existingMacDevice.ip && raw.ip && existingMacDevice.ip !== raw.ip) {
        // Conflict! The MAC belongs to IP_A, but raw is IP_B.
        isConflict = true;
        existingMacDevice.conflict = true;
        // Do not merge into the MAC key. Fall back to IP key.
        key = null;
      }
    }
    
    if (key && !finalDevicesMap.has(key)) {
      // If we don't have it by MAC, check if we have it by IP (from a previous scan where MAC was unknown)
      if (ipToKey.has(raw.ip)) {
        const oldKey = ipToKey.get(raw.ip);
        const existing = finalDevicesMap.get(oldKey);
        if (!existing.mac) { // It didn't have a MAC before, so let's adopt this MAC
          finalDevicesMap.delete(oldKey);
          finalDevicesMap.set(key, existing);
          ipToKey.set(raw.ip, key);
        }
      }
    }
    
    if (!key) {
      // If raw has no MAC or it's a conflict, see if we already have a device with this IP
      if (ipToKey.has(raw.ip)) {
        key = ipToKey.get(raw.ip);
      } else {
        key = raw.ip;
      }
    }

    if (!finalDevicesMap.has(key)) {
      finalDevicesMap.set(key, {
        id: `dev_${Buffer.from(key).toString('hex').substring(0, 8)}_${Date.now()}`,
        ip: raw.ip,
        mac: raw.mac || null,
        hostname: raw.hostname || null,
        explicitName: raw.explicitName || null,
        manufacturer: raw.manufacturer || 'Unknown',
        sources: new Set(),
        status: 'active',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
      if (raw.ip) ipToKey.set(raw.ip, key);
    }

    const device = finalDevicesMap.get(key);
    device.lastSeen = new Date().toISOString();
    if (isConflict) device.conflict = true;
    
    // Evaluate evidence strength
    let newStatus = 'active';
    let confLevel = 'low';
    
    const hasMac = Boolean(device.mac || raw.mac);
    const hasHostname = Boolean(device.hostname || raw.hostname);
    const hasExplicitName = Boolean(device.explicitName || raw.explicitName);
    const hasMDNS = raw.sources.has('mDNS') || device.sources.has('mDNS');
    const hasNetBIOS = raw.sources.has('NetBIOS') || device.sources.has('NetBIOS');
    
    if (!hasMac && !hasHostname && !hasExplicitName && !hasMDNS && !hasNetBIOS) {
      if (raw.isProxyArp) {
        newStatus = 'proxy_arp';
      } else {
        newStatus = 'unconfirmed';
      }
    } else {
      newStatus = 'active';
      if (hasExplicitName || (hasHostname && hasHostname !== 'Unknown')) {
        confLevel = 'high';
      } else if (hasMac || hasMDNS || hasNetBIOS) {
        confLevel = 'medium';
      }
    }
    
    device.status = newStatus;
    device.confidence = confLevel;
    
    // Update IP in case the MAC remained the same but IP changed (only if not a conflict)
    if (raw.ip && !isConflict) device.ip = raw.ip;
    
    for (const src of raw.sources) device.sources.add(src);
    // Don't assign conflicting MAC
    if (!device.mac && raw.mac && !isConflict) device.mac = raw.mac;
    if (!device.hostname && raw.hostname) device.hostname = raw.hostname;
    if (!device.explicitName && raw.explicitName) device.explicitName = raw.explicitName;
    if (device.manufacturer === 'Unknown' && raw.manufacturer) device.manufacturer = raw.manufacturer;
  }

  const results = [];
  for (const device of finalDevicesMap.values()) {
    if (!device.mac && device.ip) {
      // Check if we can infer something or leave as is
    }

    if (device.mac && (!device.manufacturer || device.manufacturer === 'Unknown')) {
      device.manufacturer = await getManufacturer(device.mac);
    }

    device.type = classifyDevice(device.explicitName || device.hostname, device.manufacturer, device.hostname);
    
    if (currentNetwork && device.ip === currentNetwork.gateway) {
      device.type = 'Gateway/Router';
      device.displayName = 'Network Gateway';
      device.name = 'Network Gateway';
    } else {
      device.displayName = generateDisplayName(device.hostname, device.manufacturer, device.explicitName, device.type);
      device.name = device.displayName;
    }

    // Convert Set to Array for JSON
    const finalDevice = { ...device, sources: Array.from(device.sources) };
    delete finalDevice.explicitName;
    delete finalDevice.isProxyArp;
    results.push(finalDevice);
  }

  return results;
}

module.exports = { mergeDevices };

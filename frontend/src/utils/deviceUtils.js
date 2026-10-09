// ─────────────────────────────────────────────────────────────────────────────
// Hostname Normalization
// Converts raw mDNS hostnames like "sujithRs-MacBook-Neo.local"
// into readable strings like "sujithR's MacBook Neo"
// ─────────────────────────────────────────────────────────────────────────────
export const normalizeHostname = (hostname) => {
  if (!hostname) return null;

  let hn = hostname;

  // Strip .local suffix
  if (hn.endsWith('.local')) hn = hn.slice(0, -6);

  // Skip internal system names
  if (hn === '_gateway' || hn.startsWith('_')) return null;

  // Android_ prefix → Android XXXX
  if (/^Android_/i.test(hn)) {
    return hn; // wait, prompt says "Android_XXXX.local -> Android_XXXX". The earlier prompt said "Android XXXX". Let me re-read:
    // "For: Android_XXXX.local show: Android_XXXX". OK, just return hn since .local is stripped.
  }

  // PC-NN or LAPTOP-XXXXX style (Windows) — keep as-is, uppercase
  if (/^(PC-|DESKTOP-|LAPTOP-)/i.test(hn)) {
    return hn.toUpperCase();
  }

  // Pattern: "PersonNames-Device-Type" → "PersonName's Device Type"
  const apostropheMatch = hn.match(/^(.+?)s-(.+)$/i);
  if (apostropheMatch) {
    const [, owner, device] = apostropheMatch;
    const deviceWords = ['macbook', 'laptop', 'desktop', 'iphone', 'ipad', 'pc', 'imac'];
    if (!deviceWords.some(w => owner.toLowerCase().startsWith(w))) {
      const friendlyDevice = device.replace(/-/g, ' ');
      return `${owner}'s ${friendlyDevice}`;
    }
  }

  // Fallback: replace hyphens with spaces for specific types? 
  // Wait, if it's "GoogleTV7952", leave it alone. If it's "POCO X3 Pro", leave it.
  // We only replace hyphens if there are hyphens and it doesn't match above, but maybe just return as is?
  // Let's just replace hyphens with spaces for remaining, or maybe keep as is?
  // I will just leave hyphens to be spaces, but the prompt says: "DESKTOP-XXXX -> DESKTOP-XXXX". Handled above.
  // "Android_HBO1NP3B -> Android_HBO1NP3B". Handled above.
  if (hn.includes('-')) {
    return hn.replace(/-/g, ' ');
  }
  return hn;
};

// ─────────────────────────────────────────────────────────────────────────────
// Device Category (unchanged logic — used by filters & summary cards)
// ─────────────────────────────────────────────────────────────────────────────
export const getDeviceCategory = (device) => {
  if (!device) return 'Unknown';
  if ((device.status || '').toLowerCase() === 'proxy_arp') return 'Proxy-ARP';

  const t = (device.type || '').toLowerCase();
  const m = (device.manufacturer || '').toLowerCase();
  const hn = (device.hostname || '').toLowerCase();
  const name = (device.name || '').toLowerCase();
  const dname = (device.displayName || '').toLowerCase();

  const matches = (str) =>
    t.includes(str) || m.includes(str) || hn.includes(str) || name.includes(str) || dname.includes(str);

  if (matches('macbook') || matches('apple') || matches('ipad') || matches('iphone') ||
      matches('mac mini') || matches('imac')) return 'Apple';

  // Android MUST NOT become Linux
  if (matches('android') || matches('poco') || matches('samsung') || matches('pixel') ||
      matches('xiaomi') || matches('mi-connect') || matches('realme') || matches('oppo') ||
      matches('oneplus') || matches('vivo') || matches('motorola')) return 'Android';

  if (matches('windows') || matches('desktop-') || matches('laptop-')) return 'Windows';

  // Linux only if explicitly identified and NOT android
  if (matches('linux') || matches('ubuntu') || matches('debian') ||
      matches('fedora') || matches('raspberry')) return 'Linux';

  if (matches('printer') || matches('epson') || matches('canon') || matches('kyocera')) return 'Printer';

  if (t === 'network device' || t === 'gateway/router' || t === 'router' ||
      matches('gateway') || matches('router') || matches('ubiquiti') ||
      matches('netgear') || matches('cisco') || matches('tp-link')) return 'Network';

  if (matches('smart tv') || matches('tv') || matches('chromecast') ||
      matches('roku') || matches('sonos') || matches('homepod') ||
      matches('alexa') || matches('echo') || matches('googletv')) return 'IoT';

  return 'Unknown';
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Display Name Pipeline
// ─────────────────────────────────────────────────────────────────────────────
export const getDisplayNameInfo = (device, alias = null, fallbackIndex = null) => {
  // 1. User alias
  if (alias) return { name: alias, source: 'user_alias' };

  // Proxy-ARP
  if ((device.status || '').toLowerCase() === 'proxy_arp') {
    const n = fallbackIndex !== null ? String(fallbackIndex).padStart(2, '0') : '';
    return { name: `Proxy ARP ${n}`.trim(), source: 'generated' };
  }

  // 2 & 3. Explicit backend name (mDNS / service name)
  const hasExplicitName = (v) => v && v !== 'Unknown Device' && v !== 'Unknown';
  if (hasExplicitName(device.displayName)) return { name: device.displayName, source: 'mdns_explicit' };
  if (hasExplicitName(device.name)) return { name: device.name, source: 'mdns_product' };

  // 4. Normalize hostname
  if (device.hostname) {
    const norm = normalizeHostname(device.hostname);
    if (norm) {
      if (/^Android_/i.test(norm)) {
          // just return it, though the category will be Android
      }
      return { name: norm, source: 'hostname' };
    }
  }

  // 5. Manufacturer + confirmed type
  const mfg = (device.manufacturer || '').trim();
  const typ = (device.type || '').trim();
  const mfgValid = mfg && mfg !== 'Unknown' && mfg !== 'Randomized MAC';
  const typValid = typ && typ !== 'Unknown Device';

  if (mfgValid && typValid) {
    if (typ.toLowerCase().includes(mfg.toLowerCase())) return { name: typ, source: 'manufacturer' };
    return { name: `${mfg} ${typ}`, source: 'manufacturer' };
  }

  // 6. Manufacturer + Generic Type
  if (mfgValid) {
    const cat = getDeviceCategory(device);
    let name = `${mfg} Device`;
    if (cat === 'Android') name = `${mfg} Phone`;
    else if (cat === 'Apple') name = `${mfg} Device`;
    else if (cat === 'Printer') name = `${mfg} Printer`;
    else if (cat === 'Network') name = `${mfg} Network Device`;
    return { name, source: 'manufacturer' };
  }

  // 7. Device Type
  if (typValid) return { name: typ, source: 'type' };

  // 8. Generated friendly name
  const cat = getDeviceCategory(device);
  const n = fallbackIndex !== null ? ' ' + String(fallbackIndex).padStart(2, '0') : '';
  const catNames = {
    Apple:     `Apple Device${n}`,
    Android:   `Android Phone${n}`,
    Windows:   `Windows Laptop${n}`,
    Linux:     `Linux Device${n}`,
    Network:   `Network Device${n}`,
    Printer:   `Printer${n}`,
    IoT:       `Smart TV${n}`,
  };
  if (catNames[cat]) return { name: catNames[cat], source: 'generated' };

  // 9. Unidentified Device
  return { 
    name: fallbackIndex !== null ? `Unidentified Device ${String(fallbackIndex).padStart(2, '0')}` : 'Unidentified Device',
    source: 'unknown'
  };
};

export const getDisplayName = (device, alias = null, fallbackIndex = null) => {
  return getDisplayNameInfo(device, alias, fallbackIndex).name;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build numbered display names
// ─────────────────────────────────────────────────────────────────────────────
export const buildDisplayNames = (devices, aliasGetter = () => null) => {
  const counters = {};

  return devices.map((device) => {
    const alias = aliasGetter(device);

    const hasExplicit =
      (device.displayName && device.displayName !== 'Unknown Device') ||
      (device.name && device.name !== 'Unknown Device') ||
      device.hostname ||
      (device.manufacturer && device.manufacturer !== 'Unknown' && device.manufacturer !== 'Randomized MAC') ||
      (device.type && device.type !== 'Unknown Device');

    let index = null;
    if (!alias && !hasExplicit && (device.status || '').toLowerCase() !== 'proxy_arp') {
      const cat = getDeviceCategory(device);
      counters[cat] = (counters[cat] || 0) + 1;
      index = counters[cat];
    } else if ((device.status || '').toLowerCase() === 'proxy_arp') {
      counters['proxy_arp'] = (counters['proxy_arp'] || 0) + 1;
      index = counters['proxy_arp'];
    }

    const { name, source } = getDisplayNameInfo(device, alias, index);

    return {
      ...device,
      _displayName: name,
      displayName: name,
      _alias: alias,
      nameSource: source,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Determine Device Group for Sorting
// ─────────────────────────────────────────────────────────────────────────────
export const getDeviceGroup = (device) => {
  if ((device.status || '').toLowerCase() === 'proxy_arp') return 7;
  
  const ns = device.nameSource;
  if (ns === 'user_alias') return 1;
  if (ns === 'mdns_explicit' || ns === 'mdns_product') return 2;
  if (ns === 'hostname') return 3;
  if (ns === 'manufacturer' || ns === 'type') return 4;
  if (ns === 'generated') return 5;
  if (ns === 'unknown') return 6;
  
  return 6;
};

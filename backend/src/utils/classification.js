function classifyDevice(name, manufacturer, hostname) {
  const n = (name || '').toLowerCase();
  const m = (manufacturer || '').toLowerCase();
  const h = (hostname || '').toLowerCase();

  const combined = `${n} ${m}`; // Exclude raw hostname from most broad checks

  // Explicit TVs
  if (combined.includes('tv') || h.includes('googletv') || combined.includes('chromecast') || combined.includes('roku')) return 'Smart TV';

  // Printers
  if (combined.includes('printer') || h.includes('printer') || combined.includes('airprint') || combined.includes('ipp') || m.includes('kyocera') || m.includes('epson') || m.includes('brother') || m.includes('canon')) return 'Printer';

  // Apple
  if (combined.includes('macbook air') || h.includes('macbook-air')) return 'MacBook Air';
  if (combined.includes('macbook pro') || h.includes('macbook-pro')) return 'MacBook Pro';
  if (combined.includes('macbook') || h.includes('macbook') || combined.includes('macmini') || combined.includes('imac')) return 'MacBook';
  if (combined.includes('iphone')) return 'Apple iPhone';
  if (combined.includes('ipad')) return 'Apple iPad';
  if (m.includes('apple') || h.includes('apple-') || combined.includes('apple')) return 'Apple Device';

  // Xiaomi/Poco
  if (m.includes('xiaomi') || n.includes('poco') || h.includes('poco')) {
    if (combined.includes('phone') || n.includes('poco')) return 'Android Phone';
    return 'Android Device';
  }

  // Samsung
  if (m.includes('samsung')) {
    if (combined.includes('phone') || combined.includes('galaxy')) return 'Android Phone';
    return 'Samsung Device';
  }

  // Android
  if (combined.includes('android') || h.includes('android_') || n.includes('nearby-presence') || h.includes('mi-connect') || h.includes('screen-cast')) {
    if (combined.includes('phone')) return 'Android Phone';
    return 'Android Device';
  }
  
  // Windows
  if (combined.includes('windows') || h.includes('desktop-')) return 'Windows PC';
  if (h.includes('laptop-')) return 'Windows Laptop';

  if (m.includes('dell')) return 'Dell Laptop';
  if (m.includes('hp ') || m === 'hp') return 'HP Laptop';
  if (m.includes('lenovo')) return 'Lenovo Laptop';
  if (m.includes('acer')) return 'Acer Laptop';
  if (m.includes('asus')) return 'ASUS Laptop';
  if (m.includes('intel')) return 'Windows PC';
  
  if (combined.includes('linux')) return 'Linux Laptop';
  
  if (combined.includes('router') || combined.includes('switch') || combined.includes('cisco') || combined.includes('ubiquiti') || combined.includes('tplink')) return 'Network Device';
  
  if (combined.includes('iot') || combined.includes('smart') || combined.includes('plug') || combined.includes('bulb') || combined.includes('camera')) return 'IoT Device';

  return 'Unknown Device';
}

function isServiceIdentifier(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.startsWith('nearby-presence-nsd') || 
         lower.match(/^i[a-z0-9]{13}$/) ||
         lower.match(/^i[a-z0-9]{12}$/) ||
         lower.includes('_airplay') ||
         lower.includes('_raop') ||
         lower.includes('_companion-link') ||
         lower.includes('_rfb') ||
         lower.includes('_smb') ||
         lower.includes('_mi-connect');
}

function normalizeAppleName(name) {
  if (!name) return '';
  let norm = name.replace(/\.local$/i, '');
  norm = norm.replace(/s-MacBook/g, "'s MacBook");
  norm = norm.replace(/-MacBook/g, " MacBook");
  norm = norm.replace(/-Air/g, " Air");
  norm = norm.replace(/-Pro/g, " Pro");
  norm = norm.replace(/-iMac/g, " iMac");
  return norm;
}

function generateDisplayName(hostname, manufacturer, explicitName, type) {
  const normHostname = hostname && hostname !== 'Unknown' ? hostname.replace(/\.local$/i, '') : '';
  const isApple = manufacturer?.toLowerCase().includes('apple') || type?.toLowerCase().includes('apple') || type?.toLowerCase().includes('macbook');
  
  let bestName = '';

  // Level 1: Explicit device name
  if (explicitName && explicitName !== 'Unknown' && !isServiceIdentifier(explicitName)) {
    bestName = explicitName;
  }
  // Level 2: Hostname
  else if (normHostname && !isServiceIdentifier(normHostname)) {
    bestName = isApple ? normalizeAppleName(normHostname) : normHostname;
  }
  
  // Clean overly generic names if they are standalone
  if (bestName.toLowerCase() === 'laptop' || bestName.toLowerCase() === 'desktop' || bestName.toLowerCase() === 'unknown' || bestName.toLowerCase().startsWith('android_')) {
    // For generic android hostnames like Android_Q9X72AQG, we CAN use it if no better evidence exists,
    // but the prompt says: "For: Android_xxxxx use: Android Device unless explicit product info exists."
    // Actually, wait! The prompt says: "If there is no explicit device name: hostname: LAPTOP-QJMO6GQD -> LAPTOP-QJMO6GQD".
    // And "Android_Q9X72AQG.local -> Android_Q9X72AQG". Let's keep it!
    if (bestName.toLowerCase() === 'laptop' || bestName.toLowerCase() === 'desktop' || bestName.toLowerCase() === 'unknown') {
      bestName = '';
    }
  }

  if (bestName) return bestName;

  // Level 3: Manufacturer + Device Type
  const m = manufacturer && manufacturer !== 'Unknown' && manufacturer !== 'Randomized MAC' ? manufacturer : '';
  const t = type && type !== 'Unknown Device' ? type : '';

  if (m && t) {
    if (t.toLowerCase().includes(m.toLowerCase())) return t; // e.g., "Apple Apple Device" -> "Apple Device"
    if (m.toLowerCase() === 'xiaomi' && t === 'Android Phone') return 'Xiaomi Device';
    if (m.toLowerCase() === 'apple' && t === 'MacBook Air') return 'Apple MacBook Air';
    return `${m} ${t}`;
  }

  // Level 4: Device Type
  if (t) return t;

  // Level 5: Unknown
  return 'Unknown Device';
}

module.exports = { classifyDevice, generateDisplayName };

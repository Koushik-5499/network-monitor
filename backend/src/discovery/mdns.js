const { execCommand } = require('../utils/commands');
const { validateScope } = require('../utils/validation');

function unescapeAvahiString(str) {
  if (!str) return '';
  // Avahi escapes characters using \DDD (decimal)
  let result = str.replace(/\\([0-9]{3})/g, (match, decimal) => {
    return String.fromCharCode(parseInt(decimal, 10));
  });
  // Handle basic UTF-8 for "’" and other chars if they were double-encoded
  try {
    result = decodeURIComponent(escape(result));
  } catch (e) {}
  return result;
}

function parseExplicitName(rawName) {
  const unescaped = unescapeAvahiString(rawName);
  if (unescaped.startsWith('{') && unescaped.endsWith('}')) {
    try {
      const obj = JSON.parse(unescaped);
      if (obj.nm) return obj.nm;
    } catch (e) {}
  }
  return unescaped;
}

async function discoverMDNS(networkObj) {
  const devices = [];
  if (!networkObj || !networkObj.interface) return devices;

  try {
    // Check if avahi-browse is available
    const { code } = await execCommand('which', ['avahi-browse']);
    if (code !== 0) {
      console.log('avahi-browse not available. Skipping mDNS discovery.');
      return devices;
    }

    // Run avahi-browse for IPv4 on active interface
    const { stdout, error } = await execCommand('avahi-browse', ['-a', '-t', '-r', '-p'], 10000);
    if (error) return devices;

    const lines = stdout.split('\n');
    for (const line of lines) {
      if (!line.startsWith('=')) continue; // Only resolved entries
      
      const parts = line.split(';');
      if (parts.length < 10) continue;

      const iface = parts[1];
      const protocol = parts[2];
      const rawServiceName = parts[3];
      const serviceType = parts[4];
      const rawHostname = parts[6];
      const ip = parts[7];
      
      if (iface !== networkObj.interface || protocol !== 'IPv4') continue;
      if (!validateScope(ip, networkObj)) continue;

      const hostname = unescapeAvahiString(rawHostname);
      const explicitName = parseExplicitName(rawServiceName);

      devices.push({
        ip,
        hostname: hostname,
        service: serviceType,
        explicitName: explicitName,
        source: 'mDNS',
        status: 'active'
      });
    }
  } catch (err) {
    console.error("mDNS discovery error:", err.message);
  }
  
  return devices;
}

module.exports = { discoverMDNS };

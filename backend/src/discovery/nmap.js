const { execCommand } = require('../utils/commands');
const { validateScope } = require('../utils/validation');

async function discoverNmap(networkObj) {
  const devices = [];
  if (!networkObj || !networkObj.subnet) return devices;

  try {
    const { code } = await execCommand('which', ['nmap']);
    if (code !== 0) {
      console.log('nmap not available. Skipping Nmap discovery.');
      return devices;
    }

    // Safe ping scan: -sn (No port scan)
    const { stdout, error } = await execCommand('nmap', ['-sn', '-T4', networkObj.subnet], 15000);
    if (error) {
      if (error.message === 'Timeout') {
        console.error('Nmap scan timed out.');
      }
      return devices;
    }

    let currentIp = null;
    let currentHostname = null;

    const lines = stdout.split('\n');
    for (const line of lines) {
      const matchIp = line.match(/Nmap scan report for (.*) \((.*)\)|Nmap scan report for (.*)/);
      if (matchIp) {
        if (matchIp[1] && matchIp[2]) {
          currentHostname = matchIp[1];
          currentIp = matchIp[2];
        } else if (matchIp[3]) {
          currentIp = matchIp[3];
          currentHostname = null;
        }
        continue;
      }

      const matchMac = line.match(/MAC Address: ([0-9A-F:]+) \((.*)\)/i);
      if (matchMac && currentIp) {
        if (!validateScope(currentIp, networkObj)) continue;
        
        devices.push({
          ip: currentIp,
          mac: matchMac[1].toUpperCase(),
          hostname: currentHostname,
          manufacturer: matchMac[2] || null,
          source: 'Nmap',
          status: 'active'
        });
        currentIp = null;
        currentHostname = null;
      }
    }
  } catch (err) {
    console.error("Nmap discovery error:", err.message);
  }
  
  return devices;
}

module.exports = { discoverNmap };

const { execCommand } = require('../utils/commands');
const { validateScope } = require('../utils/validation');

async function discoverNeighbors(networkObj) {
  const devices = [];
  if (!networkObj || !networkObj.interface) return devices;

  try {
    const { stdout } = await execCommand('ip', ['neigh', 'show', 'dev', networkObj.interface]);
    
    const lines = stdout.split('\n').filter(l => l.trim() !== '');
    for (const line of lines) {
      // Example line: 10.99.160.1 lladdr AA:BB:CC:DD:EE:FF REACHABLE
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      
      const ip = parts[0];
      const state = parts[parts.length - 1];
      
      let mac = null;
      const lladdrIdx = parts.indexOf('lladdr');
      if (lladdrIdx !== -1 && lladdrIdx + 1 < parts.length) {
        mac = parts[lladdrIdx + 1];
      }
      
      // Ignore INCOMPLETE
      if (state === 'INCOMPLETE') continue;
      if (!mac) continue;
      
      // Validate scope
      if (!validateScope(ip, networkObj)) continue;
      
      devices.push({
        ip,
        mac: mac.toUpperCase(),
        source: 'ARP',
        status: state === 'REACHABLE' ? 'active' : 'recently_seen'
      });
    }
  } catch (err) {
    console.error("Neighbor discovery error:", err.message);
  }
  
  return devices;
}

module.exports = { discoverNeighbors };

const { execCommand } = require('../utils/commands');
const { validateScope } = require('../utils/validation');

async function discoverNetBIOS(networkObj) {
  const devices = [];
  if (!networkObj || !networkObj.subnet) return devices;

  try {
    const { code } = await execCommand('which', ['nmblookup']);
    if (code !== 0) {
      console.log('nmblookup not available. Skipping NetBIOS discovery.');
      return devices;
    }

    // nmblookup -A requires specific IPs. We could broadcast instead:
    // nmblookup -B <broadcast_ip> '*'
    // But since the user asked to query the subnet, we will do a broadcast lookup.
    
    // Simplest approach: nmblookup '*' 
    const { stdout, error } = await execCommand('nmblookup', ['*'], 10000);
    if (error) return devices;

    // Example output:
    // 10.99.160.226 *<00>
    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/^([0-9\.]+)\s+/);
      if (match) {
        const ip = match[1];
        if (!validateScope(ip, networkObj)) continue;
        
        // Then do targeted lookup for the name
        const { stdout: nodeOut } = await execCommand('nmblookup', ['-A', ip], 5000);
        const nameMatch = nodeOut.match(/\s+([A-Z0-9_-]+)\s+<00> -         M/i);
        
        if (nameMatch) {
          devices.push({
            ip,
            hostname: nameMatch[1],
            source: 'NetBIOS',
            status: 'active'
          });
        }
      }
    }
  } catch (err) {
    console.error("NetBIOS discovery error:", err.message);
  }
  
  return devices;
}

module.exports = { discoverNetBIOS };

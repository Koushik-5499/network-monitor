const { execCommand } = require('../utils/commands');
const { calculateSubnet } = require('../utils/ip');

async function detectNetwork() {
  const result = {
    wifiName: "Unknown",
    interface: null,
    localIp: null,
    prefix: null,
    subnet: null,
    gateway: null,
    connected: false
  };

  try {
    // 1. Get default route (gateway & interface)
    const { stdout: routeOut } = await execCommand('ip', ['route']);
    const defaultRouteLine = routeOut.split('\n').find(line => line.startsWith('default via'));
    
    if (defaultRouteLine) {
      const parts = defaultRouteLine.trim().split(' ');
      const viaIdx = parts.indexOf('via');
      const devIdx = parts.indexOf('dev');
      
      if (viaIdx !== -1 && devIdx !== -1) {
        result.gateway = parts[viaIdx + 1];
        result.interface = parts[devIdx + 1];
      }
    }

    if (!result.interface) return result; // No active interface found

    // 2. Get local IP and prefix
    const { stdout: addrOut } = await execCommand('ip', ['-4', 'addr', 'show', 'dev', result.interface]);
    const inetLine = addrOut.split('\n').find(line => line.trim().startsWith('inet '));
    
    if (inetLine) {
      const parts = inetLine.trim().split(' ');
      const ipCidr = parts[1]; // e.g., "10.99.163.86/22"
      
      if (ipCidr.includes('/')) {
        const [ip, prefix] = ipCidr.split('/');
        result.localIp = ip;
        result.prefix = parseInt(prefix, 10);
        
        // Calculate subnet
        const networkAddr = calculateSubnet(result.localIp, result.prefix);
        if (networkAddr) {
          result.subnet = `${networkAddr}/${result.prefix}`;
          result.connected = true;
        }
      }
    }

    // 3. Get Wi-Fi Name (SSID)
    const { stdout: iwOut, code: iwCode } = await execCommand('iwgetid', ['-r']);
    if (iwCode === 0 && iwOut.trim()) {
      result.wifiName = iwOut.trim();
    } else {
      const { stdout: nmOut, code: nmCode } = await execCommand('nmcli', ['-t', '-f', 'active,ssid', 'dev', 'wifi']);
      if (nmCode === 0) {
        const activeLine = nmOut.split('\n').find(line => line.startsWith('yes:'));
        if (activeLine) {
          result.wifiName = activeLine.split(':')[1] || "Unknown";
        }
      }
    }

  } catch (err) {
    console.error("Network detection error:", err.message);
  }

  if (result.connected) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(`${result.subnet}|${result.gateway}|${result.wifiName}`);
    result.networkId = hash.digest('hex').substring(0, 12);
  } else {
    result.networkId = null;
  }

  return result;
}

module.exports = { detectNetwork };

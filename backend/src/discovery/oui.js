const fs = require('fs').promises;

// In a real scenario, this could parse /usr/share/nmap/nmap-mac-prefixes
// or similar files. We will use a simple heuristic and local read.

async function getManufacturer(mac) {
  if (!mac) return 'Unknown';
  
  // Detect randomized MAC (second character is 2, 6, A, or E)
  const firstByte = mac.substring(0, 2).toLowerCase();
  const hex = parseInt(firstByte, 16);
  if (!isNaN(hex) && (hex & 0b00000010)) {
    return 'Randomized MAC';
  }

  try {
    const data = await fs.readFile('/usr/share/nmap/nmap-mac-prefixes', 'utf8');
    const prefix = mac.substring(0, 8).replace(/:/g, '').toUpperCase();
    
    const lines = data.split('\n');
    for (const line of lines) {
      if (line.startsWith(prefix)) {
        return line.substring(6).trim() || 'Unknown';
      }
    }
  } catch (err) {
    // Silently ignore missing OUI file
  }

  return 'Unknown';
}

module.exports = { getManufacturer };

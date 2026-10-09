const dns = require('dns').promises;

async function discoverDNS(ipList) {
  const results = {};
  
  await Promise.all(ipList.map(async (ip) => {
    try {
      const dnsPromise = dns.reverse(ip);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500));
      const hostnames = await Promise.race([dnsPromise, timeoutPromise]);
      if (hostnames && hostnames.length > 0) {
        results[ip] = hostnames[0];
      }
    } catch (err) {
      results[ip] = null;
    }
  }));
  
  return results;
}

module.exports = { discoverDNS };

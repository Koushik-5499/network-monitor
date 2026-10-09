function isIpInSubnet(ip, subnet, prefix) {
  if (!ip || !subnet || prefix == null) return false;
  try {
    const ipParts = ip.split('.').map(Number);
    const subParts = subnet.split('.').map(Number);
    if (ipParts.length !== 4 || subParts.length !== 4) return false;

    let ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    let subNum = (subParts[0] << 24) | (subParts[1] << 16) | (subParts[2] << 8) | subParts[3];
    let mask = 0xFFFFFFFF << (32 - prefix);

    return (ipNum & mask) === (subNum & mask);
  } catch (e) {
    return false;
  }
}

function calculateSubnet(ip, prefix) {
  try {
    const ipParts = ip.split('.').map(Number);
    let ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    let mask = 0xFFFFFFFF << (32 - prefix);
    let subNum = ipNum & mask;
    
    return [
      (subNum >>> 24) & 255,
      (subNum >>> 16) & 255,
      (subNum >>> 8) & 255,
      subNum & 255
    ].join('.');
  } catch (e) {
    return null;
  }
}

function isValidIPv4(ip) {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
}

module.exports = { isIpInSubnet, calculateSubnet, isValidIPv4 };

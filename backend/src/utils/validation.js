const { isIpInSubnet, isValidIPv4 } = require('./ip');

function validateScope(ip, networkObj) {
  if (!isValidIPv4(ip)) return false;
  if (!networkObj || !networkObj.subnet || networkObj.prefix == null) return false;
  
  return isIpInSubnet(ip, networkObj.subnet, networkObj.prefix);
}

module.exports = { validateScope };

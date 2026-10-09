let devices = [];
let networkInfo = { connected: false };

function getDevices() {
  return devices;
}

function setDevices(newDevices) {
  devices = newDevices;
}

function getNetworkInfo() {
  return networkInfo;
}

function setNetworkInfo(info) {
  networkInfo = info;
}

function clearDevices() {
  devices = [];
}

// Mark devices as offline if not seen for a while (e.g. 5 minutes)
function updateOfflineStatus() {
  const now = new Date().getTime();
  let changed = false;
  devices.forEach(d => {
    const lastSeen = new Date(d.lastSeen).getTime();
    if (d.status !== 'offline' && (now - lastSeen) > 5 * 60 * 1000) {
      d.status = 'offline';
      changed = true;
    }
  });
  return changed;
}

module.exports = {
  getDevices,
  setDevices,
  getNetworkInfo,
  setNetworkInfo,
  clearDevices,
  updateOfflineStatus
};

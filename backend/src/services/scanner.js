const { detectNetwork } = require('../discovery/network');
const { discoverNeighbors } = require('../discovery/neighbors');
const { discoverMDNS } = require('../discovery/mdns');
const { discoverNmap } = require('../discovery/nmap');
const { discoverNetBIOS } = require('../discovery/netbios');
const { discoverDNS } = require('../discovery/dns');
const { mergeDevices } = require('../discovery/mergeDevices');
const { getDevices, setDevices, getNetworkInfo, setNetworkInfo, clearDevices, updateOfflineStatus } = require('./deviceStore');
const { broadcastEvent } = require('../websocket/server');

let isScanning = false;

let currentScanNetworkId = null;

async function runScan() {
  if (isScanning) {
    console.log('Scan already in progress. Skipping...');
    return;
  }
  
  isScanning = true;
  
  try {
    const currentNetwork = await detectNetwork();
    const prevNetwork = getNetworkInfo();

    // Check for network change using robust networkId
    if (currentNetwork.networkId !== prevNetwork.networkId) {
      console.log(`Network changed! Old: ${prevNetwork.networkId}, New: ${currentNetwork.networkId}`);
      clearDevices();
      setNetworkInfo(currentNetwork);
      broadcastEvent('network:changed', { previousNetwork: prevNetwork, currentNetwork });
      broadcastEvent('devices:cleared');
    } else {
      setNetworkInfo(currentNetwork);
      broadcastEvent('network:update', { network: currentNetwork });
    }

    if (!currentNetwork.connected) {
      console.log('No active network connection detected.');
      broadcastEvent('scan:complete');
      isScanning = false;
      return;
    }

    currentScanNetworkId = currentNetwork.networkId;
    broadcastEvent('scan:start');
    const startTime = Date.now();

    console.log(`Starting discovery on ${currentNetwork.interface} (${currentNetwork.subnet})`);

    // Run discovery methods concurrently where possible
    const [neighbors, mdnsDevices, nmapDevices, netbiosDevices] = await Promise.all([
      discoverNeighbors(currentNetwork),
      discoverMDNS(currentNetwork),
      discoverNmap(currentNetwork),
      discoverNetBIOS(currentNetwork)
    ]);

    // RACE CONDITION CHECK: Verify network hasn't changed while waiting
    const freshNetwork = await detectNetwork();
    if (freshNetwork.networkId !== currentScanNetworkId) {
      console.log('Network changed during scan. Discarding obsolete results.');
      return; // Skip merge entirely
    }

    let allDiscovered = [...neighbors, ...mdnsDevices, ...nmapDevices, ...netbiosDevices];

    // Deduplicate IPs for Reverse DNS
    const uniqueIps = [...new Set(allDiscovered.map(d => d.ip))];
    const dnsResults = await discoverDNS(uniqueIps);

    // RACE CONDITION CHECK: Verify network again after DNS
    const finalNetwork = await detectNetwork();
    if (finalNetwork.networkId !== currentScanNetworkId) {
      console.log('Network changed during DNS resolution. Discarding obsolete results.');
      return; 
    }

    // Apply DNS results
    for (const d of allDiscovered) {
      if (dnsResults[d.ip] && !d.hostname) {
        d.hostname = dnsResults[d.ip];
      }
    }

    // Merge with existing devices
    const existingDevices = getDevices();
    const updatedDevices = await mergeDevices(allDiscovered, existingDevices, currentNetwork);
    
    setDevices(updatedDevices);
    updateOfflineStatus();

    const scanDuration = Date.now() - startTime;
    currentNetwork.lastScan = new Date().toISOString();
    currentNetwork.scanDuration = scanDuration;
    setNetworkInfo(currentNetwork);

    broadcastEvent('devices:update', { devices: updatedDevices });
    broadcastEvent('scan:complete', { duration: scanDuration });
    console.log(`Scan complete in ${scanDuration}ms. Discovered ${updatedDevices.length} devices.`);

  } catch (err) {
    console.error('Scanner error:', err);
    broadcastEvent('scanner:error', { error: err.message });
  } finally {
    isScanning = false;
  }
}

let scanIntervalId = null;

function startAutoScan(intervalSec = 10) {
  if (scanIntervalId) clearInterval(scanIntervalId);
  const ms = intervalSec * 1000;
  
  // Initial scan
  runScan();
  
  scanIntervalId = setInterval(runScan, ms);
  console.log(`Auto-scan scheduled every ${intervalSec} seconds.`);
}

function stopAutoScan() {
  if (scanIntervalId) {
    clearInterval(scanIntervalId);
    scanIntervalId = null;
    console.log('Auto-scan stopped.');
  }
}

module.exports = { runScan, startAutoScan, stopAutoScan };

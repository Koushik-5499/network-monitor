const express = require('express');
const { getNetworkInfo, getDevices } = require('../services/deviceStore');
const { runScan } = require('../services/scanner');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/network', (req, res) => {
  res.json(getNetworkInfo());
});

router.get('/devices', (req, res) => {
  res.json({ devices: getDevices() });
});

router.get('/status', (req, res) => {
  res.json({
    network: getNetworkInfo(),
    deviceCount: getDevices().length,
    timestamp: new Date().toISOString()
  });
});

router.post('/scan', async (req, res) => {
  // Trigger scan asynchronously, don't wait for it to complete
  runScan();
  res.json({ message: 'Scan triggered', status: 'started' });
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const http = require('http');
const apiRoutes = require('./src/routes/api');
const { initWebSocket } = require('./src/websocket/server');
const { startAutoScan } = require('./src/services/scanner');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8787;
const SCAN_INTERVAL = process.env.SCAN_INTERVAL ? parseInt(process.env.SCAN_INTERVAL, 10) : 10;

// CORS - allow only frontend
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// WebSocket
initWebSocket(server);

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server listening on http://127.0.0.1:${PORT}`);
  
  // Start automatic scanning
  startAutoScan(SCAN_INTERVAL);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

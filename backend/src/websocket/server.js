const WebSocket = require('ws');

let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Frontend client connected to WebSocket');
    
    // Send initial state if needed
    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('close', () => {
      console.log('Frontend client disconnected');
    });
  });
}

function broadcastEvent(type, data = {}) {
  if (!wss) return;
  const payload = JSON.stringify({ type, ...data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

module.exports = { initWebSocket, broadcastEvent };

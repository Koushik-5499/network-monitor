import { useState, useEffect } from 'react';

export const useWebSocket = (url) => {
  const [status, setStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      setStatus('Reconnecting...');
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        setStatus('Connected');
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };
      
      ws.onclose = () => {
        setStatus('Disconnected');
        // Try to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };
      
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          setLastMessage(data);
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop on unmount
        ws.close();
      }
    };
  }, [url]);

  return { status, lastMessage };
};

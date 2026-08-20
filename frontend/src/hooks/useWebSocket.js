import { useEffect, useState, useRef } from 'react';

export const useWebSocket = () => {
  const [notifications, setNotifications] = useState([]);
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const connect = () => {
      let WS_URL = import.meta.env.VITE_WS_BASE_URL || '';
      WS_URL = WS_URL.replace(/\/ws\/?$/, '').replace(/\/$/, '');
      ws.current = new WebSocket(`${WS_URL}/ws/notifications/?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Real-time notification:', data);
        
        // We no longer trigger a browser alert. We just update the state.
        
        setNotifications((prev) => [data, ...prev]);
      };

      ws.current.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { notifications, isConnected };
};

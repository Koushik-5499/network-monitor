import React, { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useWebSocket } from './hooks/useWebSocket';


function App() {
  const { status: wsStatus, lastMessage } = useWebSocket('ws://localhost:8787');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span>[◉] NETWORK MONITOR</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOCAL SECURITY CONSOLE</span>
          </div>
          <div className="live-indicator" style={{ marginLeft: '1.5rem' }}>
            <span className={`dot ${wsStatus.toLowerCase()}`}></span>
            {wsStatus === 'Connected' ? '● LIVE' : wsStatus.toUpperCase()}
          </div>
        </div>
        <div className="header-actions">
          {/* Theme toggle removed per requirement */}
        </div>
      </header>
      
      <main className="dashboard">
        <Dashboard lastMessage={lastMessage} />
      </main>
    </div>
  );
}

export default App;

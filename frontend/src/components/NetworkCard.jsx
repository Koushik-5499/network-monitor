import React from 'react';

const NetworkCard = ({ network, statusText }) => {
  const isDisconnected = !network || !network.connected;
  const displayStatus = isDisconnected ? 'DISCONNECTED' : (statusText || 'CONNECTED').toUpperCase();
  const isScanning = displayStatus.includes('SCAN');

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="network-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px dashed var(--border-color)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div style={{ fontWeight: 600, letterSpacing: '2px', color: 'var(--primary-color)' }}>
            ┌── NETWORK STATUS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div className={`dot ${isDisconnected ? 'disconnected' : (isScanning ? 'scanning' : 'live')}`}></div>
            <span style={{ color: isDisconnected ? 'var(--danger-color)' : (isScanning ? 'var(--secondary-color)' : 'var(--success-color)') }}>
              {isDisconnected ? 'OFFLINE' : (isScanning ? 'SCANNING' : 'LIVE')}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', lineHeight: '1.2' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ SSID</span>
            <span style={{ color: 'var(--secondary-color)' }}>{network?.wifiName || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ INTERFACE</span>
            <span>{network?.interface || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ LOCAL IP</span>
            <span>{network?.localIp || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ SUBNET</span>
            <span>{network?.subnet || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ GATEWAY</span>
            <span>{network?.gateway || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ DISCOVERY</span>
            <span>mDNS + ARP</span>
          </div>
          <div style={{ display: 'flex', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
            <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ STATUS</span>
            <span style={{ color: isDisconnected ? 'var(--danger-color)' : (isScanning ? 'var(--warning-color)' : 'var(--success-color)') }}>
              {displayStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkCard;

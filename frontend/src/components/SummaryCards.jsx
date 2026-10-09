import React, { useMemo } from 'react';

import { getDeviceCategory } from '../utils/deviceUtils';

const SummaryCards = ({ devices }) => {
  const stats = useMemo(() => {
    const s = {
      total: devices.length,
      confirmed: 0,
      likely: 0,
      active: 0,
      proxyArp: 0,
      recentlySeen: 0,
      offline: 0,
      
      apple: 0,
      android: 0,
      windows: 0,
      linux: 0,
      iot: 0,
      printer: 0,
      network: 0,
      other: 0,
      unknown: 0
    };

    devices.forEach(d => {
      const st = (d.status || '').toLowerCase();
      if (st === 'active') {
        s.active++;
        if (d.confidence === 'high') s.confirmed++;
        else if (d.confidence === 'medium') s.likely++;
      }
      else if (st === 'recently_seen') s.recentlySeen++;
      else if (st === 'proxy_arp') s.proxyArp++;
      else s.offline++;
      
      const cat = getDeviceCategory(d);
      if (cat === 'Apple') s.apple++;
      else if (cat === 'Android') s.android++;
      else if (cat === 'Windows') s.windows++;
      else if (cat === 'Linux') s.linux++;
      else if (cat === 'IoT') s.iot++;
      else if (cat === 'Printer') s.printer++;
      else if (cat === 'Network') s.network++;
      else if (cat === 'Unknown') s.unknown++;
      else s.other++;
    });

    return s;
  }, [devices]);

  return (
    <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
      <div className="card summary-card">
        <div className="summary-info">
          <h3>{stats.confirmed.toString().padStart(3, '0')}</h3>
          <p>CONFIRMED DEVICES</p>
        </div>
      </div>
      <div className="card summary-card" style={{ borderColor: 'rgba(0, 255, 136, 0.3)' }}>
        <div className="summary-info">
          <h3 style={{ color: 'var(--success-color)' }}>{stats.active.toString().padStart(3, '0')}</h3>
          <p>ACTIVE ENTITIES</p>
        </div>
      </div>
      <div className="card summary-card" style={{ borderColor: 'rgba(0, 217, 255, 0.3)' }}>
        <div className="summary-info">
          <h3 style={{ color: 'var(--secondary-color)' }}>{stats.likely.toString().padStart(3, '0')}</h3>
          <p>LIKELY DEVICES</p>
        </div>
      </div>
      <div className="card summary-card" style={{ borderColor: 'rgba(255, 176, 0, 0.3)' }}>
        <div className="summary-info">
          <h3 style={{ color: 'var(--warning-color)' }}>{stats.proxyArp.toString().padStart(3, '0')}</h3>
          <p>PROXY / UNCONFIRMED</p>
        </div>
      </div>
      <div className="card summary-card">
        <div className="summary-info">
          <h3>{stats.apple.toString().padStart(3, '0')}</h3>
          <p>APPLE</p>
        </div>
      </div>
      <div className="card summary-card">
        <div className="summary-info">
          <h3>{stats.android.toString().padStart(3, '0')}</h3>
          <p>ANDROID</p>
        </div>
      </div>
      <div className="card summary-card">
        <div className="summary-info">
          <h3>{stats.windows.toString().padStart(3, '0')}</h3>
          <p>WINDOWS</p>
        </div>
      </div>
      <div className="card summary-card">
        <div className="summary-info">
          <h3>{stats.network.toString().padStart(3, '0')}</h3>
          <p>NETWORK DEVICES</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;

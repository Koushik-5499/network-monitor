import React, { useState } from 'react';
import { Search } from 'lucide-react';

const FILTERS = ['All', 'Active', 'Unknown', 'Apple', 'Android', 'Windows', 'Linux', 'Network', 'Printer', 'IoT'];
const REFRESH_INTERVALS = [5, 10, 15, 30];

const ControlsBar = ({ searchQuery, setSearchQuery, filterType, setFilterType, onScan, isScanning }) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [interval, setInterval] = useState(5);

  return (
    <div className="controls-bar">
      <div className="search-bar">
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search devices..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="filters">
        {FILTERS.map(f => (
          <button 
            key={f}
            className={`filter-btn ${filterType === f ? 'active' : ''}`}
            onClick={() => setFilterType(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="scan-controls">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          Auto Refresh:
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={(e) => setAutoRefresh(e.target.checked)} 
          />
        </label>

        <select 
          value={interval} 
          onChange={(e) => setInterval(Number(e.target.value))}
          disabled={!autoRefresh}
          style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
        >
          {REFRESH_INTERVALS.map(i => (
            <option key={i} value={i}>{i}s</option>
          ))}
        </select>

        <button 
          className="btn-primary" 
          onClick={onScan} 
          disabled={isScanning}
        >
          {isScanning ? '[ ◌ SCANNING... ]' : '[ ⚡ INITIATE DISCOVERY ]'}
        </button>
      </div>
    </div>
  );
};

export default ControlsBar;

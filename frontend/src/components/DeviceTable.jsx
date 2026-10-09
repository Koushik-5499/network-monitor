import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { getDeviceCategory } from '../utils/deviceUtils';

const DeviceTable = ({ devices, sortConfig, onSort, selectedDeviceId, onRowClick, isLoading, filterType }) => {
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.asc ? <ArrowUp size={14} className="sort-icon" /> : <ArrowDown size={14} className="sort-icon" />;
  };

  const getStatusBadge = (status) => {
    const s = (status || 'unknown').toLowerCase().replace('-', '_').replace(' ', '_');
    let icon = '?';
    if (s === 'active') icon = '●';
    else if (s === 'recently_seen') icon = '◐';
    else if (s === 'proxy_arp') icon = '◇';
    else if (s === 'offline') icon = '○';
    
    return <span className={`status-indicator ${s}`}>{icon} {status || 'Unknown'}</span>;
  };

  const getConfBadge = (conf) => {
    const c = (conf || 'Low').toLowerCase();
    return <span className={`badge-conf badge-conf-${c}`}>{conf || 'Low'}</span>;
  };

  if (isLoading && devices.length === 0) {
    return (
      <div className="table-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        [ INITIALIZING DISCOVERY SEQUENCE... ]
      </div>
    );
  }

  if (devices.length === 0) {
    const filterName = filterType && filterType !== 'All' ? filterType.toUpperCase() : 'ENTITIES';
    return (
      <div className="table-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        [ NO {filterName} DETECTED ]
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th onClick={() => onSort('status')}>Status {getSortIcon('status')}</th>
            <th onClick={() => onSort('name')}>Device {getSortIcon('name')}</th>
            <th onClick={() => onSort('type')}>Type {getSortIcon('type')}</th>
            <th onClick={() => onSort('ip')}>IP Address {getSortIcon('ip')}</th>
            <th onClick={() => onSort('mac')}>MAC Address {getSortIcon('mac')}</th>
            <th onClick={() => onSort('manufacturer')}>Manufacturer {getSortIcon('manufacturer')}</th>
            <th onClick={() => onSort('hostname')}>Hostname {getSortIcon('hostname')}</th>
            <th onClick={() => onSort('lastSeen')}>Last Seen {getSortIcon('lastSeen')}</th>
            <th onClick={() => onSort('confidence')}>Confidence {getSortIcon('confidence')}</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(dev => {
            // Use pre-computed _displayName from buildDisplayNames (enriched in Dashboard)
            const displayName = dev._displayName || dev.name || 'Unidentified Device';
            const category = getDeviceCategory(dev);
            const hasAlias = !!dev._alias;
            return (
            <tr
              key={dev.id}
              className={`device-row ${selectedDeviceId === dev.id ? 'selected' : ''}`}
              onClick={() => onRowClick(dev)}
            >
              <td>{getStatusBadge(dev.status)}</td>
              <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                {displayName}
                {hasAlias && (
                  <span title="User alias" style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--primary-color)', opacity: 0.8 }}>✎</span>
                )}
              </td>
              <td style={{ color: 'var(--text-muted)' }}>{category}</td>
              <td style={{ color: 'var(--secondary-color)' }}>{dev.ip || 'N/A'}</td>
              <td style={{ color: 'var(--text-muted)' }}>{dev.mac || 'N/A'}</td>
              <td>{dev.manufacturer || 'Unknown'}</td>
              <td style={{ color: 'var(--text-muted)' }}>{dev.hostname || 'N/A'}</td>
              <td>{formatTime(dev.lastSeen)}</td>
              <td>{getConfBadge(dev.confidence || 'Low')}</td>
              <td>
                <span style={{ fontSize: '0.75rem', border: '1px solid var(--border-color)', padding: '0.125rem 0.375rem', borderRadius: '2px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  {dev.sources && dev.sources.length > 1 ? dev.sources.join(' + ') : (dev.sources && dev.sources[0]) || 'N/A'}
                </span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTable;

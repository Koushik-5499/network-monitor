import React, { useState, useMemo, useEffect } from 'react';
import { useNetwork } from '../hooks/useNetwork';
import { useDevices } from '../hooks/useDevices';
import { useDeviceAliases } from '../hooks/useDeviceAliases';
import { filterDevices } from '../utils/deviceFilters';
import { ipSort } from '../utils/ipSort';
import { buildDisplayNames, getDeviceGroup } from '../utils/deviceUtils';

import NetworkCard from '../components/NetworkCard';
import SummaryCards from '../components/SummaryCards';
import ControlsBar from '../components/ControlsBar';
import DeviceTable from '../components/DeviceTable';
import DeviceDetails from '../components/DeviceDetails';

const Dashboard = ({ lastMessage }) => {
  const { network, loading: networkLoading, error: networkError, fetchNetwork } = useNetwork();
  const { devices, loading: devicesLoading, error: devicesError, triggerScan, fetchDevices, setDevices } = useDevices();
  const { getAlias, setAlias, removeAlias } = useDeviceAliases();

  const [statusText, setStatusText] = useState('Connected');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'ip', asc: true });
  const [selectedDevice, setSelectedDevice] = useState(null);
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'network:changed':
        setStatusText('Network changed — starting discovery...');
        setDevices([]);
        setSelectedDevice(null);
        setSearchQuery('');
        setFilterType('All');
        fetchNetwork();
        break;
      case 'devices:cleared':
        setDevices([]);
        break;
      case 'network:update':
        fetchNetwork();
        break;
      case 'devices:update':
        if (lastMessage.devices) setDevices(lastMessage.devices);
        break;
      case 'scan:start':
        setStatusText('Scanning new local network...');
        fetchDevices();
        break;
      case 'scan:complete':
        setStatusText('Connected');
        fetchDevices();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);


  // Enrich every device with _displayName, _alias, _nameSource
  const networkId = network?.networkId || '';
  const enrichedDevices = useMemo(() =>
    buildDisplayNames(devices, (d) => getAlias(d, networkId)),
    [devices, networkId, getAlias]
  );

  const filteredAndSortedDevices = useMemo(() => {
    let result = filterDevices(enrichedDevices, searchQuery, filterType);

    result.sort((a, b) => {
      // 1. Group priority
      const groupA = getDeviceGroup(a);
      const groupB = getDeviceGroup(b);
      if (groupA !== groupB) return groupA - groupB;

      // 2. User-selected sort
      if (sortConfig.key === 'ip') return ipSort(a.ip, b.ip, sortConfig.asc);
      if (sortConfig.key === 'name') {
        const av = a._displayName || '';
        const bv = b._displayName || '';
        if (av < bv) return sortConfig.asc ? -1 : 1;
        if (av > bv) return sortConfig.asc ? 1 : -1;
        return ipSort(a.ip, b.ip, sortConfig.asc);
      }
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.asc ? -1 : 1;
      if (aVal > bVal) return sortConfig.asc ? 1 : -1;
      
      return ipSort(a.ip, b.ip, true);
    });

    return result;
  }, [enrichedDevices, searchQuery, filterType, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      asc: prev.key === key ? !prev.asc : true
    }));
  };

  // Keep selectedDevice in sync with enriched data and validate subnet
  const enrichedSelected = useMemo(() => {
    if (!selectedDevice) return null;
    const currentDevice = enrichedDevices.find(d => d.id === selectedDevice.id);
    if (!currentDevice) return null; // Drop stale devices from old networks
    return currentDevice;
  }, [selectedDevice, enrichedDevices]);

  // If enrichedSelected becomes null but selectedDevice is still set, clear it
  useEffect(() => {
    if (selectedDevice && !enrichedSelected) {
      setSelectedDevice(null);
    }
  }, [selectedDevice, enrichedSelected]);

  const isOffline = networkError || devicesError || (!network && !networkLoading);

  return (
    <>
      {isOffline && (
        <div className="network-change-alert" style={{ border: '1px solid var(--danger-color)', backgroundColor: 'rgba(255, 59, 92, 0.1)' }}>
           <h3 style={{ color: 'var(--danger-color)' }}>⚠ BACKEND CONNECTION UNAVAILABLE</h3>
           <div style={{ marginLeft: '1.5rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
             <p>API: localhost:8787</p>
             <p>STATUS: OFFLINE</p>
           </div>
           <button
             onClick={() => { fetchNetwork(); fetchDevices(); }}
             style={{
               marginTop: '1rem',
               padding: '0.5rem 1rem',
               backgroundColor: 'transparent',
               border: '1px solid var(--danger-color)',
               color: 'var(--danger-color)',
               cursor: 'pointer',
               fontFamily: 'var(--font-mono)'
             }}
           >
             [ RETRY CONNECTION ]
           </button>
        </div>
      )}

      {statusText.includes('Network changed') && !isOffline && (
        <div className="network-change-alert">
           <h3>⚠ NETWORK CHANGE DETECTED</h3>
           <div style={{ marginLeft: '1.5rem', color: 'var(--text-main)' }}>
             <p>Previous: {network?.wifiName || 'Unknown'}</p>
             <p>New: Detecting...</p>
           </div>
           <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Reinitializing local discovery...</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <NetworkCard network={network} statusText={statusText} />

        <div className="card" style={{ padding: 0 }}>
          <div className="network-card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px dashed var(--border-color)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
              <div style={{ fontWeight: 600, letterSpacing: '2px', color: 'var(--primary-color)' }}>
                ┌── SCANNER
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', lineHeight: '1.2' }}>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ STATUS</span>
                <span style={{ color: devicesLoading ? 'var(--secondary-color)' : 'var(--text-main)' }}>
                  {devicesLoading ? 'SCANNING' : 'IDLE'}
                </span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ NETWORK</span>
                <span>{network?.subnet || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ INTERFACE</span>
                <span>{network?.interface || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ DISCOVERY</span>
                <span>mDNS + ARP</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ PROGRESS</span>
                <span>{devicesLoading ? 'ACTIVE' : 'COMPLETED'}</span>
              </div>
              <div style={{ display: 'flex', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ width: '150px', color: 'var(--text-muted)' }}>│ LAST SCAN</span>
                <span style={{ color: 'var(--primary-color)' }}>
                  {network?.lastScan ? new Date(network.lastScan).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SummaryCards devices={enrichedDevices} />

      <ControlsBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        onScan={triggerScan}
        isScanning={devicesLoading}
      />

      <div className="main-content">
        <DeviceTable
          devices={filteredAndSortedDevices}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedDeviceId={selectedDevice?.id}
          onRowClick={setSelectedDevice}
          isLoading={devicesLoading}
          filterType={filterType}
        />

        {enrichedSelected && (
          <DeviceDetails
            device={enrichedSelected}
            onClose={() => setSelectedDevice(null)}
            onSaveAlias={(newName) => setAlias(enrichedSelected, newName, networkId)}
            onRemoveAlias={() => removeAlias(enrichedSelected, networkId)}
            networkId={networkId}
            localIp={network?.localIp}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;

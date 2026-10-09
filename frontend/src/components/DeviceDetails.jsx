import React, { useState } from 'react';
import { X, Pencil, Check, Trash2 } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { getDeviceCategory } from '../utils/deviceUtils';

const DeviceDetails = ({ device, onClose, onSaveAlias, onRemoveAlias, localIp }) => {
  const [editMode, setEditMode] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (!device) return null;

  const displayName = device._displayName || device.name || 'Unidentified Device';
  const category = getDeviceCategory(device);
  const hasAlias = !!device._alias;
  const nameSource = device._nameSource || 'Unknown';
  const isThisDevice = localIp && device.ip === localIp;

  const handleEditClick = () => {
    setDraftName(device._alias || displayName);
    setEditMode(true);
  };

  const handleSave = () => {
    const trimmed = draftName.trim();
    if (trimmed) {
      onSaveAlias(trimmed);
    }
    setEditMode(false);
  };

  const handleCancel = () => setEditMode(false);

  const handleRemove = () => {
    onRemoveAlias();
    setEditMode(false);
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

  return (
    <div className="details-panel">
      <div className="details-header">
        <h3>
          DEVICE PROFILE
          {isThisDevice && (
            <span style={{
              marginLeft: '0.75rem',
              fontSize: '0.65rem',
              letterSpacing: '1px',
              color: 'var(--primary-color)',
              border: '1px solid var(--primary-color)',
              padding: '0.1rem 0.4rem',
              borderRadius: '2px',
              verticalAlign: 'middle'
            }}>
              THIS DEVICE
            </span>
          )}
        </h3>
        <button className="close-btn" onClick={onClose} aria-label="Close details">
          <X size={16} />
        </button>
      </div>

      {/* IDENTITY row with inline edit */}
      <div className="detail-row">
        <span className="detail-label">IDENTITY</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {editMode ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                autoFocus
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--primary-color)',
                  color: 'var(--text-main)',
                  padding: '0.3rem 0.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  flex: 1,
                  minWidth: '120px',
                  outline: 'none',
                }}
                placeholder="Enter device name..."
              />
              <button onClick={handleSave} title="Save alias" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '0.2rem' }}>
                <Check size={16} />
              </button>
              <button onClick={handleCancel} title="Cancel" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={16} />
              </button>
              {hasAlias && (
                <button onClick={handleRemove} title="Remove alias" style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.2rem' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="detail-value highlight" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {displayName}
              </span>
              {hasAlias && (
                <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)', letterSpacing: '1px' }}>ALIAS</span>
              )}
              <button
                onClick={handleEditClick}
                title="Edit device name"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', marginLeft: 'auto' }}
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="detail-row">
        <span className="detail-label">NAME SOURCE</span>
        <span className="detail-value" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{nameSource}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">TYPE</span>
        <span className="detail-value">{category}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">DEVICE TYPE</span>
        <span className="detail-value">{device.type || 'Unknown'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">NETWORK</span>
        <span className="detail-value">{device.ip || 'N/A'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">MAC</span>
        <span className="detail-value">{device.mac || 'N/A'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">MANUFACTURER</span>
        <span className="detail-value">{device.manufacturer || 'Unknown'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">HOSTNAME</span>
        <span className="detail-value">{device.hostname || 'N/A'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">STATUS</span>
        <span className="detail-value">{getStatusBadge(device.status)}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">CONFIDENCE</span>
        <span className="detail-value">{getConfBadge(device.confidence)}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">DISCOVERY SOURCES</span>
        <span className="detail-value">
          {device.sources && device.sources.length > 0 ? device.sources.join(', ') : 'N/A'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
        <div className="detail-row">
          <span className="detail-label">FIRST SEEN</span>
          <span className="detail-value">{formatTime(device.firstSeen)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">LAST SEEN</span>
          <span className="detail-value">{formatTime(device.lastSeen)}</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;

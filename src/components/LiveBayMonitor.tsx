import React, { useState, useEffect } from 'react';
import type { LiveBayState } from '../data/plantData';
import { hardwareDevices } from '../data/plantData';
import { 
  Truck, 
  Barcode, 
  Gauge, 
  Radio, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle,
  Clock, 
  Cpu, 
  Video, 
  Smartphone, 
  UserCheck, 
  Phone
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import styles from './LiveBayMonitor.module.css';

interface LiveBayMonitorProps {
  liveBay: LiveBayState;
  onToggleBelt: () => void;
}

export const LiveBayMonitor: React.FC<LiveBayMonitorProps> = ({ 
  liveBay, 
  onToggleBelt
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const staleAgeMs = now - (liveBay.lastUpdated || 0);
  const isStale =
    liveBay.status === 'loading' &&
    liveBay.beltState === 'running' &&
    staleAgeMs > 10000;
  const staleSeconds = Math.floor(staleAgeMs / 1000);

  const percentComplete = Math.min(100, (liveBay.loadedQty / liveBay.allocatedQty) * 100);

  const getDeviceIcon = (id: string) => {
    switch (id) {
      case 'mvid01': return <Barcode size={16} />;
      case 'cpplus01': return <Video size={16} />;
      case 'posHandset': return <Smartphone size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  return (
    <div className={`card ${styles.card}`}>
      
      {/* Header Bar */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>
              {liveBay.bayName}
            </h2>
            {isStale && (
              <StatusBadge
                kind="stale"
                title={`Telemetry feed paused for ${staleSeconds}s (>10s threshold)`}
              >
                Data stale ({staleSeconds}s)
              </StatusBadge>
            )}
            <StatusBadge
              kind={
                liveBay.status === 'loading'
                  ? 'loading'
                  : liveBay.status === 'stopped'
                    ? 'stopped'
                    : liveBay.status === 'standby'
                      ? 'standby'
                      : 'preparing'
              }
            >
              {liveBay.status}
            </StatusBadge>
          </div>
          <p className={styles.subtitle}>
            Lane {liveBay.bayId} • {liveBay.dockLocation} • Hikrobot reader & Android POS
          </p>
        </div>

        {/* Vehicle Badge */}
        <div className={styles.vehicleBox}>
          <Truck size={18} color="var(--accent)" />
          <div>
            <div className={styles.vehicleLabel}>Target Vehicle</div>
            <div className={`font-mono ${styles.vehicleReg}`}>
              {liveBay.truckReg || 'No Vehicle'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Progress Display */}
      <div className={styles.progressBox}>
        <div className={styles.progressTop}>
          <div>
            <span className={styles.progressTitle}>Loading Progress</span>
            <div className={styles.countRow}>
              <span className={`font-mono ${styles.loadedQty}`}>
                {liveBay.loadedQty}
              </span>
              <span className={styles.allocatedQty}>
                / {liveBay.allocatedQty} cases
              </span>
            </div>
          </div>
          
          <div>
            <div className={`font-mono ${styles.percentComplete} ${liveBay.status === 'stopped' ? styles.percentStopped : styles.percentRunning}`}>
              {percentComplete.toFixed(1)}%
            </div>
            <div className={styles.etaRow}>
              <Clock size={12} />
              <span>Est. ~{liveBay.estimatedRemainingMinutes} mins remaining</span>
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className={styles.progressTrack}>
          <div 
            className={`${styles.progressFill} ${liveBay.status === 'stopped' ? styles.progressFillStopped : ''}`}
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>

        {/* Live Loading Telemetry Pills */}
        <div className={styles.telemetryRow}>
          <div className={styles.telemetryItem}>
            <Gauge size={16} color="var(--warn)" />
            <span>
              Current Pace: <strong className={styles.itemStrong}>{liveBay.paceCpm} cases/min</strong>
            </span>
          </div>

          <div className={styles.beltControls}>
            <span className={styles.beltLabel}>Conveyor Belt:</span>
            <button 
              onClick={onToggleBelt}
              className={`badge ${liveBay.beltState === 'running' ? 'badge-ok' : 'badge-warn'} ${styles.beltToggleBtn}`}
              title="Click to toggle belt state"
              aria-label={`Toggle belt: currently ${liveBay.beltState}`}
            >
              {liveBay.beltState === 'running' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
              <span>{liveBay.beltState.toUpperCase()}</span>
            </button>
          </div>

          <div className={styles.gateItem}>
            <CheckCircle2 size={16} color={liveBay.gateFlag === 'pass' ? 'var(--ok)' : 'var(--warn)'} />
            <span>
              Gate: <strong className={liveBay.gateFlag === 'pass' ? styles.gatePass : styles.gateWait}>
                {liveBay.gateFlag.toUpperCase()} ({liveBay.gateReason.toUpperCase()})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Supervisor on Duty & Transport Pass Info */}
      <div className={styles.infoGrid}>
        
        {/* Supervisor Card */}
        <div className={styles.infoCard}>
          <div 
            className={styles.avatar}
            style={{ backgroundColor: liveBay.supervisor.avatarColor }}
          >
            {liveBay.supervisor.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className={styles.supLabel}>
              <UserCheck size={12} color="var(--ok)" />
              Assigned Supervisor
            </div>
            <div className={styles.supName}>
              {liveBay.supervisor.name}
            </div>
            <div className={styles.supSub}>
              ID: {liveBay.supervisor.employeeId} • <span className={styles.phoneHighlight}><Phone size={10} className={styles.phoneIcon} /> {liveBay.supervisor.phoneExt}</span>
            </div>
          </div>
        </div>

        {/* Latest Decoded Barcode */}
        <div className={styles.barcodeCard}>
          <div className={styles.barcodeHeader}>
            <Barcode size={14} color="var(--ok)" />
            <span className={styles.barcodeLabel}>Latest Decoded Carton</span>
          </div>
          <div className={`font-mono ${styles.barcodeVal}`}>
            {liveBay.lastScannedBarcode}
          </div>
          <div className={styles.indentSub}>
            {liveBay.indentNo.slice(0, 28)}...
          </div>
        </div>

      </div>

      {/* Shipment manifest context */}
      <div className={styles.manifestGrid}>
        <div className={styles.manifestItem}>
          <div className={styles.manifestLabel}>Dispatch Indent</div>
          <div className={`font-mono ${styles.manifestValue}`} title={liveBay.indentNo}>
            {liveBay.indentNo}
          </div>
        </div>
        <div className={styles.manifestItem}>
          <div className={styles.manifestLabel}>Excise Licence</div>
          <div className={`font-mono ${styles.manifestValue}`} title={liveBay.licenceNo}>
            {liveBay.licenceNo}
          </div>
        </div>
        <div className={styles.manifestItem}>
          <div className={styles.manifestLabel}>Session Active</div>
          <div className={styles.manifestValue}>
            {liveBay.sessionDurationMinutes} min
          </div>
        </div>
      </div>

      {/* Hardware Telemetry Bar */}
      <div>
        <div className={styles.hwHeader}>
          <Radio size={14} color="var(--accent)" />
          <span className={styles.hwTitle}>
            {liveBay.bayName} Hardware Status & Device Diagnostics
          </span>
        </div>
        <div className={styles.hwGrid}>
          {hardwareDevices.map(device => (
            <div 
              key={device.id} 
              className={styles.hwCard}
            >
              <div className={styles.hwIcon}>
                {getDeviceIcon(device.id)}
              </div>
              <div className={styles.hwContent}>
                <div className={styles.hwName}>
                  {device.name}
                </div>
                <div className={styles.hwLatency}>
                  <span className={`pulse-dot online ${styles.hwPulseDot}`}></span>
                  {device.latencyMs}ms lag
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

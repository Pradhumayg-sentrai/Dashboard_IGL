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
  Printer, 
  UserCheck, 
  Phone, 
  ArrowLeft,
  AlertTriangle 
} from 'lucide-react';
import styles from './LiveBayMonitor.module.css';

interface LiveBayMonitorProps {
  liveBay: LiveBayState;
  onToggleBelt: () => void;
  onBackToAllBays?: () => void;
}

export const LiveBayMonitor: React.FC<LiveBayMonitorProps> = ({ 
  liveBay, 
  onToggleBelt,
  onBackToAllBays
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const staleAgeMs = now - (liveBay.lastUpdated || 0);
  const isStale = staleAgeMs > 10000;
  const staleSeconds = Math.floor(staleAgeMs / 1000);

  const percentComplete = Math.min(100, (liveBay.loadedQty / liveBay.allocatedQty) * 100);

  const getDeviceIcon = (id: string) => {
    switch (id) {
      case 'mvid01': return <Barcode size={16} />;
      case 'cpplus01': return <Video size={16} />;
      case 'posHandset': return <Smartphone size={16} />;
      case 'zebraPrinter': return <Printer size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  return (
    <div className={`glass-card ${styles.card}`}>
      
      {/* Header Bar */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            {onBackToAllBays && (
              <button 
                onClick={onBackToAllBays}
                className={`btn-action btn-ghost ${styles.backBtn}`}
                title="Back to fleet view"
                aria-label="Back to all bays"
              >
                <ArrowLeft size={13} />
                <span>All Bays</span>
              </button>
            )}
            <h2 className={styles.title}>
              {liveBay.bayName} ({liveBay.dockLocation})
            </h2>
            {isStale && (
              <span className="badge badge-amber" title={`Telemetry feed paused for ${staleSeconds}s (>10s threshold)`}>
                <AlertTriangle size={11} />
                DATA STALE ({staleSeconds}s)
              </span>
            )}
            <span className={`badge ${liveBay.status === 'loading' ? 'badge-emerald' : liveBay.status === 'stopped' ? 'badge-rose' : 'badge-cyan'}`}>
              <span className={`pulse-dot ${liveBay.status === 'loading' ? 'online' : liveBay.status === 'stopped' ? 'warning' : ''}`}></span>
              {liveBay.status.toUpperCase()}
            </span>
          </div>
          <p className={styles.subtitle}>
            Conveyor Lane {liveBay.bayId} • Connected to Hikrobot Reader & Android POS Handset
          </p>
        </div>

        {/* Vehicle Badge */}
        <div className={styles.vehicleBox}>
          <Truck size={18} color="#38bdf8" />
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
            <Gauge size={16} color="#fbbf24" />
            <span>
              Current Pace: <strong className={styles.itemStrong}>{liveBay.paceCpm} cases/min</strong>
            </span>
          </div>

          <div className={styles.beltControls}>
            <span className={styles.beltLabel}>Conveyor Belt:</span>
            <button 
              onClick={onToggleBelt}
              className={`badge ${liveBay.beltState === 'running' ? 'badge-emerald' : 'badge-amber'} ${styles.beltToggleBtn}`}
              title="Click to toggle belt state"
              aria-label={`Toggle belt: currently ${liveBay.beltState}`}
            >
              {liveBay.beltState === 'running' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
              <span>{liveBay.beltState.toUpperCase()}</span>
            </button>
          </div>

          <div className={styles.gateItem}>
            <CheckCircle2 size={16} color={liveBay.gateFlag === 'pass' ? '#34d399' : '#fbbf24'} />
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
              <UserCheck size={12} color="#34d399" />
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
            <Barcode size={14} color="#34d399" />
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

      {/* Hardware Telemetry Bar */}
      <div>
        <div className={styles.hwHeader}>
          <Radio size={14} color="#38bdf8" />
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

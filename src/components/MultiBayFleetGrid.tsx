import React, { useState, useEffect } from 'react';
import type { LiveBayState } from '../data/plantData';
import { 
  Truck, 
  UserCheck, 
  Clock, 
  ExternalLink, 
  Phone, 
  SlidersHorizontal,
  AlertTriangle 
} from 'lucide-react';
import styles from './MultiBayFleetGrid.module.css';

interface MultiBayFleetGridProps {
  bays: LiveBayState[];
  selectedBayId: number | 'all';
  onSelectBay: (bayId: number | 'all') => void;
  onToggleBayBelt: (bayId: number) => void;
}

export const MultiBayFleetGrid: React.FC<MultiBayFleetGridProps> = ({
  bays,
  selectedBayId,
  onSelectBay,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCount = bays.filter(b => b.status === 'loading').length;
  const stoppedCount = bays.filter(b => b.status === 'stopped').length;
  const preparingCount = bays.filter(b => b.status === 'preparing').length;
  const totalFleetPace = bays.reduce((acc, b) => acc + (b.beltState === 'running' ? b.paceCpm : 0), 0);

  return (
    <div className={`glass-card ${styles.card}`}>
      
      {/* Top Banner with Fleet Summary */}
      <div className={styles.banner}>
        <div>
          <div className={styles.titleRow}>
            <SlidersHorizontal size={20} color="#38bdf8" />
            <h2 className={styles.title}>
              Multi-Bay Concurrent Fleet Operations
            </h2>
            <span className="badge badge-cyan">
              4 CONCURRENT BAYS
            </span>
          </div>
          <p className={styles.subtitle}>
            Live status of physical loading bays, active vehicles, and on-duty dock supervisors
          </p>
        </div>

        {/* Fleet Metrics Pills */}
        <div className={styles.fleetMetrics}>
          <span className={`badge badge-emerald ${styles.statusBadge}`}>
            <span className="pulse-dot online"></span>
            {activeCount} Loading
          </span>
          {stoppedCount > 0 && (
            <span className={`badge badge-rose ${styles.statusBadge}`}>
              <span className="pulse-dot warning"></span>
              {stoppedCount} Stoppage
            </span>
          )}
          <span className={`badge badge-slate ${styles.statusBadge}`}>
            {preparingCount} Staging
          </span>
          <div className={styles.combinedPace}>
            Combined Pace: <strong className={styles.paceHighlight}>{totalFleetPace.toFixed(1)} c/min</strong> ({(totalFleetPace * 60).toLocaleString()} / hr)
          </div>
        </div>
      </div>

      {/* 4 Concurrent Bays Grid */}
      <div className={styles.baysGrid}>
        {bays.map(bay => {
          const isSelected = selectedBayId === bay.bayId;
          const pct = Math.min(100, (bay.loadedQty / bay.allocatedQty) * 100);
          const staleAgeMs = now - (bay.lastUpdated || 0);
          const isStale = staleAgeMs > 10000;
          const staleSeconds = Math.floor(staleAgeMs / 1000);

          return (
            <div 
              key={bay.bayId}
              className={`${styles.bayCard} ${isSelected ? styles.bayCardSelected : ''} ${isStale ? styles.bayCardStale : ''}`}
            >
              {/* Bay Name & Status Badge */}
              <div className={styles.bayHeader}>
                <div>
                  <div className={styles.bayNameRow}>
                    <span className={styles.bayName}>
                      {bay.bayName}
                    </span>
                    <span className={styles.dockLocation}>
                      • {bay.dockLocation}
                    </span>
                  </div>
                  <div className={styles.baySub}>
                    {bay.status === 'loading' && 'Active Conveyor & POS Bridge'}
                    {bay.status === 'stopped' && <strong className={styles.stopCause}>{bay.stopCause}</strong>}
                    {bay.status === 'preparing' && 'Handset Syncing Pass'}
                    {bay.status === 'standby' && 'Awaiting Dispatch Slip'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {isStale && (
                    <span 
                      className={`badge badge-amber ${styles.staleBadge}`}
                      title={`Telemetry feed paused for ${staleSeconds}s (>10s threshold)`}
                    >
                      <AlertTriangle size={11} />
                      DATA STALE ({staleSeconds}s)
                    </span>
                  )}
                  {bay.status === 'loading' && (
                    <span className="badge badge-emerald">
                      <span className="pulse-dot online"></span>
                      LOADING
                    </span>
                  )}
                  {bay.status === 'stopped' && (
                    <span className="badge badge-rose">
                      <span className="pulse-dot warning"></span>
                      STOPPED
                    </span>
                  )}
                  {bay.status === 'preparing' && (
                    <span className="badge badge-cyan">
                      PREPARING
                    </span>
                  )}
                  {bay.status === 'standby' && (
                    <span className="badge badge-slate">
                      STANDBY
                    </span>
                  )}
                </div>
              </div>

              {/* Target Vehicle & Slip */}
              <div className={styles.vehicleBox}>
                <div className={styles.vehicleLeft}>
                  <Truck size={16} color="#38bdf8" />
                  <div>
                    <div className={styles.infoLabel}>Vehicle</div>
                    <div className={`font-mono ${styles.vehicleReg}`}>
                      {bay.truckReg || 'No Vehicle'}
                    </div>
                  </div>
                </div>

                <div className={styles.paceRight}>
                  <div className={styles.infoLabel}>Pace</div>
                  <div className={`font-mono ${styles.paceValue} ${bay.paceCpm > 0 ? styles.paceActive : styles.paceInactive}`}>
                    {bay.paceCpm > 0 ? `${bay.paceCpm} c/min` : '0 c/min'}
                  </div>
                </div>
              </div>

              {/* Loading Progress Bar */}
              <div>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>
                    Progress: <strong className={styles.progressStrong}>{bay.loadedQty} / {bay.allocatedQty} cases</strong>
                  </span>
                  <span className={`font-mono ${styles.progressPct}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div 
                    className={`${styles.progressFill} ${bay.status === 'stopped' ? styles.progressFillStopped : ''}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                {bay.status === 'loading' && (
                  <div className={styles.etaRow}>
                    <Clock size={11} />
                    <span>~{bay.estimatedRemainingMinutes} mins remaining to seal</span>
                  </div>
                )}
              </div>

              {/* Assigned Supervisor Pill */}
              <div className={styles.supervisorRow}>
                <div className={styles.supervisorLeft}>
                  <div 
                    className={styles.avatar}
                    style={{ backgroundColor: bay.supervisor.avatarColor }}
                  >
                    {bay.supervisor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={styles.supervisorName}>
                      <UserCheck size={12} color="#34d399" />
                      {bay.supervisor.name}
                    </div>
                    <div className={styles.supervisorSub}>
                      ID: {bay.supervisor.employeeId} • <span className={styles.phoneHighlight}><Phone size={10} className={styles.phoneIcon} /> {bay.supervisor.phoneExt}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onSelectBay(bay.bayId)}
                  className={`btn-action btn-ghost ${styles.inspectBtn} ${isSelected ? styles.inspectBtnSelected : ''}`}
                  aria-label={isSelected ? `Focused on ${bay.bayName}` : `Inspect ${bay.bayName}`}
                >
                  <ExternalLink size={12} />
                  {isSelected ? 'Focused' : 'Inspect'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

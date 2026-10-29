import React, { useState, useEffect } from 'react';
import type { LiveBayState } from '../data/plantData';
import { 
  Truck, 
  UserCheck, 
  ExternalLink, 
  Phone, 
  SlidersHorizontal
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
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
  const standbyCount = bays.filter(b => b.status === 'standby').length;
  const totalFleetPace = bays.reduce((acc, b) => acc + (b.beltState === 'running' ? b.paceCpm : 0), 0);

  return (
    <div className={`card ${styles.card}`}>
      
      {/* Top Banner with Fleet Summary */}
      <div className={styles.banner}>
        <div>
          <div className={styles.titleRow}>
            <SlidersHorizontal size={18} color="var(--accent)" />
            <h2 className={styles.title}>
              Multi-Bay Fleet Operations
            </h2>
          </div>
        </div>

        {/* Fleet Metrics Pills */}
        <div className={styles.fleetMetrics}>
          {activeCount > 0 && (
            <StatusBadge kind="loading" className={styles.statusBadge}>
              {activeCount} Loading
            </StatusBadge>
          )}
          {stoppedCount > 0 && (
            <StatusBadge kind="stopped" className={styles.statusBadge}>
              {stoppedCount} Stoppage
            </StatusBadge>
          )}
          {preparingCount > 0 && (
            <StatusBadge kind="preparing" className={styles.statusBadge}>
              {preparingCount} Staging
            </StatusBadge>
          )}
          {standbyCount > 0 && (
            <StatusBadge kind="standby" className={styles.statusBadge}>
              {standbyCount} Standby
            </StatusBadge>
          )}
          <div className={styles.combinedPace}>
            <span>Combined Pace:</span>{' '}
            <strong className={styles.paceHighlight}>
              {Math.round(totalFleetPace * 60).toLocaleString()}
            </strong>{' '}
            <span>cartons/hr</span>
          </div>
        </div>
      </div>

      {/* Concurrent Bays Grid */}
      <div className={styles.baysGrid}>
        {bays.map(bay => {
          const isSelected = selectedBayId === bay.bayId;
          const pct = Math.min(100, (bay.loadedQty / bay.allocatedQty) * 100);
          const staleAgeMs = now - (bay.lastUpdated || 0);
          const isStale =
            bay.status === 'loading' &&
            bay.beltState === 'running' &&
            staleAgeMs > 10000;
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
                  {bay.status === 'stopped' && (
                    <div className={styles.baySub}>
                      <strong className={styles.stopCause}>{bay.stopCause}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {isStale && (
                    <StatusBadge
                      kind="stale"
                      className={styles.staleBadge}
                      title={`Telemetry feed paused for ${staleSeconds}s (>10s threshold)`}
                    >
                      Data stale ({staleSeconds}s)
                    </StatusBadge>
                  )}
                  <StatusBadge
                    kind={
                      bay.status === 'loading'
                        ? 'loading'
                        : bay.status === 'stopped'
                          ? 'stopped'
                          : bay.status === 'preparing'
                            ? 'preparing'
                            : 'standby'
                    }
                  >
                    {bay.status}
                  </StatusBadge>
                </div>
              </div>

              {/* Target Vehicle & Slip */}
              <div className={styles.vehicleBox}>
                <div className={styles.vehicleLeft}>
                  <Truck size={16} color="var(--accent)" />
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
                  <span className={styles.progressRight}>
                    {bay.status === 'loading' && (
                      <span className={styles.etaInline}>~{bay.estimatedRemainingMinutes}m</span>
                    )}
                    <span className={`font-mono ${styles.progressPct}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div 
                    className={`${styles.progressFill} ${bay.status === 'stopped' ? styles.progressFillStopped : ''}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
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
                      <UserCheck size={12} color="var(--ok)" />
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

import React, { useState } from 'react';
import type { LiveBayState } from '../data/plantData';
import { AlertTriangle, SlidersHorizontal, Truck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CallSupervisorButton } from './CallSupervisorButton';
import { BayAssignmentModal } from './BayAssignmentModal';
import { plainBayStatus, plainStopCause } from '../utils/plainLanguage';
import styles from './MultiBayFleetGrid.module.css';

interface MultiBayFleetGridProps {
  bays: LiveBayState[];
  onSelectBay: (bayId: number) => void;
}

const statusKind = (status: LiveBayState['status']) => {
  switch (status) {
    case 'loading':
      return 'loading' as const;
    case 'stopped':
      return 'stopped' as const;
    case 'preparing':
      return 'preparing' as const;
    default:
      return 'standby' as const;
  }
};

export const MultiBayFleetGrid: React.FC<MultiBayFleetGridProps> = ({ bays, onSelectBay }) => {
  const [assigningBay, setAssigningBay] = useState<LiveBayState | null>(null);

  const activeCount = bays.filter(bay => bay.status === 'loading').length;
  const stoppedCount = bays.filter(bay => bay.status === 'stopped').length;
  const preparingCount = bays.filter(bay => bay.status === 'preparing').length;
  const standbyCount = bays.filter(bay => bay.status === 'standby').length;

  return (
    <section className={`card ${styles.card}`} aria-labelledby="loading-bays-title">
      <div className={styles.banner}>
        <div className={styles.titleRow}>
          <SlidersHorizontal size={19} color="var(--accent)" aria-hidden="true" />
          <h2 id="loading-bays-title" className={styles.title}>
            Loading bays
          </h2>
        </div>

        <div className={styles.fleetMetrics}>
          {activeCount > 0 && <StatusBadge kind="loading">{activeCount} loading</StatusBadge>}
          {stoppedCount > 0 && <StatusBadge kind="stopped">{stoppedCount} stopped</StatusBadge>}
          {preparingCount > 0 && <StatusBadge kind="preparing">{preparingCount} getting ready</StatusBadge>}
          {standbyCount > 0 && <StatusBadge kind="standby">{standbyCount} waiting</StatusBadge>}
        </div>
      </div>

      <div className={styles.baysGrid}>
        {bays.map(bay => {
          const percentLoaded = Math.min(100, (bay.loadedQty / bay.allocatedQty) * 100);
          const isStopped = bay.status === 'stopped';
          const reason = isStopped ? plainStopCause(bay.stopCause) : undefined;

          return (
            <article
              key={bay.bayId}
              className={`${styles.bayCard} ${isStopped ? styles.bayCardStopped : ''}`}
              aria-label={`${bay.bayName}, ${plainBayStatus(bay.status)}`}
            >
              <div className={styles.bayHeader}>
                <div className={styles.bayIdentity}>
                  <div className={styles.bayNameRow}>
                    <span className={styles.bayName}>{bay.bayName}</span>
                    <StatusBadge kind={statusKind(bay.status)}>
                      {plainBayStatus(bay.status)}
                    </StatusBadge>
                  </div>
                  <span className={styles.dockLocation}>{bay.dockLocation}</span>
                </div>
              </div>

              {isStopped && reason && (
                <div className={styles.problem}>
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>{reason}</span>
                </div>
              )}

              <div className={styles.truckRow}>
                <div className={styles.truckIdentity}>
                  <Truck size={17} color="var(--accent)" aria-hidden="true" />
                  <span className={`font-mono ${styles.truckReg}`}>
                    {bay.truckReg || 'No truck yet'}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.assignPillBtn}
                  onClick={() => setAssigningBay(bay)}
                  title={`Assign truck and supervisor to ${bay.bayName}`}
                  aria-label={`Assign truck and supervisor to ${bay.bayName}`}
                >
                  Assign
                </button>
              </div>

              <div>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>
                    <strong>{bay.loadedQty.toLocaleString()}</strong> of{' '}
                    {bay.allocatedQty.toLocaleString()} cartons
                  </span>
                  {bay.status === 'loading' && (
                    <span className={styles.timeLeft}>
                      About {Math.max(1, Math.round(bay.estimatedRemainingMinutes))} min left
                    </span>
                  )}
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressFill} ${isStopped ? styles.progressFillStopped : ''}`}
                    style={{ width: `${percentLoaded}%` }}
                  />
                </div>
              </div>

              <div className={styles.cardActions}>
                <CallSupervisorButton
                  bay={bay}
                  reason={reason}
                  className={styles.callBtn}
                />
                <button
                  type="button"
                  className={`btn-action btn-ghost ${styles.detailsBtn}`}
                  onClick={() => onSelectBay(bay.bayId)}
                >
                  See bay
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {assigningBay && (
        <BayAssignmentModal
          bay={assigningBay}
          isOpen={true}
          onClose={() => setAssigningBay(null)}
        />
      )}
    </section>
  );
};

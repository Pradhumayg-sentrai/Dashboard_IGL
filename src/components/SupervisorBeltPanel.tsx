import React, { useState } from 'react';
import { PlayCircle, Power, StopCircle } from 'lucide-react';
import { useBays, useToggleBayBelt } from '../store/dashboardStore';
import { StatusBadge } from './StatusBadge';
import { plainBayStatus } from '../utils/plainLanguage';
import styles from './SupervisorBeltPanel.module.css';

interface PendingChange {
  bayId: number;
  action: 'start' | 'stop';
}

export const SupervisorBeltPanel: React.FC = () => {
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const [pending, setPending] = useState<PendingChange | null>(null);

  const askToChange = (bayId: number, action: 'start' | 'stop') => {
    setPending({ bayId, action });
  };

  const confirmChange = () => {
    if (!pending) return;
    toggleBayBelt(pending.bayId);
    setPending(null);
  };

  return (
    <section className={`card ${styles.card}`} aria-labelledby="belt-controls-title">
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <Power size={19} aria-hidden="true" />
            <h2 id="belt-controls-title" className={styles.title}>
              Belt controls
            </h2>
          </div>
          <p className={styles.subtitle}>
            Supervisors only. Call the bay operator before changing a belt.
          </p>
        </div>
        <StatusBadge kind="info">Supervisor only</StatusBadge>
      </div>

      <div className={styles.grid}>
        {bays.map(bay => {
          const isRunning = bay.beltState === 'running';
          const isPending = pending?.bayId === bay.bayId;
          const pendingAction = isPending ? pending.action : null;

          return (
            <div key={bay.bayId} className={styles.bayRow}>
              <div className={styles.bayInfo}>
                <strong className={styles.bayName}>{bay.bayName}</strong>
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
                  {plainBayStatus(bay.status)}
                </StatusBadge>
                <span className={styles.beltState}>{isRunning ? 'Belt is running' : 'Belt is stopped'}</span>
              </div>

              {isPending ? (
                <div className={styles.confirmBar} role="group" aria-label={`Confirm ${pendingAction} for ${bay.bayName}`}>
                  <span className={styles.confirmText}>
                    {pendingAction === 'stop' ? 'Stop this belt?' : 'Start this belt?'}
                  </span>
                  <button
                    type="button"
                    className={`btn-action ${pendingAction === 'stop' ? 'btn-danger' : 'btn-primary'} ${styles.confirmBtn}`}
                    onClick={confirmChange}
                  >
                    {pendingAction === 'stop' ? <StopCircle size={17} /> : <PlayCircle size={17} />}
                    Yes, {pendingAction}
                  </button>
                  <button
                    type="button"
                    className={`btn-action btn-ghost ${styles.confirmBtn}`}
                    onClick={() => setPending(null)}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`btn-action ${isRunning ? 'btn-danger' : 'btn-primary'} ${styles.controlBtn}`}
                  onClick={() => askToChange(bay.bayId, isRunning ? 'stop' : 'start')}
                >
                  {isRunning ? <StopCircle size={17} /> : <PlayCircle size={17} />}
                  {isRunning ? 'Stop belt' : 'Start belt'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

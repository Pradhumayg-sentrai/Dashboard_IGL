import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useBays, useIncidents, useSetInspectedIncident } from '../../store/dashboardStore';
import { StatusBadge } from '../../components/StatusBadge';
import { CallSupervisorButton } from '../../components/CallSupervisorButton';
import {
  formatIncidentTime,
  plainIncidentType,
  plainStopCause,
} from '../../utils/plainLanguage';
import styles from './ActiveAlarmsPanel.module.css';

export const ActiveAlarmsPanel: React.FC = () => {
  const bays = useBays();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();
  const navigate = useNavigate();

  const stoppedBays = bays.filter(bay => bay.status === 'stopped');

  const highIncidents = incidents.filter(
    incident =>
      (incident.severity === 'high' || incident.severity === 'critical') &&
      incident.status === 'open',
  );

  const totalAlarmsCount = stoppedBays.length + highIncidents.length;

  return (
    <section className={`card ${styles.panel}`} aria-labelledby="needs-help-title">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <AlertOctagon size={20} color="var(--critical)" aria-hidden="true" />
          <h2 id="needs-help-title" className={styles.title}>
            What needs help
          </h2>
        </div>

        <StatusBadge kind={totalAlarmsCount > 0 ? 'critical' : 'ok'}>
          {totalAlarmsCount > 0
            ? `${totalAlarmsCount} ${totalAlarmsCount === 1 ? 'needs' : 'need'} help`
            : 'All okay'}
        </StatusBadge>
      </div>

      <div className={styles.alarmList} role="list">
        {stoppedBays.map(bay => {
          const reason = plainStopCause(bay.stopCause);

          return (
            <div key={`bay-stop-${bay.bayId}`} className={styles.alarmRow} role="listitem">
              <div className={styles.alarmMain}>
                <AlertOctagon size={18} className={styles.iconCritical} aria-hidden="true" />
                <div className={styles.alarmText}>
                  <strong>{bay.bayName}</strong> is stopped. {reason}.
                </div>
              </div>

              <div className={styles.alarmActions}>
                <CallSupervisorButton
                  bay={bay}
                  reason={reason}
                  className={styles.callBtn}
                />
                <button
                  type="button"
                  className={`btn-action btn-ghost ${styles.rowBtn}`}
                  onClick={() => navigate(`/bay/${bay.bayId}`)}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Show bay
                </button>
              </div>
            </div>
          );
        })}

        {highIncidents.map(incident => {
          const bay = bays.find(item => item.bayId === incident.bay_id);
          const reason = plainIncidentType(incident.type);

          return (
            <div key={`inc-${incident.id}`} className={styles.alarmRow} role="listitem">
              <div className={styles.alarmMain}>
                <AlertTriangle size={18} className={styles.iconWarn} aria-hidden="true" />
                <div className={styles.alarmText}>
                  <strong>{incident.bay_name ?? 'Loading bay'}</strong>: {reason}.
                  <span className={styles.alarmTime}>{formatIncidentTime(incident.occurred_at)}</span>
                </div>
              </div>

              <div className={styles.alarmActions}>
                {bay && (
                  <CallSupervisorButton
                    bay={bay}
                    reason={reason}
                    className={styles.callBtn}
                  />
                )}
                <button
                  type="button"
                  className={`btn-action btn-ghost ${styles.rowBtn}`}
                  onClick={() => setInspectedIncident(incident)}
                >
                  <Eye size={16} aria-hidden="true" />
                  Show camera
                </button>
              </div>
            </div>
          );
        })}

        {totalAlarmsCount === 0 && (
          <div className={styles.empty} role="listitem">
            <CheckCircle2 size={28} aria-hidden="true" />
            <div>
              <strong>All bays are running normally.</strong>
              <p>No action is needed right now.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

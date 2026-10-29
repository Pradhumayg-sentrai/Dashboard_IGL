import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  useBays,
  useToggleBayBelt,
  useIncidents,
  useSetInspectedIncident,
} from '../../store/dashboardStore';
import { StatusBadge } from '../../components/StatusBadge';
import styles from './ActiveAlarmsPanel.module.css';

export const ActiveAlarmsPanel: React.FC = () => {
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();
  const navigate = useNavigate();

  // Stopped or warning bays
  const stoppedBays = bays.filter(
    bay => bay.status === 'stopped' || bay.beltState === 'paused' || bay.beltState === 'stopped',
  );
  // High severity open incidents
  const highIncidents = incidents.filter(
    incident => (incident.severity === 'high' || incident.severity === 'critical')
      && incident.status === 'open',
  );

  const totalAlarmsCount = stoppedBays.length + highIncidents.length;

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <AlertOctagon size={18} color="var(--critical)" />
          <h3 className={styles.title}>Active Alarms</h3>
        </div>

        <StatusBadge kind={totalAlarmsCount > 0 ? 'critical' : 'ok'}>
          {totalAlarmsCount} active
        </StatusBadge>
      </div>

      <div className={styles.alarmList} role="list">
        {stoppedBays.map(bay => (
          <div
            key={`bay-stop-${bay.bayId}`}
            className={styles.alarmRow}
            role="listitem"
            title={`${bay.bayName} (${bay.dockLocation}) — ${bay.stopCause || 'Lane stoppage trigger'}`}
          >
            <AlertOctagon size={14} className={styles.iconCritical} aria-hidden="true" />

            <span className={styles.alarmText}>
              <strong>{bay.bayName}</strong>
              {' · '}
              {bay.dockLocation}
              {' — '}
              <span className={styles.causeCritical}>
                {bay.stopCause || 'Lane stoppage trigger'}
              </span>
            </span>

            <span className={styles.alarmActions}>
              <button
                type="button"
                onClick={() => toggleBayBelt(bay.bayId)}
                className={`btn-action btn-ghost ${styles.rowBtn} ${styles.rowBtnResume}`}
                title="Restart conveyor belt"
                aria-label={`Restart ${bay.bayName} conveyor belt`}
              >
                <PlayCircle size={13} />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/bay/${bay.bayId}`)}
                className={`btn-action btn-ghost ${styles.rowBtn}`}
                title="Open bay cockpit"
                aria-label={`Inspect ${bay.bayName}`}
              >
                <ExternalLink size={13} />
              </button>
            </span>
          </div>
        ))}

        {highIncidents.map(incident => (
          <div
            key={`inc-${incident.id}`}
            className={styles.alarmRow}
            role="listitem"
            title={`AI camera alert #${incident.id} — ${incident.details}`}
          >
            <AlertTriangle size={14} className={styles.iconWarn} aria-hidden="true" />

            <span className={styles.alarmText}>
              <strong>{incident.bay_name ?? 'Plant'}</strong>
              {' · AI #'}
              {incident.id}
              {' — '}
              <span className={styles.causeWarn}>
                {incident.type.replace('_', ' ').toUpperCase()}
              </span>
            </span>

            <span className={styles.alarmActions}>
              <button
                type="button"
                onClick={() => setInspectedIncident(incident)}
                className={`btn-action btn-ghost ${styles.rowBtn}`}
                title="Inspect CCTV video frame"
                aria-label={`Inspect incident #${incident.id}`}
              >
                <Eye size={13} />
              </button>
            </span>
          </div>
        ))}

        {totalAlarmsCount === 0 && (
          <div className={styles.noAlarmsRow} role="listitem">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>
              All {bays.length} loading docks operating within normal conveyor speed and zero CCTV telemetry alarms.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

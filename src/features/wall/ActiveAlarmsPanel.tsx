import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  PlayCircle, 
  ExternalLink 
} from 'lucide-react';
import { useBays, useToggleBayBelt, useIncidents, useSetInspectedIncident } from '../../store/dashboardStore';
import styles from './ActiveAlarmsPanel.module.css';

export const ActiveAlarmsPanel: React.FC = () => {
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();
  const navigate = useNavigate();

  // Stopped or warning bays
  const stoppedBays = bays.filter(b => b.status === 'stopped' || b.beltState === 'paused' || b.beltState === 'stopped');
  // High severity open incidents
  const highIncidents = incidents.filter(
    i => (i.severity === 'high' || i.severity === 'critical') && i.status === 'open',
  );

  const totalAlarmsCount = stoppedBays.length + highIncidents.length;

  return (
    <div className={`glass-card ${styles.panel}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <AlertOctagon size={20} color="#f43f5e" />
          <h3 className={styles.title}>
            Live Plant Alarms & Automated Interventions
          </h3>
        </div>

        <span className={`badge ${totalAlarmsCount > 0 ? 'badge-rose' : 'badge-emerald'}`}>
          <span className={`pulse-dot ${totalAlarmsCount > 0 ? 'warning' : 'online'}`}></span>
          {totalAlarmsCount} ACTIVE ALARMS
        </span>
      </div>

      <div className={styles.alarmGrid}>
        {/* Stopped Bay Alarms */}
        {stoppedBays.map(bay => (
          <div key={`bay-stop-${bay.bayId}`} className={styles.alarmCard}>
            <div className={styles.alarmLeft}>
              <AlertTriangle size={20} className={styles.alarmIconRose} />
              <div>
                <div className={styles.alarmBayName}>
                  {bay.bayName} ({bay.dockLocation}) • Vehicle {bay.truckReg || 'N/A'}
                </div>
                <div className={styles.alarmCause}>
                  Conveyor Halted: {bay.stopCause || 'Lane stoppage trigger'}
                </div>
                <div className={styles.alarmMeta}>
                  Supervisor: {bay.supervisor.name} (Ext {bay.supervisor.phoneExt}) • Progress: {bay.loadedQty}/{bay.allocatedQty} cases
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => toggleBayBelt(bay.bayId)}
                className={`btn-action btn-ghost ${styles.alarmActionBtn}`}
                style={{ color: '#34d399' }}
                title="Restart conveyor belt"
                aria-label={`Restart ${bay.bayName} conveyor belt`}
              >
                <PlayCircle size={13} /> Resume
              </button>
              <button 
                onClick={() => navigate(`/bay/${bay.bayId}`)}
                className={`btn-action btn-ghost ${styles.alarmActionBtn}`}
                style={{ color: '#38bdf8' }}
                title="Open single bay cockpit"
                aria-label={`Inspect ${bay.bayName}`}
              >
                <ExternalLink size={13} /> Cockpit
              </button>
            </div>
          </div>
        ))}

        {/* High Severity AI Incidents */}
        {highIncidents.map(inc => (
          <div key={`inc-${inc.id}`} className={`${styles.alarmCard} ${styles.alarmCardWarning}`}>
            <div className={styles.alarmLeft}>
              <AlertTriangle size={20} className={styles.alarmIconAmber} />
              <div>
                <div className={styles.alarmBayName}>
                  AI Camera Alert #{inc.id}: {inc.type.replace('_', ' ').toUpperCase()}
                </div>
                <div className={`${styles.alarmCause} ${styles.alarmCauseAmber}`}>
                  {inc.details}
                </div>
                <div className={styles.alarmMeta}>
                  Timestamp: {inc.occurred_at} • Barcode: {inc.barcode_value || 'Unassociated'}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setInspectedIncident(inc)}
              className={`btn-action btn-ghost ${styles.alarmActionBtn}`}
              style={{ color: '#38bdf8' }}
              title="Inspect CCTV video frame"
              aria-label={`Inspect Incident #${inc.id}`}
            >
              <ExternalLink size={13} /> View Frame
            </button>
          </div>
        ))}

        {totalAlarmsCount === 0 && (
          <div className={styles.noAlarmsCard}>
            <CheckCircle2 size={20} />
            <span>All 4 loading docks operating within normal conveyor speed and zero CCTV telemetry alarms.</span>
          </div>
        )}
      </div>
    </div>
  );
};


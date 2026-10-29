import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react';
import { useBays, useDashboardStore, useIncidents } from '../store/dashboardStore';
import { KpiScorecard } from '../components/KpiScorecard';
import { MultiBayFleetGrid } from '../components/MultiBayFleetGrid';
import { ActiveAlarmsPanel } from '../features/wall/ActiveAlarmsPanel';
import styles from './WallDisplayPage.module.css';

export const WallDisplayPage: React.FC = () => {
  const bays = useBays();
  const incidents = useIncidents();
  const getKpis = useDashboardStore(s => s.getKpis);
  const navigate = useNavigate();

  const kpis = getKpis();
  const stoppedCount = bays.filter(bay => bay.status === 'stopped').length;
  const loadingCount = bays.filter(bay => bay.status === 'loading').length;
  const alertCount = incidents.filter(
    incident =>
      (incident.severity === 'high' || incident.severity === 'critical') &&
      incident.status === 'open',
  ).length;
  const helpCount = stoppedCount + alertCount;
  const needsHelp = helpCount > 0;

  const stoppedLabel = `${stoppedCount} ${stoppedCount === 1 ? 'bay' : 'bays'} stopped`;
  const alertLabel = `${alertCount} camera ${alertCount === 1 ? 'alert' : 'alerts'}`;

  return (
    <div className={styles.wallContainer}>
      <div className={`card ${styles.statusBanner} ${needsHelp ? styles.statusAlert : styles.statusOk}`}>
        <div className={styles.statusIcon}>
          {needsHelp ? (
            <AlertTriangle size={30} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={30} aria-hidden="true" />
          )}
        </div>
        <div className={styles.statusText}>
          <h2 className={styles.statusTitle}>
            {needsHelp
              ? `${helpCount} ${helpCount === 1 ? 'thing needs' : 'things need'} help`
              : 'All bays running'}
          </h2>
          <p className={styles.statusSub}>
            {needsHelp
              ? `${stoppedLabel}, ${alertLabel}`
              : `${loadingCount} of ${bays.length} bays loading now`}
          </p>
        </div>
        <Link to="/help" className={styles.helpLink}>
          <CircleHelp size={17} aria-hidden="true" />
          How to use this screen
        </Link>
      </div>

      <KpiScorecard kpis={kpis} timeframe="realtime" />

      <div className={styles.mainGrid}>
        <MultiBayFleetGrid
          bays={bays}
          onSelectBay={bayId => navigate(`/bay/${bayId}`)}
        />
        <ActiveAlarmsPanel />
      </div>
    </div>
  );
};

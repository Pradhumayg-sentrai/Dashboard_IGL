import React, { useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  LayoutGrid,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { LiveBayState } from '../data/plantData';
import {
  useBays,
  useIncidents,
  useSetInspectedIncident,
} from '../store/dashboardStore';
import { LiveBayMonitor } from '../components/LiveBayMonitor';
import { StatusBadge } from '../components/StatusBadge';
import { CallSupervisorButton } from '../components/CallSupervisorButton';
import {
  formatIncidentTime,
  plainBayStatus,
  plainIncidentType,
  plainSeverity,
} from '../utils/plainLanguage';
import styles from './BayCockpitPage.module.css';

const statusDotClass = (status: LiveBayState['status']) => {
  switch (status) {
    case 'loading':
      return styles.tabStatusLoading;
    case 'stopped':
      return styles.tabStatusStopped;
    case 'preparing':
      return styles.tabStatusPreparing;
    default:
      return styles.tabStatusStandby;
  }
};

const severityKind = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'critical' as const;
    case 'medium':
      return 'warning' as const;
    default:
      return 'low' as const;
  }
};

export const BayCockpitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bays = useBays();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();

  const parsedId = Number(id);
  const currentBay = bays.find(bay => bay.bayId === parsedId) || bays[0];
  const isValidBay = bays.some(bay => bay.bayId === parsedId);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // Keep the active dock tab visible when navigating from an overview card.
  useEffect(() => {
    const activeTab = tabsRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentBay.bayId]);

  const bayIncidents = incidents
    .filter(
      incident =>
        incident.bay_id === currentBay.bayId && incident.status === 'open',
    )
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const openBayIncidentCount = bayIncidents.length;

  if (!isValidBay) {
    return <Navigate to="/bay/1" replace />;
  }

  return (
    <div className={styles.container}>
      <div className={`card ${styles.bayNavCard}`}>
        <div className={styles.bayNavTop}>
          <span className={styles.bayNavTitle}>
            <SlidersHorizontal size={16} color="var(--accent)" aria-hidden="true" />
            Choose a bay
          </span>
          <Link to="/wall" className={styles.fleetLink}>
            <LayoutGrid size={16} aria-hidden="true" />
            Back to overview
          </Link>
        </div>

        <div className={styles.tabsGrid} ref={tabsRef}>
          {bays.map(bay => {
            const isActive = bay.bayId === currentBay.bayId;

            return (
              <Link
                key={bay.bayId}
                to={`/bay/${bay.bayId}`}
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${bay.bayName}, ${bay.dockLocation}, ${plainBayStatus(bay.status)}`}
              >
                <span className={styles.tabMain}>
                  <span
                    className={`${styles.tabStatusDot} ${statusDotClass(bay.status)}`}
                    aria-hidden="true"
                  />
                  <span>{bay.bayName}</span>
                </span>
                <span className={styles.tabDock}>
                  {bay.dockLocation.replace(/ Dock$/, '')}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.bayGridSection}>
        <div>
          <LiveBayMonitor liveBay={currentBay} />
        </div>

        <section className={`card ${styles.incidentsPanel}`} aria-labelledby="camera-alerts-title">
          <div className={styles.incidentsHeader}>
            <div>
              <div className={styles.incidentsTitle}>
                <AlertTriangle size={19} color="var(--warn-text)" aria-hidden="true" />
                <h2 id="camera-alerts-title" className={styles.incidentsTitleText}>
                  Camera alerts
                </h2>
              </div>
              <p className={styles.incidentsSubtitle}>
                Things the camera saw at {currentBay.bayName}.
              </p>
            </div>

            <StatusBadge kind={openBayIncidentCount > 0 ? 'critical' : 'ok'}>
              {openBayIncidentCount > 0
                ? `${openBayIncidentCount} ${openBayIncidentCount === 1 ? 'needs' : 'need'} help`
                : 'All clear'}
            </StatusBadge>
          </div>

          <div className={styles.incidentList}>
            {bayIncidents.length === 0 && (
              <div className={styles.incidentsEmpty}>
                <ShieldCheck size={22} aria-hidden="true" />
                <span>No camera alerts at this bay.</span>
              </div>
            )}

            {bayIncidents.map(item => (
              <div key={item.id} className={styles.incidentItem}>
                <div className={styles.incidentLeft}>
                  <StatusBadge kind={severityKind(item.severity)}>
                    {plainSeverity(item.severity)}
                  </StatusBadge>
                  <div>
                    <div className={styles.incidentType}>
                      {plainIncidentType(item.type)}
                    </div>
                    <div className={styles.incidentTime}>
                      {formatIncidentTime(item.occurred_at)}
                    </div>
                  </div>
                </div>

                <div className={styles.incidentActions}>
                  <CallSupervisorButton
                    bay={currentBay}
                    reason={plainIncidentType(item.type)}
                    className={styles.incidentCallBtn}
                  />
                  <button
                    type="button"
                    onClick={() => setInspectedIncident(item)}
                    className={`btn-action btn-ghost ${styles.actionBtn}`}
                    title="Show the camera picture"
                  >
                    <Eye size={16} aria-hidden="true" />
                    Show camera
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

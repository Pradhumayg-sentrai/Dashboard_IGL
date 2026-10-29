import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Eye,
  LayoutGrid,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { IncidentItem, LiveBayState } from '../data/plantData';
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
  isAlertCritical,
  plainBayStatus,
  plainIncidentAdvice,
  plainIncidentType,
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

export const BayCockpitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bays = useBays();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'urgent'>('all');

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

  const criticalIncidents = useMemo(() => {
    return bayIncidents.filter(isAlertCritical);
  }, [bayIncidents]);

  const urgentIncidents = useMemo(() => {
    return bayIncidents.filter(item => !isAlertCritical(item));
  }, [bayIncidents]);

  const openBayIncidentCount = bayIncidents.length;

  if (!isValidBay) {
    return <Navigate to="/bay/1" replace />;
  }

  const renderIncidentCard = (item: IncidentItem) => {
    const isCritical = isAlertCritical(item);

    return (
      <div
        key={item.id}
        className={`${styles.incidentItem} ${isCritical ? styles.incidentItemCritical : styles.incidentItemUrgent}`}
      >
        <div className={styles.incidentLeft}>
          <StatusBadge kind={isCritical ? 'critical' : 'warning'}>
            {isCritical ? 'Critical' : 'Urgent'}
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

        <div className={styles.incidentAdvice}>
          {plainIncidentAdvice(item.type)}
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
    );
  };

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

            {openBayIncidentCount === 0 ? (
              <StatusBadge kind="ok">All clear</StatusBadge>
            ) : (
              <div className={styles.headerBadges}>
                {criticalIncidents.length > 0 && (
                  <StatusBadge kind="critical">
                    {criticalIncidents.length} Critical
                  </StatusBadge>
                )}
                {urgentIncidents.length > 0 && (
                  <StatusBadge kind="warning">
                    {urgentIncidents.length} Urgent
                  </StatusBadge>
                )}
              </div>
            )}
          </div>

          {openBayIncidentCount > 0 && (
            <div className={styles.alertFilterRow} role="group" aria-label="Filter alerts by urgency">
              <button
                type="button"
                className={`${styles.filterPill} ${alertFilter === 'all' ? styles.filterPillActive : ''}`}
                onClick={() => setAlertFilter('all')}
              >
                All ({openBayIncidentCount})
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${alertFilter === 'critical' ? styles.filterPillActive : ''} ${criticalIncidents.length > 0 ? styles.filterPillCritical : ''}`}
                onClick={() => setAlertFilter('critical')}
              >
                <AlertOctagon size={13} className={styles.iconCritical} aria-hidden="true" />
                Critical ({criticalIncidents.length})
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${alertFilter === 'urgent' ? styles.filterPillActive : ''} ${urgentIncidents.length > 0 ? styles.filterPillUrgent : ''}`}
                onClick={() => setAlertFilter('urgent')}
              >
                <AlertTriangle size={13} className={styles.iconUrgent} aria-hidden="true" />
                Urgent ({urgentIncidents.length})
              </button>
            </div>
          )}

          <div className={styles.incidentList}>
            {openBayIncidentCount === 0 && (
              <div className={styles.incidentsEmpty}>
                <ShieldCheck size={22} aria-hidden="true" />
                <span>No camera alerts at this bay.</span>
              </div>
            )}

            {alertFilter === 'all' && (
              <>
                {criticalIncidents.length > 0 && (
                  <>
                    <div className={styles.sectionDivider}>
                      <AlertOctagon size={16} className={styles.iconCritical} aria-hidden="true" />
                      <span className={styles.sectionHeading}>Critical Alerts</span>
                      <span className={styles.sectionBadge}>{criticalIncidents.length}</span>
                    </div>
                    {criticalIncidents.map(renderIncidentCard)}
                  </>
                )}

                {urgentIncidents.length > 0 && (
                  <>
                    <div className={styles.sectionDivider}>
                      <AlertTriangle size={16} className={styles.iconUrgent} aria-hidden="true" />
                      <span className={styles.sectionHeading}>Urgent Alerts</span>
                      <span className={styles.sectionBadge}>{urgentIncidents.length}</span>
                    </div>
                    {urgentIncidents.map(renderIncidentCard)}
                  </>
                )}
              </>
            )}

            {alertFilter === 'critical' && (
              <>
                {criticalIncidents.length === 0 ? (
                  <div className={styles.incidentsEmpty}>
                    <ShieldCheck size={22} aria-hidden="true" />
                    <span>No critical camera alerts at this bay.</span>
                  </div>
                ) : (
                  criticalIncidents.map(renderIncidentCard)
                )}
              </>
            )}

            {alertFilter === 'urgent' && (
              <>
                {urgentIncidents.length === 0 ? (
                  <div className={styles.incidentsEmpty}>
                    <ShieldCheck size={22} aria-hidden="true" />
                    <span>No urgent camera alerts at this bay.</span>
                  </div>
                ) : (
                  urgentIncidents.map(renderIncidentCard)
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

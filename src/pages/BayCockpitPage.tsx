import React, { useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  ShieldAlert, 
  ShieldCheck,
  Eye, 
  CheckCircle2,
  LayoutGrid,
  PlayCircle,
  PauseCircle,
  Clock3,
  CircleDashed
} from 'lucide-react';
import type { LiveBayState } from '../data/plantData';
import { 
  useBays, 
  useToggleBayBelt, 
  useIncidents, 
  useSetInspectedIncident,
} from '../store/dashboardStore';
import { reviewIncident } from '../data/actions';
import { LiveBayMonitor } from '../components/LiveBayMonitor';
import { StatusBadge } from '../components/StatusBadge';
import styles from './BayCockpitPage.module.css';

const bayStatusIcon = (status: LiveBayState['status']) => {
  switch (status) {
    case 'loading':
      return <PlayCircle size={12} aria-hidden="true" />;
    case 'stopped':
      return <PauseCircle size={12} aria-hidden="true" />;
    case 'preparing':
      return <Clock3 size={12} aria-hidden="true" />;
    default:
      return <CircleDashed size={12} aria-hidden="true" />;
  }
};

export const BayCockpitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();

  const parsedId = Number(id);
  const currentBay = bays.find(b => b.bayId === parsedId) || bays[0];
  const isValidBay = bays.some(b => b.bayId === parsedId);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // Keep the active dock tab visible when navigating from a 10-bay fleet card.
  useEffect(() => {
    const activeTab = tabsRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentBay.bayId]);

  // Incidents are scoped to the bay and open cases always surface first.
  const bayIncidents = incidents
    .filter(i => i.bay_id === currentBay.bayId)
    .sort((a, b) => {
      const openRank = Number(b.status === 'open') - Number(a.status === 'open');
      return openRank !== 0 ? openRank : b.occurred_at.localeCompare(a.occurred_at);
    });
  const openBayIncidentCount = bayIncidents.filter(i => i.status === 'open').length;

  if (!isValidBay) {
    return <Navigate to="/bay/1" replace />;
  }

  return (
    <div className={styles.container}>
      
      {/* 1. Bay Switcher */}
      <div className={`card ${styles.bayNavCard}`}>
        <div className={styles.bayNavTop}>
          <span className={styles.bayNavTitle}>
            <SlidersHorizontal size={15} color="var(--accent)" />
            Select dock
          </span>
          <Link to="/wall" className={styles.fleetLink}>
            <LayoutGrid size={14} />
            Fleet wall
          </Link>
        </div>

        <div className={styles.tabsGrid} ref={tabsRef}>
          {bays.map(b => {
            const isActive = b.bayId === currentBay.bayId;
            const statusClass =
              b.status === 'loading'
                ? styles.tabStatusLoading
                : b.status === 'stopped'
                  ? styles.tabStatusStopped
                  : b.status === 'preparing'
                    ? styles.tabStatusPreparing
                    : styles.tabStatusStandby;

            return (
              <Link
                key={b.bayId}
                to={`/bay/${b.bayId}`}
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${b.bayName}, ${b.dockLocation}, ${b.status}`}
              >
                <span className={styles.tabMain}>
                  <span className={`${styles.tabStatusIcon} ${statusClass}`}>
                    {bayStatusIcon(b.status)}
                  </span>
                  <span>{b.bayName}</span>
                </span>
                <span className={styles.tabDock}>{b.dockLocation.replace(/ Dock$/, '')}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Cockpit Monitor & Dock Surveillance Incidents */}
      <div className={styles.bayGridSection}>
        <div>
          <LiveBayMonitor 
            liveBay={currentBay}
            onToggleBelt={() => toggleBayBelt(currentBay.bayId)}
          />
        </div>

        {/* Dedicated Bay Surveillance & Incident Audit */}
        <div className={`card ${styles.incidentsPanel}`}>
          <div className={styles.incidentsHeader}>
            <div>
              <div className={styles.incidentsTitle}>
                <ShieldAlert size={18} color="var(--critical)" />
                <span>{currentBay.bayName} Vision Alerts</span>
              </div>
              <p className={styles.incidentsSubtitle}>
                In-truck <span className="font-mono">cam_in</span> anomalies for {currentBay.truckReg || 'Dock Lane'}
              </p>
            </div>

            <StatusBadge kind={openBayIncidentCount > 0 ? 'open' : 'ok'}>
              {openBayIncidentCount} open
            </StatusBadge>
          </div>

          <div className={styles.incidentList}>
            {bayIncidents.length === 0 && (
              <div className={styles.incidentsEmpty}>
                <ShieldCheck size={20} />
                <span>No AI anomalies recorded for {currentBay.bayName}.</span>
              </div>
            )}
            {bayIncidents.map(item => (
              <div key={item.id} className={styles.incidentItem}>
                <div className={styles.incidentLeft}>
                  <div>
                    <StatusBadge
                      kind={
                        item.severity === 'critical'
                          ? 'critical'
                          : item.severity === 'high'
                            ? 'high'
                            : item.severity === 'medium'
                              ? 'warning'
                              : 'low'
                      }
                    >
                      {item.severity}
                    </StatusBadge>
                  </div>
                  <div>
                    <div className={styles.incidentMetaRow}>
                      <span className={styles.incidentType}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className={styles.incidentTime}>
                        {item.occurred_at}
                      </span>
                    </div>
                    <div className={styles.incidentDetails}>
                      {item.details}
                    </div>
                    {item.barcode_value && (
                      <div className={`font-mono ${styles.incidentBarcode}`}>
                        Box: {item.barcode_value}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.incidentActions}>
                  <StatusBadge kind={item.status}>{item.status}</StatusBadge>
                  <button 
                    onClick={() => setInspectedIncident(item)}
                    className={`btn-action btn-ghost ${styles.actionBtn}`}
                    title="View CCTV camera frame"
                  >
                    <Eye size={12} /> Frame
                  </button>
                  {item.status === 'open' && (
                    <button 
                      onClick={() => {
                        void reviewIncident(item.id).catch(err => {
                          console.error('Failed to review incident:', err);
                        });
                      }}
                      className={`btn-action btn-ghost ${styles.actionBtn} ${styles.actionBtnReview}`}
                      title="Mark as reviewed"
                      aria-label="Mark incident as reviewed"
                    >
                      <CheckCircle2 size={12} />
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};


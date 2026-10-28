import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  ShieldAlert, 
  Eye, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import { 
  useBays, 
  useToggleBayBelt, 
  useIncidents, 
  useSetInspectedIncident,
} from '../store/dashboardStore';
import { reviewIncident } from '../data/actions';
import { LiveBayMonitor } from '../components/LiveBayMonitor';
import styles from './BayCockpitPage.module.css';

export const BayCockpitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const incidents = useIncidents();
  const setInspectedIncident = useSetInspectedIncident();

  const parsedId = Number(id) || 1;
  const currentBay = bays.find(b => b.bayId === parsedId) || bays[0];

  // Incidents relevant to this dock or general AI alerts
  const bayIncidents = incidents.filter(i => {
    if (parsedId === 1) {
      // Bay 1 has truck UP58AT9207 and recent barcodes
      return true;
    }
    return i.status === 'open';
  });

  return (
    <div className={styles.container}>
      
      {/* 1. Bay Switcher Tabs Header */}
      <div className={`glass-card ${styles.bayNavCard}`}>
        <div className={styles.tabsGroup}>
          <span className={styles.tabLabel}>
            <SlidersHorizontal size={15} color="#38bdf8" />
            DOCK SELECTION:
          </span>

          {bays.map(b => {
            const isActive = b.bayId === currentBay.bayId;
            return (
              <Link
                key={b.bayId}
                to={`/bay/${b.bayId}`}
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              >
                <span className={`pulse-dot ${b.status === 'loading' ? 'online' : b.status === 'stopped' ? 'warning' : ''}`} style={{ width: '6px', height: '6px' }}></span>
                <span>{b.bayName}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                  ({b.dockLocation})
                </span>
              </Link>
            );
          })}
        </div>

        <button 
          onClick={() => navigate('/wall')}
          className="btn-action btn-ghost"
          style={{ fontSize: '0.78rem' }}
          title="Return to multi-bay fleet view"
        >
          <ArrowLeft size={14} />
          <span>Full Fleet Wall</span>
        </button>
      </div>

      {/* 2. Cockpit Monitor & Dock Surveillance Incidents */}
      <div className={styles.bayGridSection}>
        <div>
          <LiveBayMonitor 
            liveBay={currentBay}
            onToggleBelt={() => toggleBayBelt(currentBay.bayId)}
            onBackToAllBays={() => navigate('/wall')}
          />
        </div>

        {/* Dedicated Bay Surveillance & Incident Audit */}
        <div className={`glass-card ${styles.incidentsPanel}`}>
          <div className={styles.incidentsHeader}>
            <div>
              <div className={styles.incidentsTitle}>
                <ShieldAlert size={18} color="#f43f5e" />
                <span>{currentBay.bayName} Computer Vision Alerts</span>
              </div>
              <p className={styles.incidentsSubtitle}>
                In-truck camera stream (`cam_in`) anomalies for {currentBay.truckReg || 'Dock Lane'}
              </p>
            </div>

            <span className="badge badge-rose">
              {bayIncidents.filter(i => i.status === 'open').length} Open
            </span>
          </div>

          <div className={styles.incidentList}>
            {bayIncidents.map(item => (
              <div key={item.id} className={styles.incidentItem}>
                <div className={styles.incidentLeft}>
                  <div>
                    {item.severity === 'critical' || item.severity === 'high' ? (
                      <span className="badge badge-rose">
                        {item.severity === 'critical' ? 'CRIT' : 'HIGH'}
                      </span>
                    ) : item.severity === 'medium' ? (
                      <span className="badge badge-amber">MED</span>
                    ) : (
                      <span className="badge badge-slate">LOW</span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                <div style={{ display: 'flex', gap: '6px' }}>
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
                      className={`btn-action btn-ghost ${styles.actionBtn}`}
                      style={{ color: '#34d399' }}
                      title="Mark as reviewed"
                    >
                      <CheckCircle2 size={12} />
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


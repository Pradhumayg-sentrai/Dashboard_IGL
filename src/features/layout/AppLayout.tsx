import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar';
import { BottomNav } from '../navigation/BottomNav';
import { IncidentModal } from '../../components/IncidentModal';
import { 
  useIncidents,
  useInspectedIncident, 
  useSetInspectedIncident, 
} from '../../store/dashboardStore';
import { reviewIncident, dismissIncident } from '../../data/actions';
import { useSimulationTicker } from '../../store/useSimulationTicker';
import styles from './AppLayout.module.css';

export const AppLayout: React.FC = () => {
  // Global simulation ticker running in background
  useSimulationTicker();

  const location = useLocation();
  const incidents = useIncidents();
  const inspectedIncident = useInspectedIncident();
  const setInspectedIncident = useSetInspectedIncident();
  const isOperatorView =
    location.pathname === '/wall' || location.pathname.startsWith('/bay/');

  return (
    <div className={styles.layoutContainer}>
      {/* 1. Persistent Top Navigation Header */}
      <Navbar />

      {/* 2. Routed Page Body */}
      <main id="main-content" className={styles.content}>
        <Outlet />
      </main>

      {/* 3. Global CCTV Incident Evidence Modal */}
      <IncidentModal 
        incident={inspectedIncident}
        incidents={incidents}
        operatorMode={isOperatorView}
        onClose={() => setInspectedIncident(null)}
        onNavigate={setInspectedIncident}
        onReview={async (id, notes) => {
          await reviewIncident(id, { notes });
        }}
        onDismiss={async (id, reason, notes) => {
          await dismissIncident(id, { reason, notes });
        }}
      />

      {/* 4. Global Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerBrand}>India Glycols Limited • Loading Bay Dashboard</p>
        <p className={styles.poweredBy}>
          Powered by <strong>SentrAI</strong>
        </p>
      </footer>

      {/* 5. Mobile-friendly Bottom Navigation (< 768px) */}
      <BottomNav />
    </div>
  );
};


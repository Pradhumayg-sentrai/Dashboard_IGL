import React from 'react';
import { Outlet } from 'react-router-dom';
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

  const incidents = useIncidents();
  const inspectedIncident = useInspectedIncident();
  const setInspectedIncident = useSetInspectedIncident();

  return (
    <div className={styles.layoutContainer}>
      {/* 1. Persistent Top Navigation Header */}
      <Navbar />

      {/* 2. Routed Page Body */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* 3. Global CCTV Incident Evidence Modal */}
      <IncidentModal 
        incident={inspectedIncident}
        incidents={incidents}
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
        <p>India Glycols Limited (IGL) • Multi-Bay Automated Truck Dispatch & AI Vision Surveillance System</p>
        <p className={styles.footerMeta}>
          Active Bays: 4 • Assigned Supervisors: 4 • Live Connection: SQLite WAL <span className="font-mono">app.db</span> • Redis 6379 • Android ADB 5037
        </p>
      </footer>

      {/* 5. Mobile-friendly Bottom Navigation (< 768px) */}
      <BottomNav />
    </div>
  );
};


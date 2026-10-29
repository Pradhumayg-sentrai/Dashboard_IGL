import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CircleHelp,
  Clock,
  Download,
  LayoutDashboard,
  Pause,
  Play,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import {
  useTimeframe,
  useSetTimeframe,
  useIsSimulating,
  useToggleSimulation,
  useBays,
  useDashboardStore,
} from '../../store/dashboardStore';
import { exportDispatchReportCSV } from '../../utils/exportReport';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const timeframe = useTimeframe();
  const setTimeframe = useSetTimeframe();
  const isSimulating = useIsSimulating();
  const toggleSimulation = useToggleSimulation();
  const bays = useBays();
  const getKpis = useDashboardStore(s => s.getKpis);

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isReports = location.pathname === '/plant' || location.pathname === '/excise';
  const isBay = location.pathname.startsWith('/bay/');

  const handleExport = () => {
    exportDispatchReportCSV(bays, getKpis());
  };

  return (
    <header className={`card ${styles.navHeader}`}>
      <div className={styles.topRow}>
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <Truck size={20} color="var(--on-accent)" />
          </div>
          <div>
            <h1 className={styles.brandTitle}>IGL Loading Bays</h1>
            <p className={styles.brandSubtitle}>India Glycols Limited • Gorakhpur</p>
          </div>
        </div>

        <nav className={styles.routeLinks} aria-label="Main Navigation">
          <NavLink
            to="/wall"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/bay/1"
            className={`${styles.navLink} ${isBay ? styles.navLinkActive : ''}`}
            aria-current={isBay ? 'page' : undefined}
          >
            <SlidersHorizontal size={16} />
            <span>Bays</span>
          </NavLink>
          <NavLink
            to="/plant"
            className={`${styles.navLink} ${isReports ? styles.navLinkActive : ''}`}
            aria-current={isReports ? 'page' : undefined}
          >
            <BarChart3 size={16} />
            <span>Reports</span>
          </NavLink>
          <NavLink
            to="/help"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <CircleHelp size={16} />
            <span>Help</span>
          </NavLink>
        </nav>

        <div className={styles.controlsGroup}>
          {isReports && (
            <>
              <button
                onClick={toggleSimulation}
                className={`btn-action btn-ghost ${styles.simBtn} ${isSimulating ? styles.simBtnActive : ''}`}
                title="Pause or resume the screen updates"
                aria-label="Pause or resume screen updates"
              >
                {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                <span>{isSimulating ? 'Pause updates' : 'Resume updates'}</span>
              </button>

              <button
                onClick={handleExport}
                className={`btn-action btn-primary ${styles.exportBtn}`}
                title="Download the plant report"
                aria-label="Download plant report"
              >
                <Download size={14} />
                <span>Download report</span>
              </button>
            </>
          )}

          <ConnectionStatus />

          <div className={styles.timeBadge}>
            <Clock size={13} color="var(--accent)" />
            <span className={`font-mono ${styles.timeVal}`}>{currentTime}</span>
          </div>
        </div>
      </div>

      {isReports && (
        <div className={styles.contextualRow}>
          <div className={styles.timeframeTabs}>
            <button
              className={`btn-tab ${timeframe === 'realtime' ? 'active' : ''}`}
              onClick={() => setTimeframe('realtime')}
            >
              Live
            </button>
            <button
              className={`btn-tab ${timeframe === 'daily' ? 'active' : ''}`}
              onClick={() => setTimeframe('daily')}
            >
              Today
            </button>
            <button
              className={`btn-tab ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              This month
            </button>
            <button
              className={`btn-tab ${timeframe === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeframe('yearly')}
            >
              This year
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

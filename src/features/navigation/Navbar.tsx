import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Truck,
  Factory,
  SlidersHorizontal,
  ShieldCheck,
  Activity,
  Calendar,
  BarChart3,
  TrendingUp,
  Play,
  Pause,
  Clock,
  Download,
  UserCheck
} from 'lucide-react';
import {
  useTimeframe,
  useSetTimeframe,
  useIsSimulating,
  useToggleSimulation,
  useBays,
  useDashboardStore
} from '../../store/dashboardStore';
import { exportDispatchReportCSV } from '../../utils/exportReport';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { ThemeToggle } from '../../components/ThemeToggle';
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
    second: '2-digit'
  });

  const isPlant = location.pathname === '/plant';
  const isBay = location.pathname.startsWith('/bay/');

  const handleExport = () => {
    exportDispatchReportCSV(bays, getKpis());
  };

  return (
    <header className={`card ${styles.navHeader}`}>
      <div className={styles.topRow}>

        {/* Brand & Identity */}
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <Truck size={20} color="var(--on-accent)" />
          </div>
          <div>
            <h1 className={styles.brandTitle}>
              IGL Dispatch & Surveillance
            </h1>
            <p className={styles.brandSubtitle}>
              India Glycols Limited • Gorakhpur
            </p>
          </div>
        </div>

        {/* Primary Role-Based Navigation Links */}
        <nav className={styles.routeLinks} aria-label="Main Navigation">
          <NavLink
            to="/wall"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <Factory size={15} />
            <span>Plant Manager</span>
          </NavLink>
          <NavLink
            to="/plant"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <UserCheck size={15} />
            <span>Supervisor</span>
          </NavLink>
          <NavLink
            to="/bay/1"
            className={`${styles.navLink} ${isBay ? styles.navLinkActive : ''}`}
            aria-current={isBay ? 'page' : undefined}
          >
            <SlidersHorizontal size={15} />
            <span>Bay Cockpit</span>
          </NavLink>
          <NavLink
            to="/excise"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <ShieldCheck size={15} />
            <span>Excise & Audit</span>
          </NavLink>
        </nav>

        {/* Global Controls & Clock */}
        <div className={styles.controlsGroup}>
          <button
            onClick={toggleSimulation}
            className={`btn-action btn-ghost ${styles.simBtn} ${isSimulating ? styles.simBtnActive : ''}`}
            title="Toggle live carton feed simulation ticker"
            aria-label="Toggle live carton feed simulation"
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Simulating' : 'Resume'}</span>
          </button>

          {isPlant && (
            <button
              onClick={handleExport}
              className={`btn-action btn-primary ${styles.exportBtn}`}
              title="Download complete plant dispatch CSV report"
              aria-label="Export plant report CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          <ThemeToggle />

          <ConnectionStatus />

          <div className={styles.timeBadge}>
            <Clock size={13} color="var(--accent)" />
            <span className={`font-mono ${styles.timeVal}`}>{currentTime}</span>
            <span className={styles.timeZone}>IST</span>
          </div>
        </div>

      </div>

      {/* Timeframe selector is the only contextual control; page headers carry the rest */}
      {isPlant && (
        <div className={styles.contextualRow}>
          <div className={styles.timeframeTabs}>
            <button
              className={`btn-tab ${timeframe === 'realtime' ? 'active' : ''}`}
              onClick={() => setTimeframe('realtime')}
            >
              <Activity size={14} />
              Real-Time
            </button>
            <button
              className={`btn-tab ${timeframe === 'daily' ? 'active' : ''}`}
              onClick={() => setTimeframe('daily')}
            >
              <Calendar size={14} />
              Daily
            </button>
            <button
              className={`btn-tab ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              <BarChart3 size={14} />
              Monthly
            </button>
            <button
              className={`btn-tab ${timeframe === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeframe('yearly')}
            >
              <TrendingUp size={14} />
              Yearly
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

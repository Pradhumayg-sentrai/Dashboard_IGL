import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Tv, 
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
  AlertCircle
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

  const activeLoadingCount = bays.filter(b => b.status === 'loading').length;
  const stoppageCount = bays.filter(b => b.status === 'stopped').length;
  const isWall = location.pathname === '/wall';
  const isPlant = location.pathname === '/plant';
  const isBay = location.pathname.startsWith('/bay');
  const isExcise = location.pathname === '/excise';

  const handleExport = () => {
    exportDispatchReportCSV(bays, getKpis());
  };

  return (
    <header className={`glass-card ${styles.navHeader}`}>
      <div className={styles.topRow}>
        
        {/* Brand & Identity */}
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <Truck size={24} color="#ffffff" />
          </div>
          <div>
            <div className={styles.brandTitleRow}>
              <h1 className={styles.brandTitle}>
                IGL Dispatch & Surveillance
              </h1>
              {isWall && (
                <span className="badge badge-rose">
                  <span className="pulse-dot warning"></span>
                  CONTROL ROOM WALL
                </span>
              )}
              {isPlant && (
                <span className="badge badge-emerald">
                  <span className="pulse-dot online"></span>
                  PLANT MANAGER
                </span>
              )}
              {isBay && (
                <span className="badge badge-cyan">
                  <span className="pulse-dot online"></span>
                  BAY COCKPIT
                </span>
              )}
              {isExcise && (
                <span className="badge badge-emerald">
                  <ShieldCheck size={12} />
                  EXCISE COMPLIANCE
                </span>
              )}
            </div>
            <p className={styles.brandSubtitle}>
              India Glycols Limited • Kashipur / Gorakhpur Automated Docks
            </p>
          </div>
        </div>

        {/* Primary Role-Based Navigation Links */}
        <nav className={styles.routeLinks} aria-label="Main Navigation">
          <NavLink 
            to="/wall" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <Tv size={15} />
            <span>Wall Display</span>
          </NavLink>
          <NavLink 
            to="/plant" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <Factory size={15} />
            <span>Plant Manager</span>
          </NavLink>
          <NavLink 
            to="/bay/1" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
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
          {/* Live Simulation Button (available everywhere for interactive demo) */}
          <button 
            onClick={toggleSimulation}
            className={`btn-action btn-ghost ${styles.simBtn} ${isSimulating ? styles.simBtnActive : ''}`}
            title="Toggle live carton feed simulation ticker"
            aria-label="Toggle live carton feed simulation"
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Simulating' : 'Resume'}</span>
          </button>

          {/* Export button visible on Plant and Excise */}
          {(isPlant || isExcise) && (
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

          {/* Connection Status Indicator */}
          <ConnectionStatus />

          {/* Live Time Badge */}
          <div className={styles.timeBadge}>
            <Clock size={14} color="#38bdf8" />
            <span className={`font-mono ${styles.timeVal}`}>{currentTime}</span>
            <span className={styles.timeZone}>IST</span>
          </div>
        </div>

      </div>

      {/* Contextual Sub-bar */}
      <div className={styles.contextualRow}>
        {/* On Plant View: Show Timeframe Selector */}
        {isPlant && (
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
              Daily (Shifts)
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
        )}

        {/* On Bay Cockpit: Bay Switcher Tabs */}
        {isBay && (
          <div className={styles.baySwitcher}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>SELECT BAY:</span>
            {bays.map(b => (
              <NavLink 
                key={b.bayId}
                to={`/bay/${b.bayId}`}
                className={({ isActive }) => `${styles.bayLink} ${isActive ? styles.bayLinkActive : ''}`}
              >
                <span className={`pulse-dot ${b.status === 'loading' ? 'online' : b.status === 'stopped' ? 'warning' : ''}`} style={{ width: '6px', height: '6px' }}></span>
                {b.bayName} ({b.truckReg ? b.truckReg.slice(0, 4) + '..' : 'Idle'})
              </NavLink>
            ))}
          </div>
        )}

        {/* On Wall Display: Control Room Status Summary */}
        {isWall && (
          <div className={styles.wallMetrics}>
            <span>Fleet Status: <strong className={styles.wallHighlightGreen}>{activeLoadingCount} Bays Loading</strong></span>
            {stoppageCount > 0 ? (
              <span>Alarms: <strong className={styles.wallHighlightRed}>{stoppageCount} Bay Stoppage</strong></span>
            ) : (
              <span>Alarms: <strong className={styles.wallHighlightGreen}>Normal Operation</strong></span>
            )}
            <span>Surveillance: <strong style={{ color: '#38bdf8' }}>4 AI Video Streams Online</strong></span>
          </div>
        )}

        {/* On Excise Compliance: Standing Status */}
        {isExcise && (
          <div className={styles.wallMetrics}>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} />
              Zero Penalty Standing
            </span>
            <span>State Portal Bridge: <strong className={styles.wallHighlightGreen}>Connected (ADB Port 5037)</strong></span>
            <span>Alembic Schema: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>head e5a1c7d3b902</span></span>
          </div>
        )}

        {/* Fleet telemetry quick count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {stoppageCount > 0 && (
            <span className="badge badge-rose">
              <AlertCircle size={12} />
              {stoppageCount} Stoppage
            </span>
          )}
          <span>Active Bays: <strong style={{ color: 'var(--text-primary)' }}>{bays.length}</strong></span>
        </div>
      </div>
    </header>
  );
};


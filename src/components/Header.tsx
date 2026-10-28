import React from 'react';
import type { Timeframe, LiveBayState } from '../data/plantData';
import { 
  Activity, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Play, 
  Pause, 
  Clock, 
  ShieldCheck, 
  Truck,
  Layers,
  Download
} from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  selectedBayId: number | 'all';
  setSelectedBayId: (id: number | 'all') => void;
  bays: LiveBayState[];
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeframe,
  setTimeframe,
  isSimulating,
  setIsSimulating,
  selectedBayId,
  setSelectedBayId,
  bays,
  onExportReport,
}) => {
  const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const activeLoadingCount = bays.filter(b => b.status === 'loading').length;
  const stoppageCount = bays.filter(b => b.status === 'stopped').length;
  const totalCasesLoading = bays.reduce((acc, b) => acc + b.loadedQty, 0);
  const totalAllocated = bays.reduce((acc, b) => acc + b.allocatedQty, 0);

  return (
    <header className={`glass-card ${styles.header}`}>
      <div className={styles.topRow}>
        
        {/* Brand & Title */}
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <Truck size={24} color="#ffffff" />
          </div>
          <div>
            <div className={styles.brandTitleRow}>
              <h1 className={styles.brandTitle}>
                IGL Dispatch & Loading Intelligence
              </h1>
              <span className="badge badge-emerald">
                <span className="pulse-dot online"></span>
                PLANT MANAGER VIEW
              </span>
            </div>
            <p className={styles.brandSubtitle}>
              India Glycols Limited • Bottling & Logistics Multi-Bay Command Center
            </p>
          </div>
        </div>

        {/* Timeframe Selector & Simulation Controls */}
        <div className={styles.controlsGroup}>
          
          {/* Timeframe Tabs */}
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

          {/* Live Simulation Trigger (for Demo) */}
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`btn-action btn-ghost ${styles.simBtn} ${isSimulating ? styles.simBtnActive : ''}`}
            title="Toggle live carton feed simulation"
            aria-label="Toggle live carton feed simulation"
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Simulating Feeds' : 'Resume Sim'}</span>
          </button>

          {/* Export Report CSV Button */}
          <button 
            onClick={onExportReport}
            className={`btn-action btn-primary ${styles.exportBtn}`}
            title="Download complete plant dispatch and compliance CSV report"
            aria-label="Export complete plant dispatch and compliance CSV report"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>

          {/* Time & System Badge */}
          <div className={styles.timeBadge}>
            <Clock size={14} color="#38bdf8" />
            <span className={`font-mono ${styles.timeVal}`}>{currentTime}</span>
            <span className={styles.timeZone}>IST</span>
          </div>

        </div>

      </div>

      {/* Bay Selector Row & Fleet Summary */}
      <div className={styles.bottomRow}>
        {/* Bay Selection Buttons */}
        <div className={styles.bayBtnGroup}>
          <span className={styles.bayFocusLabel}>
            <Layers size={13} color="#38bdf8" />
            BAY FOCUS:
          </span>

          <button
            onClick={() => setSelectedBayId('all')}
            className={`${styles.bayBtn} ${selectedBayId === 'all' ? styles.bayBtnActive : ''}`}
          >
            🏢 All Bays (Fleet Grid)
          </button>

          {bays.map(b => (
            <button
              key={b.bayId}
              onClick={() => setSelectedBayId(b.bayId)}
              className={`${styles.bayBtn} ${selectedBayId === b.bayId ? styles.bayBtnActive : ''}`}
            >
              <span className={`pulse-dot ${b.status === 'loading' ? 'online' : b.status === 'stopped' ? 'warning' : ''} ${styles.bayPulseDot}`}></span>
              {b.bayName} ({b.truckReg ? b.truckReg.slice(0, 4) + '..' : 'Idle'})
            </button>
          ))}
        </div>

        {/* Global Plant Metric Summary */}
        <div className={styles.metaSummary}>
          <span>Fleet Loading: <strong className={styles.metaActive}>{activeLoadingCount} Trucks Active</strong></span>
          {stoppageCount > 0 && <span>Alert: <strong className={styles.metaAlert}>{stoppageCount} Bay Stoppage</strong></span>}
          <span>Fleet Total: <strong className={styles.metaTotal}>{totalCasesLoading} / {totalAllocated} cases</strong></span>
          <div className={styles.metaAlembic}>
            <ShieldCheck size={13} color="#34d399" />
            <span>Alembic: <span className="font-mono">head e5a1c7d3b902</span></span>
          </div>
        </div>
      </div>
    </header>
  );
};

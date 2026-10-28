import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBays, useToggleBayBelt, useDashboardStore } from '../store/dashboardStore';
import { KpiScorecard } from '../components/KpiScorecard';
import { MultiBayFleetGrid } from '../components/MultiBayFleetGrid';
import { ActiveAlarmsPanel } from '../features/wall/ActiveAlarmsPanel';
import styles from './WallDisplayPage.module.css';

export const WallDisplayPage: React.FC = () => {
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const getKpis = useDashboardStore(s => s.getKpis);
  const navigate = useNavigate();

  const kpis = getKpis();

  return (
    <div className={styles.wallContainer}>
      
      {/* 1. 4 Key Executive Operational KPIs */}
      <div className={styles.kpiWrapper}>
        <KpiScorecard kpis={kpis} timeframe="realtime" />
      </div>

      {/* 2. 4-Bay Fleet Grid & Real-Time Active Alarms Panel */}
      <div className={styles.wallMainGrid}>
        <div>
          <MultiBayFleetGrid 
            bays={bays}
            selectedBayId="all"
            onSelectBay={(bayId) => {
              if (bayId === 'all') {
                navigate('/wall');
              } else {
                navigate(`/bay/${bayId}`);
              }
            }}
            onToggleBayBelt={toggleBayBelt}
          />
        </div>

        <div>
          <ActiveAlarmsPanel />
        </div>
      </div>

    </div>
  );
};


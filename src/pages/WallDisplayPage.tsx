import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBays, useToggleBayBelt, useDashboardStore } from '../store/dashboardStore';
import { getPlantPulseSamples } from '../data/plantData';
import { KpiScorecard } from '../components/KpiScorecard';
import { MultiBayFleetGrid } from '../components/MultiBayFleetGrid';
import { ActiveAlarmsPanel } from '../features/wall/ActiveAlarmsPanel';
import { PlantPulse } from '../features/wall/PlantPulse';
import styles from './WallDisplayPage.module.css';

export const WallDisplayPage: React.FC = () => {
  const bays = useBays();
  const toggleBayBelt = useToggleBayBelt();
  const getKpis = useDashboardStore(s => s.getKpis);
  const navigate = useNavigate();

  const kpis = getKpis();
  const chartData = useMemo(() => getPlantPulseSamples(), []);

  return (
    <div className={styles.wallContainer}>
      <KpiScorecard kpis={kpis} timeframe="realtime" />

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

      <div className={styles.bottomRow}>
        <PlantPulse bays={bays} chartData={chartData} />
        <ActiveAlarmsPanel />
      </div>
    </div>
  );
};

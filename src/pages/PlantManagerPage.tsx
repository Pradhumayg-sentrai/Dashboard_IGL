import React from 'react';
import { useTimeframe, useDashboardStore, useSetInspectedIncident } from '../store/dashboardStore';
import { initialSupervisors } from '../data/plantData';
import { KpiScorecard } from '../components/KpiScorecard';
import { ThroughputAnalytics } from '../components/ThroughputAnalytics';
import { SupervisorScorecard } from '../components/SupervisorScorecard';
import { CarrierScorecard } from '../components/CarrierScorecard';
import { IncidentsLossPrevention } from '../components/IncidentsLossPrevention';
import styles from './PlantManagerPage.module.css';

export const PlantManagerPage: React.FC = () => {
  const timeframe = useTimeframe();
  const getKpis = useDashboardStore(s => s.getKpis);
  const getChartData = useDashboardStore(s => s.getChartData);
  const setInspectedIncident = useSetInspectedIncident();

  const kpis = getKpis();
  const chartData = getChartData();

  return (
    <div className={styles.container}>

      <KpiScorecard kpis={kpis} timeframe={timeframe} />

      <ThroughputAnalytics chartData={chartData} timeframe={timeframe} />

      {/* Dock supervisors and carrier SLA share a row on desktop */}
      <div className={styles.splitGrid}>
        <SupervisorScorecard supervisors={initialSupervisors} />
        <CarrierScorecard />
      </div>

      <IncidentsLossPrevention onInspectIncident={setInspectedIncident} />

    </div>
  );
};


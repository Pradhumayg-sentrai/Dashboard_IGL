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
      
      {/* 1. Executive Performance Scorecard */}
      <div className={styles.kpiSection}>
        <KpiScorecard kpis={kpis} timeframe={timeframe} />
      </div>

      {/* 2. Throughput Cadence with Draggable Plant Target */}
      <div>
        <ThroughputAnalytics chartData={chartData} timeframe={timeframe} />
      </div>

      {/* 3. Dock Supervisor Shift Accountability */}
      <div>
        <SupervisorScorecard supervisors={initialSupervisors} />
      </div>

      {/* 4. Transporter / Carrier Fleet SLA Scorecard */}
      <div>
        <CarrierScorecard />
      </div>

      {/* 5. AI Incidents, Bulk Review & Removal Audit */}
      <div>
        <IncidentsLossPrevention onInspectIncident={setInspectedIncident} />
      </div>

    </div>
  );
};


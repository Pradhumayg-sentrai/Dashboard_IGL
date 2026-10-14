import React, { useState, useEffect } from 'react';
import type { Timeframe, LiveBayState, IncidentItem } from './data/plantData';
import { 
  getKpisForTimeframe, 
  getChartDataForTimeframe, 
  initialMultiBays,
  initialSupervisors
} from './data/plantData';
import { Header } from './components/Header';
import { KpiScorecard } from './components/KpiScorecard';
import { MultiBayFleetGrid } from './components/MultiBayFleetGrid';
import { LiveBayMonitor } from './components/LiveBayMonitor';
import { ThroughputAnalytics } from './components/ThroughputAnalytics';
import { SupervisorScorecard } from './components/SupervisorScorecard';
import { CarrierScorecard } from './components/CarrierScorecard';
import { ExciseIntelligence } from './components/ExciseIntelligence';
import { IncidentsLossPrevention } from './components/IncidentsLossPrevention';
import { IncidentModal } from './components/IncidentModal';
import { exportDispatchReportCSV } from './utils/exportReport';

export const App: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('realtime');
  const [bays, setBays] = useState<LiveBayState[]>(initialMultiBays);
  const [selectedBayId, setSelectedBayId] = useState<number | 'all'>('all');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [inspectedIncident, setInspectedIncident] = useState<IncidentItem | null>(null);

  // Multi-Bay Simulation Ticker: updates all active loading bays simultaneously!
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setBays(prevBays => 
        prevBays.map(bay => {
          if (bay.status !== 'loading' || bay.beltState !== 'running') {
            return bay;
          }

          if (bay.loadedQty >= bay.allocatedQty) {
            return {
              ...bay,
              status: 'loading',
              beltState: 'paused',
              stopCause: 'Target Quantity Reached - Awaiting Seal'
            };
          }

          const nextCount = bay.loadedQty + 1;
          const randomHex = Math.floor(Math.random() * 900000 + 100000);
          const nextBarcode = `0890801489635500260101102614${randomHex}`;
          const remainingMinutes = +(Math.max(0, (bay.allocatedQty - nextCount) / bay.paceCpm)).toFixed(1);

          return {
            ...bay,
            loadedQty: nextCount,
            lastScannedBarcode: nextBarcode,
            estimatedRemainingMinutes: remainingMinutes
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Toggle belt on a specific bay
  const handleToggleBayBelt = (bayId: number) => {
    setBays(prev => prev.map(b => {
      if (b.bayId !== bayId) return b;
      const isRunning = b.beltState === 'running';
      return {
        ...b,
        beltState: isRunning ? 'paused' : 'running',
        status: isRunning ? 'stopped' : 'loading',
        stopCause: isRunning ? 'Manual Supervisor Pause' : null,
        paceCpm: isRunning ? 0 : b.bayId === 1 ? 19.2 : 21.4
      };
    }));
  };

  const currentKpis = getKpisForTimeframe(timeframe);
  const currentChartData = getChartDataForTimeframe(timeframe);

  // Determine focused bay if selected
  const focusedBay = selectedBayId !== 'all' ? bays.find(b => b.bayId === selectedBayId) || bays[0] : null;

  return (
    <div className="dashboard-container">
      
      {/* 1. Header with Timeframe, Bay Selector & CSV Export */}
      <Header 
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        selectedBayId={selectedBayId}
        setSelectedBayId={setSelectedBayId}
        bays={bays}
        onExportReport={() => exportDispatchReportCSV(bays, currentKpis)}
      />

      {/* 2. Executive KPI Scorecard */}
      <KpiScorecard 
        kpis={currentKpis} 
        timeframe={timeframe} 
      />

      {/* 3. Multi-Bay Fleet Overview (All Bays Concurrent View) */}
      <MultiBayFleetGrid 
        bays={bays}
        selectedBayId={selectedBayId}
        onSelectBay={setSelectedBayId}
        onToggleBayBelt={handleToggleBayBelt}
      />

      {/* 4. Single Bay Drill-Down Cockpit (Shown when a specific bay is focused) */}
      {focusedBay && (
        <div style={{ marginBottom: '24px' }}>
          <LiveBayMonitor 
            liveBay={focusedBay} 
            onToggleBelt={() => handleToggleBayBelt(focusedBay.bayId)} 
            onBackToAllBays={() => setSelectedBayId('all')}
          />
        </div>
      )}

      {/* 5. Throughput Analytics with Movable Target Quota Line */}
      <div className="full-width-card">
        <ThroughputAnalytics 
          chartData={currentChartData} 
          timeframe={timeframe} 
        />
      </div>

      {/* 6. Supervisor Shift Accountability Scorecard */}
      <div className="full-width-card">
        <SupervisorScorecard 
          supervisors={initialSupervisors} 
        />
      </div>

      {/* 7. Carrier & Transporter SLA Performance */}
      <div className="full-width-card">
        <CarrierScorecard />
      </div>

      {/* 8. Excise Intelligence & Loss Prevention Incidents */}
      <div className="analytics-grid">
        <ExciseIntelligence />
        <IncidentsLossPrevention 
          onInspectIncident={(item) => setInspectedIncident(item)}
        />
      </div>

      {/* 9. CCTV Incident Evidence Preview Modal */}
      <IncidentModal 
        incident={inspectedIncident}
        onClose={() => setInspectedIncident(null)}
        onMarkReviewed={() => setInspectedIncident(null)}
      />

      {/* Footer / System Meta */}
      <footer style={{ 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)', 
        borderTop: '1px solid var(--border-subtle)', 
        paddingTop: '20px',
        marginTop: '10px'
      }}>
        <p>India Glycols Limited (IGL) • Multi-Bay Automated Truck Dispatch & AI Vision Surveillance System</p>
        <p style={{ marginTop: '4px', opacity: 0.7 }}>
          Active Bays: 4 • Assigned Supervisors: 4 • Live Connection: SQLite WAL <span className="font-mono">app.db</span> • Redis 6379 • Android ADB 5037
        </p>
      </footer>

    </div>
  );
};

export default App;

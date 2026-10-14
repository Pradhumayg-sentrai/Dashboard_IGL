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
    <header className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Truck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                IGL Dispatch & Loading Intelligence
              </h1>
              <span className="badge badge-emerald">
                <span className="pulse-dot online"></span>
                PLANT MANAGER VIEW
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              India Glycols Limited • Bottling & Logistics Multi-Bay Command Center
            </p>
          </div>
        </div>

        {/* Timeframe Selector & Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Timeframe Tabs */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(0, 0, 0, 0.35)', 
            padding: '4px', 
            borderRadius: '10px', 
            border: '1px solid var(--border-subtle)' 
          }}>
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
            className="btn-action btn-ghost"
            style={{ 
              color: isSimulating ? '#34d399' : 'var(--text-secondary)',
              borderColor: isSimulating ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'
            }}
            title="Toggle live carton feed simulation"
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Simulating Feeds' : 'Resume Sim'}</span>
          </button>

          {/* Export Report CSV Button */}
          <button 
            onClick={onExportReport}
            className="btn-action btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            title="Download complete plant dispatch and compliance CSV report"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>

          {/* Time & System Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 12px', 
            background: 'rgba(255, 255, 255, 0.04)', 
            borderRadius: '8px', 
            fontSize: '0.8rem', 
            color: 'var(--text-secondary)'
          }}>
            <Clock size={14} color="#38bdf8" />
            <span className="font-mono" style={{ color: '#f8fafc', fontWeight: 600 }}>{currentTime}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>IST</span>
          </div>

        </div>

      </div>

      {/* Bay Selector Row & Fleet Summary */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderTop: '1px solid var(--border-subtle)', 
        marginTop: '14px', 
        paddingTop: '12px', 
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Bay Selection Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={13} color="#38bdf8" />
            BAY FOCUS:
          </span>

          <button
            onClick={() => setSelectedBayId('all')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedBayId === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedBayId === 'all' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.3)',
              color: selectedBayId === 'all' ? '#38bdf8' : 'var(--text-secondary)'
            }}
          >
            🏢 All Bays (Fleet Grid)
          </button>

          {bays.map(b => (
            <button
              key={b.bayId}
              onClick={() => setSelectedBayId(b.bayId)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: selectedBayId === b.bayId ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedBayId === b.bayId ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.2)',
                color: selectedBayId === b.bayId ? '#38bdf8' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span className={`pulse-dot ${b.status === 'loading' ? 'online' : b.status === 'stopped' ? 'warning' : ''}`} style={{ width: '5px', height: '5px' }}></span>
              {b.bayName} ({b.truckReg ? b.truckReg.slice(0, 4) + '..' : 'Idle'})
            </button>
          ))}
        </div>

        {/* Global Plant Metric Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Fleet Loading: <strong style={{ color: '#34d399' }}>{activeLoadingCount} Trucks Active</strong></span>
          {stoppageCount > 0 && <span>Alert: <strong style={{ color: '#fb7185' }}>{stoppageCount} Bay Stoppage</strong></span>}
          <span>Fleet Total: <strong style={{ color: '#f8fafc' }}>{totalCasesLoading} / {totalAllocated} cases</strong></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} color="#34d399" />
            <span>Alembic: <span className="font-mono">head e5a1c7d3b902</span></span>
          </div>
        </div>
      </div>
    </header>
  );
};

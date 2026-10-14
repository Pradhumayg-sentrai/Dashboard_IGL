import React from 'react';
import type { KPIStats, Timeframe } from '../data/plantData';
import { PackageCheck, Truck, Timer, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiScorecardProps {
  kpis: KPIStats;
  timeframe: Timeframe;
}

export const KpiScorecard: React.FC<KpiScorecardProps> = ({ kpis, timeframe }) => {
  const percentAchieved = Math.min(100, (kpis.totalDispatched / kpis.dispatchTarget) * 100);
  const tatDifference = (kpis.avgTatMinutes - kpis.tatBenchmarkMinutes).toFixed(1);
  const isTatFaster = Number(tatDifference) <= 0;

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'realtime': return 'Current Session';
      case 'daily': return "Today's Target";
      case 'monthly': return "October Quota";
      case 'yearly': return 'Annual Target';
    }
  };

  return (
    <div className="kpi-grid">
      
      {/* 1. Total Cartons Dispatched */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Total Cartons Dispatched
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                {kpis.totalDispatched.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                / {kpis.dispatchTarget.toLocaleString()}
              </span>
            </div>
          </div>
          <div style={{ 
            padding: '10px', 
            borderRadius: '12px', 
            background: 'rgba(56, 189, 248, 0.12)', 
            color: '#38bdf8' 
          }}>
            <PackageCheck size={22} />
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
          <div style={{ 
            width: `${percentAchieved}%`, 
            height: '100%', 
            background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
            borderRadius: '3px',
            transition: 'width 0.4s ease'
          }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{getTimeframeLabel()}</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{percentAchieved.toFixed(1)}% achieved</span>
        </div>
      </div>

      {/* 2. Trucks Cleared & Sealed */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Trucks Cleared & Sealed
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                {kpis.trucksCleared.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                / {kpis.trucksTarget.toLocaleString()} scheduled
              </span>
            </div>
          </div>
          <div style={{ 
            padding: '10px', 
            borderRadius: '12px', 
            background: 'rgba(16, 185, 129, 0.12)', 
            color: '#34d399' 
          }}>
            <Truck size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
          <span className="badge badge-emerald">
            1 Active at Bay 1
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Zero queue congestion
          </span>
        </div>
      </div>

      {/* 3. Average Turnaround Time (TAT) */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Avg. Turnaround Time (TAT)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                {kpis.avgTatMinutes}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>mins / truck</span>
            </div>
          </div>
          <div style={{ 
            padding: '10px', 
            borderRadius: '12px', 
            background: 'rgba(245, 158, 11, 0.12)', 
            color: '#fbbf24' 
          }}>
            <Timer size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.78rem' }}>
          {isTatFaster ? (
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <ArrowDownRight size={14} /> {Math.abs(Number(tatDifference))}m faster
            </span>
          ) : (
            <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <ArrowUpRight size={14} /> {tatDifference}m slower
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>vs 40 min SLA benchmark</span>
        </div>
      </div>

      {/* 4. Excise Clearance Rate */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              First-Pass Excise Clearance
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                {kpis.clearanceRate}%
              </span>
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                High Compliance
              </span>
            </div>
          </div>
          <div style={{ 
            padding: '10px', 
            borderRadius: '12px', 
            background: 'rgba(139, 92, 246, 0.12)', 
            color: '#a78bfa' 
          }}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Refusals: <strong style={{ color: kpis.refusalCount > 0 ? '#fb7185' : '#34d399' }}>{kpis.refusalCount} cases</strong>
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            Portal SLA 0.22s
          </span>
        </div>
      </div>

    </div>
  );
};

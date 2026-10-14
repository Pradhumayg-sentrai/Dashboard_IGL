import React from 'react';
import type { LiveBayState } from '../data/plantData';
import { 
  Truck, 
  UserCheck, 
  Clock, 
  ExternalLink,
  Phone,
  SlidersHorizontal
} from 'lucide-react';

interface MultiBayFleetGridProps {
  bays: LiveBayState[];
  selectedBayId: number | 'all';
  onSelectBay: (bayId: number | 'all') => void;
  onToggleBayBelt: (bayId: number) => void;
}

export const MultiBayFleetGrid: React.FC<MultiBayFleetGridProps> = ({
  bays,
  selectedBayId,
  onSelectBay,
}) => {
  const activeCount = bays.filter(b => b.status === 'loading').length;
  const stoppedCount = bays.filter(b => b.status === 'stopped').length;
  const preparingCount = bays.filter(b => b.status === 'preparing').length;
  const totalFleetPace = bays.reduce((acc, b) => acc + (b.beltState === 'running' ? b.paceCpm : 0), 0);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Top Banner with Fleet Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Multi-Bay Concurrent Fleet Operations
            </h2>
            <span className="badge badge-cyan">
              4 CONCURRENT BAYS
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Live status of physical loading bays, active vehicles, and on-duty dock supervisors
          </p>
        </div>

        {/* Fleet Metrics Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-emerald" style={{ padding: '5px 12px' }}>
            <span className="pulse-dot online"></span>
            {activeCount} Loading
          </span>
          {stoppedCount > 0 && (
            <span className="badge badge-rose" style={{ padding: '5px 12px' }}>
              <span className="pulse-dot warning"></span>
              {stoppedCount} Stoppage
            </span>
          )}
          <span className="badge badge-slate" style={{ padding: '5px 12px' }}>
            {preparingCount} Staging
          </span>
          <div style={{ 
            background: 'rgba(56, 189, 248, 0.1)', 
            border: '1px solid rgba(56, 189, 248, 0.25)', 
            padding: '4px 12px', 
            borderRadius: '8px', 
            fontSize: '0.78rem',
            color: '#38bdf8',
            fontWeight: 600
          }}>
            Combined Pace: <strong style={{ color: '#fff' }}>{totalFleetPace.toFixed(1)} c/min</strong> ({(totalFleetPace * 60).toLocaleString()} / hr)
          </div>
        </div>
      </div>

      {/* 4 Concurrent Bays Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '18px' 
      }}>
        {bays.map(bay => {
          const isSelected = selectedBayId === bay.bayId;
          const pct = Math.min(100, (bay.loadedQty / bay.allocatedQty) * 100);

          return (
            <div 
              key={bay.bayId}
              style={{
                background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0, 0, 0, 0.35)',
                border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 20px -3px rgba(56, 189, 248, 0.25)' : 'none'
              }}
            >
              {/* Bay Name & Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                      {bay.bayName}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      • {bay.dockLocation}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {bay.status === 'loading' && 'Active Conveyor & POS Bridge'}
                    {bay.status === 'stopped' && <strong style={{ color: '#fb7185' }}>{bay.stopCause}</strong>}
                    {bay.status === 'preparing' && 'Handset Syncing Pass'}
                    {bay.status === 'standby' && 'Awaiting Dispatch Slip'}
                  </div>
                </div>

                <div>
                  {bay.status === 'loading' && (
                    <span className="badge badge-emerald">
                      <span className="pulse-dot online"></span>
                      LOADING
                    </span>
                  )}
                  {bay.status === 'stopped' && (
                    <span className="badge badge-rose">
                      <span className="pulse-dot warning"></span>
                      STOPPED
                    </span>
                  )}
                  {bay.status === 'preparing' && (
                    <span className="badge badge-cyan">
                      PREPARING
                    </span>
                  )}
                  {bay.status === 'standby' && (
                    <span className="badge badge-slate">
                      STANDBY
                    </span>
                  )}
                </div>
              </div>

              {/* Target Vehicle & Slip */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vehicle</div>
                    <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {bay.truckReg || 'No Vehicle'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pace</div>
                  <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: bay.paceCpm > 0 ? '#34d399' : '#94a3b8' }}>
                    {bay.paceCpm > 0 ? `${bay.paceCpm} c/min` : '0 c/min'}
                  </div>
                </div>
              </div>

              {/* Loading Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Progress: <strong style={{ color: '#fff' }}>{bay.loadedQty} / {bay.allocatedQty} cases</strong>
                  </span>
                  <span className="font-mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${pct}%`, 
                    height: '100%', 
                    background: bay.status === 'stopped' ? '#f43f5e' : 'linear-gradient(90deg, #0284c7, #34d399)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
                {bay.status === 'loading' && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    <span>~{bay.estimatedRemainingMinutes} mins remaining to seal</span>
                  </div>
                )}
              </div>

              {/* Assigned Supervisor Pill */}
              <div style={{ 
                borderTop: '1px solid var(--border-subtle)', 
                paddingTop: '10px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: bay.supervisor.avatarColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {bay.supervisor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={12} color="#34d399" />
                      {bay.supervisor.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      ID: {bay.supervisor.employeeId} • <span style={{ color: '#38bdf8' }}><Phone size={10} style={{ display: 'inline' }} /> {bay.supervisor.phoneExt}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onSelectBay(bay.bayId)}
                  className="btn-action btn-ghost"
                  style={{ 
                    fontSize: '0.72rem', 
                    padding: '4px 10px', 
                    color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                    borderColor: isSelected ? '#38bdf8' : 'var(--border-subtle)'
                  }}
                >
                  <ExternalLink size={12} />
                  {isSelected ? 'Focused' : 'Inspect'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

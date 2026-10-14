import React from 'react';
import type { LiveBayState } from '../data/plantData';
import { hardwareDevices } from '../data/plantData';
import { 
  Truck, 
  Barcode, 
  Gauge, 
  Radio, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle,
  Clock,
  Cpu,
  Video,
  Smartphone,
  Printer,
  UserCheck,
  Phone,
  ArrowLeft
} from 'lucide-react';

interface LiveBayMonitorProps {
  liveBay: LiveBayState;
  onToggleBelt: () => void;
  onBackToAllBays?: () => void;
}

export const LiveBayMonitor: React.FC<LiveBayMonitorProps> = ({ 
  liveBay, 
  onToggleBelt,
  onBackToAllBays
}) => {
  const percentComplete = Math.min(100, (liveBay.loadedQty / liveBay.allocatedQty) * 100);

  const getDeviceIcon = (id: string) => {
    switch (id) {
      case 'mvid01': return <Barcode size={16} />;
      case 'cpplus01': return <Video size={16} />;
      case 'posHandset': return <Smartphone size={16} />;
      case 'zebraPrinter': return <Printer size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackToAllBays && (
              <button 
                onClick={onBackToAllBays}
                className="btn-action btn-ghost"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Back to fleet view"
              >
                <ArrowLeft size={13} />
                <span>All Bays</span>
              </button>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              {liveBay.bayName} ({liveBay.dockLocation})
            </h2>
            <span className={`badge ${liveBay.status === 'loading' ? 'badge-emerald' : liveBay.status === 'stopped' ? 'badge-rose' : 'badge-cyan'}`}>
              <span className={`pulse-dot ${liveBay.status === 'loading' ? 'online' : liveBay.status === 'stopped' ? 'warning' : ''}`}></span>
              {liveBay.status.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Conveyor Lane {liveBay.bayId} • Connected to Hikrobot Reader & Android POS Handset
          </p>
        </div>

        {/* Vehicle Badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: 'rgba(0, 0, 0, 0.4)', 
          padding: '6px 14px', 
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Truck size={18} color="#38bdf8" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Vehicle</div>
            <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              {liveBay.truckReg || 'No Vehicle'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Progress Display */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.25)', 
        padding: '18px', 
        borderRadius: '14px', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Loading Progress</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-mono" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>
                {liveBay.loadedQty}
              </span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                / {liveBay.allocatedQty} cases
              </span>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: liveBay.status === 'stopped' ? '#fb7185' : '#34d399' }}>
              {percentComplete.toFixed(1)}%
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <Clock size={12} />
              <span>Est. ~{liveBay.estimatedRemainingMinutes} mins remaining</span>
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div style={{ 
          width: '100%', 
          height: '12px', 
          background: 'rgba(255, 255, 255, 0.08)', 
          borderRadius: '6px', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{ 
            width: `${percentComplete}%`, 
            height: '100%', 
            background: liveBay.status === 'stopped' ? '#f43f5e' : 'linear-gradient(90deg, #0284c7, #06b6d4, #10b981)',
            borderRadius: '6px',
            transition: 'width 0.4s ease'
          }}></div>
        </div>

        {/* Live Loading Telemetry Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gauge size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Current Pace: <strong style={{ color: '#f8fafc' }}>{liveBay.paceCpm} cases/min</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Conveyor Belt:</span>
            <button 
              onClick={onToggleBelt}
              className={`badge ${liveBay.beltState === 'running' ? 'badge-emerald' : 'badge-amber'}`}
              style={{ cursor: 'pointer', border: 'none' }}
              title="Click to toggle belt state"
            >
              {liveBay.beltState === 'running' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
              <span>{liveBay.beltState.toUpperCase()}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color={liveBay.gateFlag === 'pass' ? '#34d399' : '#fbbf24'} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Gate: <strong style={{ color: liveBay.gateFlag === 'pass' ? '#34d399' : '#fbbf24' }}>
                {liveBay.gateFlag.toUpperCase()} ({liveBay.gateReason.toUpperCase()})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Supervisor on Duty & Transport Pass Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
        
        {/* Supervisor Card */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          padding: '12px 14px', 
          borderRadius: '10px', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '10px', 
            background: liveBay.supervisor.avatarColor, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#fff'
          }}>
            {liveBay.supervisor.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={12} color="#34d399" />
              Assigned Supervisor
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
              {liveBay.supervisor.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              ID: {liveBay.supervisor.employeeId} • <span style={{ color: '#38bdf8' }}><Phone size={10} style={{ display: 'inline' }} /> {liveBay.supervisor.phoneExt}</span>
            </div>
          </div>
        </div>

        {/* Latest Decoded Barcode */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          padding: '12px 14px', 
          borderRadius: '10px', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Barcode size={14} color="#34d399" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Latest Decoded Carton</span>
          </div>
          <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399', wordBreak: 'break-all' }}>
            {liveBay.lastScannedBarcode}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '4px' }}>
            {liveBay.indentNo.slice(0, 28)}...
          </div>
        </div>

      </div>

      {/* Hardware Telemetry Bar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Radio size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {liveBay.bayName} Hardware Status & Device Diagnostics
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {hardwareDevices.map(device => (
            <div 
              key={device.id} 
              style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{ color: '#38bdf8' }}>
                {getDeviceIcon(device.id)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {device.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="pulse-dot online" style={{ width: '6px', height: '6px' }}></span>
                  {device.latencyMs}ms lag
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

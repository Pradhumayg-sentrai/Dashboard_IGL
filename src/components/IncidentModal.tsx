import React from 'react';
import type { IncidentItem } from '../data/plantData';
import { 
  X, 
  ShieldAlert, 
  Barcode, 
  CheckCircle2, 
  Cpu, 
  Activity
} from 'lucide-react';

interface IncidentModalProps {
  incident: IncidentItem | null;
  onClose: () => void;
  onMarkReviewed: (id: number) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  incident,
  onClose,
  onMarkReviewed,
}) => {
  if (!incident) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div 
        className="glass-card" 
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#0f172a',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(244, 63, 94, 0.2)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185'
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', textTransform: 'capitalize' }}>
                Incident #{incident.id}: {incident.type.replace('_', ' ')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Occurred: {incident.occurred_at} • Camera: CPPLUS-01 (Inward Truck CCTV)
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-action btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Simulated CCTV Evidence Frame */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '220px',
            background: '#090d16',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Camera Overlay Graphics */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Grid / perspective truck outline */}
              <polygon points="40,20 600,20 540,200 100,200" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="40" y1="20" x2="100" y2="200" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
              <line x1="600" y1="20" x2="540" y2="200" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
              
              {/* Stack zone outline */}
              <rect x="180" y="50" width="280" height="110" fill="rgba(16, 185, 129, 0.05)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="190" y="70" fill="#34d399" fontSize="10" fontFamily="var(--font-mono)">ZONE: STACK_AREA</text>

              {/* Bounding box around anomaly */}
              <rect x="290" y="85" width="75" height="55" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2" />
              <text x="290" y="80" fill="#fb7185" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                {incident.type.toUpperCase()} [0.92]
              </text>
            </svg>

            {/* OSD Timestamp watermark */}
            <div style={{ position: 'absolute', top: '12px', left: '16px', fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
              REC • BAY 1 CAM_IN (DA51PL3C-L-Y) • 25 FPS
            </div>
            <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
              {incident.occurred_at} UTC
            </div>
          </div>

          {/* AI Detection Telemetry */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} color="#fb7185" />
                Detection Severity
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: incident.severity === 'high' ? '#fb7185' : '#fbbf24', marginTop: '2px', textTransform: 'uppercase' }}>
                {incident.severity}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Barcode size={12} color="#38bdf8" />
                Associated Barcode
              </div>
              <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                {incident.barcode_value || 'No Scanned Barcode'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={12} color="#34d399" />
                Lane Process ID
              </div>
              <div className="font-mono" style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                lane_run_01_a9f2
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Physical Evidence & Signature
            </span>
            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', marginTop: '4px', lineHeight: 1.5 }}>
              {incident.details}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Status: <strong style={{ color: incident.status === 'open' ? '#fbbf24' : '#34d399' }}>{incident.status.toUpperCase()}</strong>
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={onClose}
              className="btn-action btn-ghost"
            >
              Close
            </button>
            {incident.status === 'open' && (
              <button 
                onClick={() => {
                  onMarkReviewed(incident.id);
                  onClose();
                }}
                className="btn-action btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <CheckCircle2 size={14} />
                Acknowledge & Mark Reviewed
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

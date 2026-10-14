import React from 'react';
import type { SupervisorInfo } from '../data/plantData';
import { 
  Users, 
  ShieldCheck, 
  Award, 
  Phone, 
  Clock, 
  Gauge, 
  AlertTriangle 
} from 'lucide-react';

interface SupervisorScorecardProps {
  supervisors: SupervisorInfo[];
}

export const SupervisorScorecard: React.FC<SupervisorScorecardProps> = ({ supervisors }) => {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Supervisor Shift Accountability Scorecard
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Assigned dock officers on duty for Shift B (14:00 - 22:00) with loading speed & compliance KPIs
          </p>
        </div>

        <span className="badge badge-emerald">
          <ShieldCheck size={13} />
          ALL SUPERVISORS CERTIFIED
        </span>
      </div>

      {/* Supervisors Table / Card List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {supervisors.map((sup, idx) => (
          <div 
            key={sup.userId}
            style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '12px', 
              padding: '16px', 
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Top Row: Avatar, Name, Employee ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: sup.avatarColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: `0 0 12px ${sup.avatarColor}55`
                }}>
                  {sup.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                    {sup.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ID: <strong style={{ color: '#cbd5e1' }}>{sup.employeeId}</strong> • Assigned: <strong style={{ color: '#38bdf8' }}>Bay {idx + 1}</strong>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(16, 185, 129, 0.12)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                padding: '3px 8px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                color: '#34d399',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Award size={12} />
                {sup.rating}%
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '8px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '10px 8px', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Gauge size={11} /> Speed
                </div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {sup.paceCpm} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>cpm</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Clock size={11} /> Avg TAT
                </div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {sup.avgTatMinutes}m
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <AlertTriangle size={11} /> Removals
                </div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: sup.removalsCount > 0 ? '#fbbf24' : '#34d399', marginTop: '2px' }}>
                  {sup.removalsCount}
                </div>
              </div>
            </div>

            {/* Contact / Intercom bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>{sup.shift}</span>
              <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={11} /> Intercom {sup.phoneExt}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

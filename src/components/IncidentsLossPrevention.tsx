import React, { useState } from 'react';
import type { IncidentItem } from '../data/plantData';
import { sampleIncidents, sampleRemovals } from '../data/plantData';
import { AlertTriangle, ShieldAlert, KeyRound, Eye, CheckCircle2, Lock } from 'lucide-react';

interface IncidentsLossPreventionProps {
  onInspectIncident: (item: IncidentItem) => void;
}

export const IncidentsLossPrevention: React.FC<IncidentsLossPreventionProps> = ({ onInspectIncident }) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'removals'>('incidents');
  const [incidents, setIncidents] = useState<IncidentItem[]>(sampleIncidents);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredIncidents = incidents.filter(item => {
    if (filterSeverity === 'all') return true;
    return item.severity === filterSeverity;
  });

  const handleReview = (id: number) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'reviewed' } : inc));
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="#f43f5e" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Quality, Damage & Loss Prevention Telemetry
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Real-time computer vision incidents (cam_in inside truck) & cryptographic removal audits
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.35)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button 
            className={`btn-tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={14} />
            AI Incidents ({incidents.filter(i => i.status === 'open').length} Open)
          </button>
          <button 
            className={`btn-tab ${activeTab === 'removals' ? 'active' : ''}`}
            onClick={() => setActiveTab('removals')}
          >
            <Lock size={14} />
            Removal Audit ({sampleRemovals.length})
          </button>
        </div>
      </div>

      {/* Incidents View */}
      {activeTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Severity Filter:</span>
            {['all', 'high', 'medium', 'low'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  border: filterSeverity === sev ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: filterSeverity === sev ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: filterSeverity === sev ? '#38bdf8' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Incidents Table / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
            {filteredIncidents.map(item => (
              <div 
                key={item.id} 
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {item.severity === 'high' ? (
                      <span className="badge badge-rose">HIGH</span>
                    ) : item.severity === 'medium' ? (
                      <span className="badge badge-amber">MED</span>
                    ) : (
                      <span className="badge badge-slate">LOW</span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                        {item.type.replace('_', ' ')}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.occurred_at}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                      {item.details}
                    </p>
                    {item.barcode_value && (
                      <div className="font-mono" style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>
                        Carton: {item.barcode_value}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => onInspectIncident(item)}
                    className="btn-action btn-ghost"
                    style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#f8fafc', background: 'rgba(255, 255, 255, 0.08)' }}
                    title="View CCTV camera frame & bounding box"
                  >
                    <Eye size={12} color="#38bdf8" /> Frame Preview
                  </button>
                  {item.status === 'open' ? (
                    <button 
                      onClick={() => handleReview(item.id)}
                      className="btn-action btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#38bdf8' }}
                    >
                      <CheckCircle2 size={12} /> Mark Reviewed
                    </button>
                  ) : (
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                      <CheckCircle2 size={12} /> Reviewed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Carton Removal Security Audit View */}
      {activeTab === 'removals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Every carton removed from an active truck is cryptographically logged via supervisor step-up credentials.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sampleRemovals.map(rem => (
              <div 
                key={rem.id}
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  padding: '14px 16px', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-rose" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <KeyRound size={12} />
                      AUTHORIZED REMOVAL #{rem.id}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rem.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#f8fafc', marginTop: '6px' }}>
                    Reason: <em>"{rem.reason}"</em>
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>
                    Barcode: {rem.barcode_value} • Truck: {rem.truck_reg}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Authorized by: <strong style={{ color: '#fff' }}>{rem.authorizer}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Employee ID: {rem.employee_id} (Kiosk PIN Step-up)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

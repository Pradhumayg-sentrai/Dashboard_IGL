import React from 'react';
import { gateDiversionReasons } from '../data/plantData';
import { ShieldCheck, AlertOctagon, RotateCcw, Archive, CheckCircle2 } from 'lucide-react';

export const ExciseIntelligence: React.FC = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Excise Portal & Gate Diversion Intelligence
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Real-time validation feedback from state Excise app via Android POS bridge
          </p>
        </div>

        <span className="badge badge-emerald">
          <CheckCircle2 size={12} />
          ZERO PENALTY STANDING
        </span>
      </div>

      {/* Diversion Reason Pareto List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>DIVERSION REASON CAUSE</span>
          <span>CASES / SHARE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {gateDiversionReasons.map(item => (
            <div key={item.code} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{item.reason}</span>
                <span className="font-mono" style={{ color: item.color, fontWeight: 600 }}>
                  {item.count} cases ({item.percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${item.percentage}%`, 
                  height: '100%', 
                  background: item.color,
                  borderRadius: '3px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chute Action Handling Distribution */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.25)', 
        padding: '14px 16px', 
        borderRadius: '12px', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Chute Operator Resolution Actions
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={16} color="#38bdf8" />
            <div>
              <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>64%</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Returned to Belt</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={16} color="#fbbf24" />
            <div>
              <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>28%</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Excise Cell Held</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} color="#fb7185" />
            <div>
              <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>8%</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Defective Repack</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

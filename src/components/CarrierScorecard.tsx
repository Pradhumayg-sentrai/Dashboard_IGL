import React from 'react';
import { Truck, Award } from 'lucide-react';

export interface CarrierItem {
  id: string;
  name: string;
  trucksDispatched: number;
  avgTatMinutes: number;
  onTimeSlaPercentage: number;
  casesCarried: number;
  status: 'preferred' | 'standard' | 'review';
}

export const sampleCarriers: CarrierItem[] = [
  {
    id: 'c1',
    name: 'Gora Logistics (Fleet Alpha)',
    trucksDispatched: 11,
    avgTatMinutes: 32.4,
    onTimeSlaPercentage: 99.2,
    casesCarried: 6200,
    status: 'preferred',
  },
  {
    id: 'c2',
    name: 'VRL Road Cargo Lines',
    trucksDispatched: 8,
    avgTatMinutes: 34.8,
    onTimeSlaPercentage: 98.4,
    casesCarried: 4800,
    status: 'preferred',
  },
  {
    id: 'c3',
    name: 'TCI Freight Logistics',
    trucksDispatched: 6,
    avgTatMinutes: 38.6,
    onTimeSlaPercentage: 95.8,
    casesCarried: 3400,
    status: 'standard',
  },
  {
    id: 'c4',
    name: 'Shree Transways Bulk Transport',
    trucksDispatched: 4,
    avgTatMinutes: 43.1,
    onTimeSlaPercentage: 92.0,
    casesCarried: 2150,
    status: 'review',
  },
];

export const CarrierScorecard: React.FC = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Transporter & Carrier Fleet SLA Scorecard
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Turnaround duration and on-time staging performance by third-party transport agencies
          </p>
        </div>

        <span className="badge badge-cyan">
          4 REGISTERED TRANSPORTERS
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>CARRIER / TRANSPORTER</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>TRUCKS LOADED</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>CASES DISPATCHED</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>AVG. TAT</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>ON-TIME SLA</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>TIER</th>
            </tr>
          </thead>
          <tbody>
            {sampleCarriers.map(carrier => (
              <tr 
                key={carrier.id} 
                style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  transition: 'background 0.2s ease'
                }}
              >
                <td style={{ padding: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  {carrier.name}
                </td>
                <td className="font-mono" style={{ padding: '12px', color: '#cbd5e1' }}>
                  {carrier.trucksDispatched} vehicles
                </td>
                <td className="font-mono" style={{ padding: '12px', color: '#38bdf8' }}>
                  {carrier.casesCarried.toLocaleString()} cases
                </td>
                <td className="font-mono" style={{ padding: '12px', color: carrier.avgTatMinutes <= 35 ? '#34d399' : '#fbbf24' }}>
                  {carrier.avgTatMinutes}m
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${carrier.onTimeSlaPercentage}%`, 
                        height: '100%', 
                        background: carrier.onTimeSlaPercentage > 95 ? '#10b981' : '#f59e0b',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      {carrier.onTimeSlaPercentage}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {carrier.status === 'preferred' && (
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      <Award size={11} /> PREFERRED
                    </span>
                  )}
                  {carrier.status === 'standard' && (
                    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      STANDARD
                    </span>
                  )}
                  {carrier.status === 'review' && (
                    <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                      SLA DELAY
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

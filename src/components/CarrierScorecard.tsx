import React from 'react';
import { Truck, Award, Loader2, AlertTriangle, Inbox } from 'lucide-react';
import styles from './CarrierScorecard.module.css';

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

interface CarrierScorecardProps {
  carriers?: CarrierItem[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const CarrierScorecard: React.FC<CarrierScorecardProps> = ({
  carriers = sampleCarriers,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load transporter performance records'
}) => {
  return (
    <div className={`glass-card ${styles.card}`}>
      
      {/* Title */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleGroup}>
            <Truck size={20} color="#38bdf8" />
            <h3 className={styles.title}>
              Transporter & Carrier Fleet SLA Scorecard
            </h3>
          </div>
          <p className={styles.subtitle}>
            Turnaround duration and on-time staging performance by third-party transport agencies
          </p>
        </div>

        <span className="badge badge-cyan">
          {carriers.length} REGISTERED TRANSPORTERS
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>CARRIER / TRANSPORTER</th>
              <th className={styles.th}>TRUCKS LOADED</th>
              <th className={styles.th}>CASES DISPATCHED</th>
              <th className={styles.th}>AVG. TAT</th>
              <th className={styles.th}>ON-TIME SLA</th>
              <th className={`${styles.th} ${styles.thRight}`}>TIER</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className={styles.tableStateCell}>
                  <div className={styles.stateBox}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Loading transporter SLA records...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && isError && (
              <tr>
                <td colSpan={6} className={styles.tableStateCell}>
                  <div className={styles.stateBox} style={{ color: '#fb7185' }}>
                    <AlertTriangle size={24} />
                    <span>{errorMessage}</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !isError && carriers.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.tableStateCell}>
                  <div className={styles.stateBox}>
                    <Inbox size={24} />
                    <span>No carriers registered in this fleet manifest</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !isError && carriers.map(carrier => (
              <tr 
                key={carrier.id} 
                className={styles.tr}
              >
                <td className={`${styles.td} ${styles.carrierName}`}>
                  {carrier.name}
                </td>
                <td className={`${styles.td} font-mono ${styles.vehiclesVal}`}>
                  {carrier.trucksDispatched} vehicles
                </td>
                <td className={`${styles.td} font-mono ${styles.casesVal}`}>
                  {carrier.casesCarried.toLocaleString()} cases
                </td>
                <td className={`${styles.td} font-mono ${carrier.avgTatMinutes <= 35 ? styles.tatFast : styles.tatSlow}`}>
                  {carrier.avgTatMinutes}m
                </td>
                <td className={styles.td}>
                  <div className={styles.slaBox}>
                    <div className={styles.slaTrack}>
                      <div 
                        className={`${styles.slaFill} ${carrier.onTimeSlaPercentage > 95 ? styles.slaFillHigh : ''}`}
                        style={{ width: `${carrier.onTimeSlaPercentage}%` }}
                      ></div>
                    </div>
                    <span className={`font-mono ${styles.slaText}`}>
                      {carrier.onTimeSlaPercentage}%
                    </span>
                  </div>
                </td>
                <td className={`${styles.td} ${styles.tierCell}`}>
                  {carrier.status === 'preferred' && (
                    <span className={`badge badge-emerald ${styles.tierBadge}`}>
                      <Award size={11} /> PREFERRED
                    </span>
                  )}
                  {carrier.status === 'standard' && (
                    <span className={`badge badge-slate ${styles.tierBadge}`}>
                      STANDARD
                    </span>
                  )}
                  {carrier.status === 'review' && (
                    <span className={`badge badge-amber ${styles.tierBadge}`}>
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

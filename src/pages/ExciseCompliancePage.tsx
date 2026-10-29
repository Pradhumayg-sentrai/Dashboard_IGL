import React from 'react';
import { 
  KeyRound, 
  Download, 
  FileCheck2, 
  Radio 
} from 'lucide-react';
import { useBays, useDashboardStore } from '../store/dashboardStore';
import { sampleRemovals } from '../data/plantData';
import { exportDispatchReportCSV } from '../utils/exportReport';
import { ExciseIntelligence } from '../components/ExciseIntelligence';
import { StatusBadge } from '../components/StatusBadge';
import styles from './ExciseCompliancePage.module.css';

export const ExciseCompliancePage: React.FC = () => {
  const bays = useBays();
  const getKpis = useDashboardStore(s => s.getKpis);
  const kpis = getKpis();

  const handleExport = () => {
    exportDispatchReportCSV(bays, kpis);
  };

  return (
    <div className={styles.container}>
      
      {/* 1. Official Excise Compliance Summary Banner */}
      <div className={`card ${styles.topBanner}`}>
        <div className={styles.bannerLeft}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--ok-bg)',
            border: '1px solid var(--ok-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ok-text)'
          }}>
            <FileCheck2 size={22} />
          </div>
          <div>
            <h2 className={styles.bannerTitle}>
              State Excise Portal & Dispatch Ledger
            </h2>
            <p className={styles.bannerSub}>
              UP State Excise • barcode validation & loss-prevention audit
            </p>
          </div>
        </div>

        <div className={styles.bannerStats}>
          <StatusBadge kind="verified">
            Zero penalty standing
          </StatusBadge>

          <button 
            onClick={handleExport}
            className="btn-action btn-primary"
            style={{ fontSize: '0.82rem' }}
            title="Download complete plant dispatch & excise compliance CSV"
            aria-label="Export complete plant dispatch report CSV"
          >
            <Download size={15} />
            <span>Export Official CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Main Compliance Grid: Excise Gate Intelligence + Cryptographic Removal Audit */}
      <div className={styles.complianceGrid}>
        
        {/* Left: Real-Time Gate Diversion & State Portal Intelligence */}
        <ExciseIntelligence />

        {/* Right: Cryptographic Carton Removal Audit Ledger */}
        <div className={`card ${styles.removalsCard}`}>
          <div className={styles.removalsHeader}>
            <div>
              <div className={styles.removalsTitle}>
                <KeyRound size={18} color="var(--critical)" />
                <span>Carton Removal Security Audit Ledger</span>
              </div>
              <p className={styles.removalsSubtitle}>
                Every manual deduction logged via supervisor biometric / PIN step-up tokens
              </p>
            </div>

            <StatusBadge kind="info" icon={KeyRound}>
              {sampleRemovals.length} authorized
            </StatusBadge>
          </div>

          <div className={styles.removalsList}>
            {sampleRemovals.map(rem => (
              <div key={rem.id} className={styles.removalItem}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge kind="info" icon={KeyRound}>
                      Authorized #{rem.id}
                    </StatusBadge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rem.timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text)', marginTop: '6px' }}>
                    Reason: <em>"{rem.reason}"</em>
                  </div>
                  <div className={`font-mono ${styles.removalMeta}`}>
                    Barcode: {rem.barcode_value} • Vehicle: {rem.truck_reg}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Authorized by: <strong style={{ color: 'var(--text)' }}>{rem.authorizer}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Officer ID: {rem.employee_id} (Kiosk Step-up)
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '12px', 
            borderTop: '1px solid var(--border-subtle)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={12} color="var(--ok)" />
              SQLite WAL <span className="font-mono">app.db</span> (Table: removed_cartons)
            </span>
            <span>Tamper-evident SHA-256</span>
          </div>
        </div>

      </div>

    </div>
  );
};

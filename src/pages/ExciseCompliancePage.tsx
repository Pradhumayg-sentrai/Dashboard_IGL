import React from 'react';
import { Link } from 'react-router-dom';
import { 
  KeyRound, 
  Download, 
  FileCheck2, 
  Radio,
  ArrowLeft
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
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Paperwork &amp; audit</h1>
          <p className={styles.pageSubtitle}>
            Excise portal checks and carton removal records for supervisors and managers.
          </p>
        </div>
        <Link to="/plant" className={styles.backLink}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Reports
        </Link>
      </div>

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
              UP State Excise • barcode checks and loss-prevention records
            </p>
          </div>
        </div>

        <div className={styles.bannerStats}>
          <StatusBadge kind="verified">
            No penalties
          </StatusBadge>

          <button 
            onClick={handleExport}
            className="btn-action btn-primary"
            style={{ fontSize: '0.82rem' }}
            title="Download the plant dispatch and excise report"
            aria-label="Download plant report"
          >
            <Download size={15} />
            <span>Download report</span>
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
                <span>Carton removal records</span>
              </div>
              <p className={styles.removalsSubtitle}>
                Every manual carton removal is approved by a supervisor.
              </p>
            </div>

            <StatusBadge kind="info" icon={KeyRound}>
              {sampleRemovals.length} approved
            </StatusBadge>
          </div>

          <div className={styles.removalsList}>
            {sampleRemovals.map(rem => (
              <div key={rem.id} className={styles.removalItem}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge kind="info" icon={KeyRound}>
                      Approved #{rem.id}
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
            borderTop: '1px solid var(--border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={12} color="var(--ok)" />
              Records are saved automatically
            </span>
            <span>Approved by supervisor</span>
          </div>
        </div>

      </div>

    </div>
  );
};

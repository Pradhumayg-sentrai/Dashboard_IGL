import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  KeyRound, 
  Download, 
  FileCheck2, 
  Radio,
  ArrowLeft,
  Inbox
} from 'lucide-react';
import { useBays, useDashboardStore } from '../store/dashboardStore';
import { sampleRemovals, gateDiversionCases, type GateDiversionCase } from '../data/plantData';
import { exportDispatchReportCSV } from '../utils/exportReport';
import { ExciseIntelligence } from '../components/ExciseIntelligence';
import { ExciseFilterBar, type ExciseTimeframe, type IndentOption } from '../components/ExciseFilterBar';
import { StatusBadge } from '../components/StatusBadge';
import styles from './ExciseCompliancePage.module.css';

const INDENT_OPTIONS: IndentOption[] = [
  { value: 'BOTTELING288987-CLB2-WHOLESALE544831-CL2-GORA-Oct26_00000070', label: 'Indent #00070 (Bay 1 • UP58AT9207)' },
  { value: 'BOTTELINGCLB102-CLB1-WHOLESALE417104-CL2-GORA-Oct26_00000536', label: 'Indent #00536 (Bay 2 • UP16AT5656)' },
  { value: 'BOTTELING341209-CLB2-WHOLESALE512900-CL2-GORA-Oct26_00000088', label: 'Indent #00088 (Bay 3 • HR38AB1234)' },
  { value: 'BOTTELING199823-CLB1-WHOLESALE398101-CL2-GORA-Oct26_00000102', label: 'Indent #00102 (Bay 4 • UP65BT7890)' },
];

export const ExciseCompliancePage: React.FC = () => {
  const bays = useBays();
  const getKpis = useDashboardStore(s => s.getKpis);
  const kpis = getKpis();

  // Filter state
  const [timeframe, setTimeframe] = useState<ExciseTimeframe>('1d');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-29');
  const [selectedIndent, setSelectedIndent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleExport = () => {
    exportDispatchReportCSV(bays, kpis);
  };

  const handleResetFilters = () => {
    setTimeframe('1d');
    setSelectedIndent('all');
    setSearchQuery('');
    setCustomStartDate('2026-10-01');
    setCustomEndDate('2026-10-29');
  };

  const isFiltered = timeframe !== '1d' || selectedIndent !== 'all' || searchQuery.trim() !== '';

  // Date filtering logic relative to reference simulated date (2026-10-29)
  const isDateInTimeframe = useMemo(() => {
    return (dateStr: string): boolean => {
      const datePart = dateStr.slice(0, 10); // YYYY-MM-DD

      switch (timeframe) {
        case '1d':
          // Today (2026-10-29) or within last 24h
          return datePart >= '2026-10-28';
        case '1w':
          // Past 7 days
          return datePart >= '2026-10-22';
        case '15d':
          // Past 15 days
          return datePart >= '2026-10-14';
        case '1m':
          // Past 30 days
          return datePart >= '2026-10-01';
        case 'custom':
          if (!customStartDate && !customEndDate) return true;
          if (customStartDate && datePart < customStartDate) return false;
          if (customEndDate && datePart > customEndDate) return false;
          return true;
        default:
          return true;
      }
    };
  }, [timeframe, customStartDate, customEndDate]);

  // Filter diversion cases
  const filteredDiversionCases = useMemo(() => {
    const result: Record<string, GateDiversionCase[]> = {};
    const q = searchQuery.trim().toLowerCase();

    Object.entries(gateDiversionCases).forEach(([code, cases]) => {
      const matching = cases.filter(c => {
        if (!isDateInTimeframe(c.occurredAt)) return false;
        if (selectedIndent !== 'all' && c.indentNo && c.indentNo !== selectedIndent) return false;
        if (q) {
          const matches =
            c.id.toLowerCase().includes(q) ||
            c.barcode.toLowerCase().includes(q) ||
            c.truckReg.toLowerCase().includes(q) ||
            c.bayName.toLowerCase().includes(q) ||
            c.portalResponse.toLowerCase().includes(q) ||
            c.operator.toLowerCase().includes(q) ||
            (c.indentNo && c.indentNo.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      });
      result[code] = matching;
    });

    return result;
  }, [isDateInTimeframe, selectedIndent, searchQuery]);

  // Filter removal records
  const filteredRemovals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return sampleRemovals.filter(r => {
      if (!isDateInTimeframe(r.timestamp)) return false;
      if (selectedIndent !== 'all' && r.indent_no !== selectedIndent) return false;
      if (q) {
        const matches =
          r.indent_no.toLowerCase().includes(q) ||
          r.barcode_value.toLowerCase().includes(q) ||
          r.truck_reg.toLowerCase().includes(q) ||
          r.authorizer.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.employee_id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [isDateInTimeframe, selectedIndent, searchQuery]);

  const totalResults = useMemo(() => {
    const diversionCount = Object.values(filteredDiversionCases).reduce((sum, list) => sum + list.length, 0);
    return diversionCount + filteredRemovals.length;
  }, [filteredDiversionCases, filteredRemovals]);

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
          <div className={styles.bannerIconBox}>
            <FileCheck2 size={22} />
          </div>
          <div>
            <h2 className={styles.bannerTitle}>
              State Excise Portal &amp; Dispatch Ledger
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
            className={`btn-action btn-primary ${styles.downloadBtn}`}
            title="Download the plant dispatch and excise report"
            aria-label="Download plant report"
          >
            <Download size={15} />
            <span>Download report</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter & Search Bar */}
      <ExciseFilterBar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
        selectedIndent={selectedIndent}
        onIndentChange={setSelectedIndent}
        indentOptions={INDENT_OPTIONS}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        totalResults={totalResults}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
      />

      {/* 3. Main Compliance Grid: Excise Gate Intelligence + Cryptographic Removal Audit */}
      <div className={styles.complianceGrid}>
        
        {/* Left: Real-Time Gate Diversion & State Portal Intelligence */}
        <ExciseIntelligence filteredCases={filteredDiversionCases} />

        {/* Right: Cryptographic Carton Removal Audit Ledger */}
        <div className={`card ${styles.removalsCard}`}>
          <div className={styles.removalsHeader}>
            <div>
              <div className={styles.removalsTitle}>
                <KeyRound size={18} color="var(--critical)" />
                <span>Approved carton removals</span>
              </div>
              <p className={styles.removalsSubtitle}>
                Every manual carton removal is approved by a supervisor.
              </p>
            </div>

            <StatusBadge kind="info" icon={KeyRound}>
              {filteredRemovals.length} approved
            </StatusBadge>
          </div>

          <div className={styles.removalsList}>
            {filteredRemovals.length === 0 ? (
              <div className={styles.removalsEmpty}>
                <Inbox size={24} />
                <span>No carton removals found matching your filter selection.</span>
              </div>
            ) : (
              filteredRemovals.map(rem => (
                <div key={rem.id} className={styles.removalItem}>
                  <div>
                    <div className={styles.removalTopRow}>
                      <StatusBadge kind="info" icon={KeyRound}>
                        Approved #{rem.id}
                      </StatusBadge>
                      <span className={styles.removalTimestamp}>
                        {rem.timestamp}
                      </span>
                    </div>
                    <div className={styles.removalReason}>
                      Reason: <em>"{rem.reason}"</em>
                    </div>
                    <div className={`font-mono ${styles.removalMeta}`}>
                      Barcode: {rem.barcode_value} • Vehicle: {rem.truck_reg}
                    </div>
                  </div>

                  <div className={styles.removalRight}>
                    <div className={styles.removalAuthorizer}>
                      Authorized by: <strong>{rem.authorizer}</strong>
                    </div>
                    <div className={styles.removalEmployee}>
                      Officer ID: {rem.employee_id} (Kiosk Step-up)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.removalsFooter}>
            <span className={styles.autoSaveLabel}>
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

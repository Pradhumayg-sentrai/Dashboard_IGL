import React, { useEffect, useRef, useState } from 'react';
import {
  gateDiversionReasons,
  gateDiversionCases,
  type DiversionResolution,
} from '../data/plantData';
import { 
  ShieldCheck, 
  AlertOctagon, 
  RotateCcw, 
  Archive, 
  Loader2, 
  AlertTriangle,
  Inbox,
  ChevronRight,
  X
} from 'lucide-react';
import { StatusBadge, type StatusKind } from './StatusBadge';
import styles from './ExciseIntelligence.module.css';

interface ExciseIntelligenceProps {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const RESOLUTION_BADGE: Record<DiversionResolution, { kind: StatusKind; label: string }> = {
  returned: { kind: 'info', label: 'Returned to belt' },
  held: { kind: 'warning', label: 'Excise cell held' },
  repack: { kind: 'critical', label: 'Defective repack' },
  override: { kind: 'low', label: 'Supervisor override' },
};

export const ExciseIntelligence: React.FC<ExciseIntelligenceProps> = ({
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to fetch State Excise portal telemetry'
}) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedReason = selectedCode
    ? gateDiversionReasons.find(item => item.code === selectedCode) ?? null
    : null;
  const selectedCases = selectedCode ? gateDiversionCases[selectedCode] ?? [] : [];

  useEffect(() => {
    if (!selectedCode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedCode(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCode]);

  return (
    <div className={`card ${styles.card}`}>
      
      {/* Title */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleGroup}>
            <ShieldCheck size={20} color="var(--ok)" />
            <h3 className={styles.title}>
              Excise Portal & Gate Diversion Intelligence
            </h3>
          </div>
          <p className={styles.subtitle}>
            Real-time validation feedback from state Excise app via Android POS bridge
          </p>
        </div>

        <StatusBadge kind="verified">
          Zero penalty standing
        </StatusBadge>
      </div>

      {/* Body / States */}
      {isLoading && (
        <div className={styles.stateBox}>
          <Loader2 size={24} className={styles.spinner} />
          <span>Synchronizing State Excise POS Handset Gateway...</span>
        </div>
      )}

      {!isLoading && isError && (
        <div className={styles.stateBox} style={{ color: 'var(--critical-text)' }}>
          <AlertTriangle size={24} />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isLoading && !isError && gateDiversionReasons.length === 0 && (
        <div className={styles.stateBox}>
          <Inbox size={24} />
          <span>Zero gate diversion events recorded (100% first-pass pass-through)</span>
        </div>
      )}

      {/* Diversion Reason Pareto List */}
      {!isLoading && !isError && gateDiversionReasons.length > 0 && (
        <>
          <div>
            <div className={styles.paretoHeader}>
              <span>DIVERSION REASON CAUSE</span>
              <span>CASES / SHARE</span>
            </div>

            <div className={styles.paretoList}>
              {gateDiversionReasons.map(item => (
                <button
                  key={item.code}
                  type="button"
                  className={styles.paretoRow}
                  onClick={() => setSelectedCode(item.code)}
                  aria-haspopup="dialog"
                  title={`Inspect recent ${item.reason.toLowerCase()} cases`}
                >
                  <span className={styles.paretoTop}>
                    <span className={styles.reasonText}>{item.reason}</span>
                    <span className={styles.rowRight}>
                      <span className={`font-mono ${styles.countText}`} style={{ color: item.color }}>
                        {item.count} cases ({item.percentage}%)
                      </span>
                      <ChevronRight size={14} className={styles.chevron} aria-hidden="true" />
                    </span>
                  </span>
                  <span className={styles.paretoTrack}>
                    <span 
                      className={styles.paretoFill}
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color,
                      }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chute Action Handling Distribution */}
          <div className={styles.chuteBox}>
            <div className={styles.chuteTitle}>
              Chute Operator Resolution Actions
            </div>
            
            <div className={styles.chuteGrid}>
              
              <div className={styles.chuteAction}>
                <RotateCcw size={16} color="var(--accent)" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>64%</div>
                  <div className={styles.actionDesc}>Returned to Belt</div>
                </div>
              </div>

              <div className={styles.chuteAction}>
                <Archive size={16} color="var(--warn)" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>28%</div>
                  <div className={styles.actionDesc}>Excise Cell Held</div>
                </div>
              </div>

              <div className={styles.chuteAction}>
                <AlertOctagon size={16} color="var(--critical)" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>8%</div>
                  <div className={styles.actionDesc}>Defective Repack</div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {selectedReason && (
        <div
          className={styles.modalBackdrop}
          onClick={event => {
            if (event.target === event.currentTarget) setSelectedCode(null);
          }}
        >
          <div
            className={`card ${styles.modal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="diversion-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitleRow}>
                  <h3 id="diversion-modal-title" className={styles.modalTitle}>
                    {selectedReason.reason}
                  </h3>
                  <StatusBadge kind="info">
                    {selectedReason.count} cases total
                  </StatusBadge>
                </div>
                <p className={styles.modalSubtitle}>
                  {selectedReason.percentage}% of all gate diversions •{' '}
                  {selectedCases.length} recent sample{' '}
                  {selectedCases.length === 1 ? 'record' : 'records'}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className={`btn-action btn-ghost ${styles.modalClose}`}
                onClick={() => setSelectedCode(null)}
                aria-label="Close diversion case records"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {selectedCases.length === 0 ? (
                <div className={styles.stateBox}>
                  <Inbox size={24} />
                  <span>No recent case records for this diversion reason.</span>
                </div>
              ) : (
                <div className={styles.tableScroll}>
                  <table className={styles.caseTable}>
                    <thead>
                      <tr>
                        <th scope="col">Time</th>
                        <th scope="col">Case barcode</th>
                        <th scope="col">Truck / Bay</th>
                        <th scope="col">Portal response</th>
                        <th scope="col">Resolution</th>
                        <th scope="col">Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCases.map(item => {
                        const resolution = RESOLUTION_BADGE[item.resolution];

                        return (
                          <tr key={item.id}>
                            <td className="font-mono">{item.occurredAt}</td>
                            <td className={`font-mono ${styles.barcodeCell}`} title={item.barcode}>
                              {item.barcode}
                            </td>
                            <td>
                              {item.truckReg}
                              <span className={styles.muted}> • {item.bayName}</span>
                            </td>
                            <td className={styles.portalCell}>{item.portalResponse}</td>
                            <td>
                              <StatusBadge kind={resolution.kind}>{resolution.label}</StatusBadge>
                            </td>
                            <td>{item.operator}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <p className={styles.sampleNote}>
                Aggregate counts cover the selected period. This table is a recent sample of
                events behind the {selectedReason.reason.toLowerCase()} total, not the full history.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

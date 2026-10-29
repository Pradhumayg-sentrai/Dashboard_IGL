import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  gateDiversionCases,
  type DiversionResolution,
  type GateDiversionCase,
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
  filteredCases?: Record<string, GateDiversionCase[]>;
  timeframeLabel?: string;
}

const REASON_METADATA: Record<string, { plainName: string; color: string }> = {
  qty_reached: {
    plainName: 'Truck limit reached (Quota full)',
    color: 'var(--chart-2)',
  },
  refused: {
    plainName: 'Transport pass not valid',
    color: 'var(--chart-3)',
  },
  duplicate: {
    plainName: 'Barcode used on another truck',
    color: 'var(--chart-4)',
  },
  not_case_code: {
    plainName: 'Barcode unreadable or damaged',
    color: 'var(--chart-1)',
  },
  supervisor: {
    plainName: 'Supervisor manual override',
    color: 'var(--chart-5)',
  },
};

const RESOLUTION_BADGE: Record<DiversionResolution, { kind: StatusKind; label: string }> = {
  returned: { kind: 'info', label: 'Approved & loaded on truck' },
  held: { kind: 'warning', label: 'Held for inspection' },
  repack: { kind: 'critical', label: 'Sent back to repack' },
  override: { kind: 'low', label: 'Supervisor override' },
};

export const ExciseIntelligence: React.FC<ExciseIntelligenceProps> = ({
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to fetch State Excise portal telemetry',
  filteredCases,
}) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeCases = filteredCases ?? gateDiversionCases;

  const reasonsData = useMemo(() => {
    const codes = ['qty_reached', 'refused', 'duplicate', 'not_case_code', 'supervisor'];
    const totalCases = codes.reduce((sum, code) => sum + (activeCases[code]?.length ?? 0), 0);

    return codes.map(code => {
      const casesForCode = activeCases[code] ?? [];
      const count = casesForCode.length;
      const percentage = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
      const meta = REASON_METADATA[code] ?? { plainName: code, color: 'var(--accent)' };

      return {
        code,
        reason: meta.plainName,
        count,
        percentage,
        color: meta.color,
      };
    });
  }, [activeCases]);

  const totalDivertedCount = useMemo(() => {
    return reasonsData.reduce((sum, r) => sum + r.count, 0);
  }, [reasonsData]);

  const chuteStats = useMemo(() => {
    let returned = 0;
    let held = 0;
    let repack = 0;
    let total = 0;

    Object.values(activeCases).forEach(caseList => {
      caseList.forEach(c => {
        total++;
        if (c.resolution === 'returned' || c.resolution === 'override') returned++;
        else if (c.resolution === 'held') held++;
        else if (c.resolution === 'repack') repack++;
      });
    });

    if (total === 0) {
      return { returnedPct: 0, heldPct: 0, repackPct: 0, total: 0 };
    }

    const retPct = Math.round((returned / total) * 100);
    const hldPct = Math.round((held / total) * 100);
    const repPct = total > 0 ? Math.round((repack / total) * 100) : 0;

    return {
      returnedPct: retPct,
      heldPct: hldPct,
      repackPct: repPct,
      total,
    };
  }, [activeCases]);

  const selectedReason = selectedCode
    ? reasonsData.find(item => item.code === selectedCode) ?? null
    : null;
  const selectedCases = selectedCode ? activeCases[selectedCode] ?? [] : [];

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
              State portal checks &amp; diverted cartons
            </h3>
          </div>
          <p className={styles.subtitle}>
            Live checks with the UP Excise portal before cartons load onto trucks.
          </p>
        </div>

        <StatusBadge kind="verified">
          100% Compliant • No penalties
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

      {!isLoading && !isError && totalDivertedCount === 0 && (
        <div className={styles.stateBox}>
          <Inbox size={24} />
          <span>No gate diversions found matching your filter selection.</span>
        </div>
      )}

      {/* Diversion Reason Pareto List */}
      {!isLoading && !isError && totalDivertedCount > 0 && (
        <>
          <div>
            <div className={styles.paretoHeader}>
              <span>Why cartons were stopped</span>
              <span>Cartons / Share</span>
            </div>

            <div className={styles.paretoList}>
              {reasonsData.map(item => (
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
                        {item.count} cartons ({item.percentage}%)
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
              What happened to stopped cartons
            </div>
            
            <div className={styles.chuteGrid}>
              
              <div className={styles.chuteAction}>
                <RotateCcw size={16} color="var(--accent)" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>{chuteStats.returnedPct}%</div>
                  <div className={styles.actionDesc}>Approved &amp; loaded on truck</div>
                </div>
              </div>

              <div className={styles.chuteAction}>
                <Archive size={16} color="var(--warn)" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>{chuteStats.heldPct}%</div>
                  <div className={styles.actionDesc}>Held for inspection</div>
                </div>
              </div>

              <div className={styles.chuteAction}>
                <AlertOctagon size={16} color="var(--critical)" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>{chuteStats.repackPct}%</div>
                  <div className={styles.actionDesc}>Sent back to repack</div>
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
                    {selectedReason.count} cartons
                  </StatusBadge>
                </div>
                <p className={styles.modalSubtitle}>
                  {selectedReason.percentage}% of diverted cartons in this view •{' '}
                  {selectedCases.length} matching{' '}
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
                  <span>No case records match your current filter.</span>
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
                Showing records matching the selected timeframe and search criteria.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { gateDiversionReasons } from '../data/plantData';
import { 
  ShieldCheck, 
  AlertOctagon, 
  RotateCcw, 
  Archive, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  Inbox 
} from 'lucide-react';
import styles from './ExciseIntelligence.module.css';

interface ExciseIntelligenceProps {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const ExciseIntelligence: React.FC<ExciseIntelligenceProps> = ({
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to fetch State Excise portal telemetry'
}) => {
  return (
    <div className={`glass-card ${styles.card}`}>
      
      {/* Title */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleGroup}>
            <ShieldCheck size={20} color="#10b981" />
            <h3 className={styles.title}>
              Excise Portal & Gate Diversion Intelligence
            </h3>
          </div>
          <p className={styles.subtitle}>
            Real-time validation feedback from state Excise app via Android POS bridge
          </p>
        </div>

        <span className="badge badge-emerald">
          <CheckCircle2 size={12} />
          ZERO PENALTY STANDING
        </span>
      </div>

      {/* Body / States */}
      {isLoading && (
        <div className={styles.stateBox}>
          <Loader2 size={24} className={styles.spinner} />
          <span>Synchronizing State Excise POS Handset Gateway...</span>
        </div>
      )}

      {!isLoading && isError && (
        <div className={styles.stateBox} style={{ color: '#fb7185' }}>
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
                <div key={item.code} className={styles.paretoRow}>
                  <div className={styles.paretoTop}>
                    <span className={styles.reasonText}>{item.reason}</span>
                    <span className={`font-mono ${styles.countText}`} style={{ color: item.color }}>
                      {item.count} cases ({item.percentage}%)
                    </span>
                  </div>
                  <div className={styles.paretoTrack}>
                    <div 
                      className={styles.paretoFill}
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                </div>
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
                <RotateCcw size={16} color="#38bdf8" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>64%</div>
                  <div className={styles.actionDesc}>Returned to Belt</div>
                </div>
              </div>

              <div className={styles.chuteAction}>
                <Archive size={16} color="#fbbf24" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>28%</div>
                  <div className={styles.actionDesc}>Excise Cell Held</div>
                </div>
              </div>

              <div className={styles.chuteAction}>
                <AlertOctagon size={16} color="#fb7185" />
                <div>
                  <div className={`font-mono ${styles.actionPct}`}>8%</div>
                  <div className={styles.actionDesc}>Defective Repack</div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
};

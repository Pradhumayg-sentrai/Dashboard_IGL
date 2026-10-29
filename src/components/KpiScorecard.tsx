import React from 'react';
import type { KPIStats, Timeframe } from '../data/plantData';
import { PackageCheck, Truck, Timer, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import styles from './KpiScorecard.module.css';

interface KpiScorecardProps {
  kpis: KPIStats;
  timeframe: Timeframe;
}

export const KpiScorecard: React.FC<KpiScorecardProps> = ({ kpis, timeframe }) => {
  const percentAchieved = Math.min(100, (kpis.totalDispatched / kpis.dispatchTarget) * 100);
  const tatDifference = (kpis.avgTatMinutes - kpis.tatBenchmarkMinutes).toFixed(1);
  const isTatFaster = Number(tatDifference) <= 0;

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'realtime': return 'Current Session';
      case 'daily': return "Today's Target";
      case 'monthly': return "October Quota";
      case 'yearly': return 'Annual Target';
    }
  };

  return (
    <div className="kpi-grid">
      
      {/* 1. Total Cartons Dispatched */}
      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>
              Total Cartons Dispatched
            </span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>
                {kpis.totalDispatched.toLocaleString()}
              </span>
              <span className={styles.metricSub}>
                / {kpis.dispatchTarget.toLocaleString()}
              </span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxCyan}`}>
            <PackageCheck size={22} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressFill}
            style={{ width: `${percentAchieved}%` }}
          ></div>
        </div>

        <div className={styles.progressFooter}>
          <span>{getTimeframeLabel()}</span>
          <span className={styles.attainmentAchieved}>{percentAchieved.toFixed(1)}% achieved</span>
        </div>
      </div>

      {/* 2. Trucks Cleared & Sealed */}
      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>
              Trucks Cleared & Sealed
            </span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>
                {kpis.trucksCleared.toLocaleString()}
              </span>
              <span className={styles.metricSub}>
                / {kpis.trucksTarget.toLocaleString()} scheduled
              </span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxEmerald}`}>
            <Truck size={22} />
          </div>
        </div>
      </div>

      {/* 3. Average Turnaround Time (TAT) */}
      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>
              Avg. Turnaround Time (TAT)
            </span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>
                {kpis.avgTatMinutes}
              </span>
              <span className={styles.metricSubMins}>mins / truck</span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxAmber}`}>
            <Timer size={22} />
          </div>
        </div>

        <div className={styles.tatRow}>
          {isTatFaster ? (
            <span className={styles.tatFaster}>
              <ArrowDownRight size={14} /> {Math.abs(Number(tatDifference))}m faster
            </span>
          ) : (
            <span className={styles.tatSlower}>
              <ArrowUpRight size={14} /> {tatDifference}m slower
            </span>
          )}
          <span className={styles.cardFooterText}>vs 40 min SLA benchmark</span>
        </div>
      </div>

      {/* 4. Excise Clearance Rate */}
      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>
              First-Pass Excise Clearance
            </span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>
                {kpis.clearanceRate}%
              </span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxViolet}`}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className={styles.cardFooterBetween}>
          <span className={styles.cardFooterText}>
            Refusals: <strong className={kpis.refusalCount > 0 ? styles.refusalAlert : styles.refusalNormal}>{kpis.refusalCount} cases</strong>
          </span>
          <StatusBadge kind="info" className={styles.slaBadge}>
            Portal SLA 0.22s
          </StatusBadge>
        </div>
      </div>

    </div>
  );
};

import React from 'react';
import type { KPIStats, Timeframe } from '../data/plantData';
import { ArrowDownRight, ArrowUpRight, PackageCheck, Timer, Truck } from 'lucide-react';
import styles from './KpiScorecard.module.css';

interface KpiScorecardProps {
  kpis: KPIStats;
  timeframe: Timeframe;
}

export const KpiScorecard: React.FC<KpiScorecardProps> = ({ kpis, timeframe }) => {
  const percentAchieved = Math.min(100, (kpis.totalDispatched / kpis.dispatchTarget) * 100);
  const timeDifference = Number((kpis.avgTatMinutes - kpis.tatBenchmarkMinutes).toFixed(0));
  const isFaster = timeDifference <= 0;

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'realtime':
        return 'Current session';
      case 'daily':
        return "Today's target";
      case 'monthly':
        return 'This month';
      case 'yearly':
        return 'This year';
    }
  };

  return (
    <div className="kpi-grid">
      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>Trucks loaded</span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>{kpis.trucksCleared.toLocaleString()}</span>
              <span className={styles.metricSub}>of {kpis.trucksTarget.toLocaleString()} planned</span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxEmerald}`}>
            <Truck size={24} aria-hidden="true" />
          </div>
        </div>
        <p className={styles.cardHint}>Trucks finished loading and sealed.</p>
      </div>

      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>Cartons loaded</span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>{kpis.totalDispatched.toLocaleString()}</span>
              <span className={styles.metricSub}>of {kpis.dispatchTarget.toLocaleString()}</span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxCyan}`}>
            <PackageCheck size={24} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percentAchieved}%` }} />
        </div>

        <div className={styles.progressFooter}>
          <span>{getTimeframeLabel()}</span>
          <span className={styles.attainmentAchieved}>{percentAchieved.toFixed(0)}% done</span>
        </div>
      </div>

      <div className={`card kpi ${styles.kpiCard}`}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardLabel}>Average loading time</span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>{kpis.avgTatMinutes}</span>
              <span className={styles.metricSub}>min per truck</span>
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.iconBoxAmber}`}>
            <Timer size={24} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.tatRow}>
          {isFaster ? (
            <span className={styles.tatFaster}>
              <ArrowDownRight size={16} aria-hidden="true" />
              {Math.abs(timeDifference)} min faster
            </span>
          ) : (
            <span className={styles.tatSlower}>
              <ArrowUpRight size={16} aria-hidden="true" />
              {timeDifference} min slower
            </span>
          )}
          <span className={styles.cardFooterText}>Target: {kpis.tatBenchmarkMinutes} min or less</span>
        </div>
      </div>
    </div>
  );
};

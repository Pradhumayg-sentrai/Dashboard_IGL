import React from 'react';
import type { SupervisorInfo } from '../data/plantData';
import { 
  Users, 
  ShieldCheck, 
  Award, 
  Phone, 
  Clock, 
  Gauge, 
  AlertTriangle,
  Loader2,
  Inbox
} from 'lucide-react';
import styles from './SupervisorScorecard.module.css';

interface SupervisorScorecardProps {
  supervisors: SupervisorInfo[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const SupervisorScorecard: React.FC<SupervisorScorecardProps> = ({ 
  supervisors,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load supervisor shift roster',
}) => {
  return (
    <div className={`glass-card ${styles.card}`}>
      
      {/* Title */}
      <div className={styles.titleRow}>
        <div>
          <div className={styles.titleLeft}>
            <Users size={20} color="#38bdf8" />
            <h3 className={styles.title}>
              Supervisor Shift Accountability Scorecard
            </h3>
          </div>
          <p className={styles.subtitle}>
            Assigned dock officers on duty for Shift B (14:00 - 22:00) with loading speed & compliance KPIs
          </p>
        </div>

        <span className="badge badge-emerald">
          <ShieldCheck size={13} />
          ALL SUPERVISORS CERTIFIED
        </span>
      </div>

      {/* Supervisors Table / Card List */}
      <div className={styles.supervisorsGrid}>
        {isLoading && (
          <div className={styles.stateBox}>
            <Loader2 size={24} className={styles.spinner} />
            <span>Loading supervisor roster telemetry...</span>
          </div>
        )}

        {!isLoading && isError && (
          <div className={styles.stateBox} style={{ color: '#fb7185' }}>
            <AlertTriangle size={24} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isLoading && !isError && supervisors.length === 0 && (
          <div className={styles.stateBox}>
            <Inbox size={24} />
            <span>No supervisors assigned to this active shift</span>
          </div>
        )}

        {!isLoading && !isError && supervisors.map((sup, idx) => (
          <div 
            key={sup.userId}
            className={styles.supervisorCard}
          >
            {/* Top Row: Avatar, Name, Employee ID */}
            <div className={styles.cardTop}>
              <div className={styles.supervisorIdentity}>
                <div 
                  className={styles.avatar}
                  style={{ 
                    backgroundColor: sup.avatarColor,
                    boxShadow: `0 0 12px ${sup.avatarColor}55`
                  }}
                >
                  {sup.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className={styles.name}>
                    {sup.name}
                  </div>
                  <div className={styles.idRow}>
                    ID: <strong className={styles.employeeIdStrong}>{sup.employeeId}</strong> • Assigned: <strong className={styles.bayStrong}>Bay {idx + 1}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.ratingPill}>
                <Award size={12} />
                {sup.rating}%
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricBox}>
                <div className={styles.metricLabel}>
                  <Gauge size={11} /> Speed
                </div>
                <div className={`font-mono ${styles.metricValue}`}>
                  {sup.paceCpm} <span className={styles.metricUnit}>cpm</span>
                </div>
              </div>

              <div className={styles.metricBox}>
                <div className={styles.metricLabel}>
                  <Clock size={11} /> Avg TAT
                </div>
                <div className={`font-mono ${styles.metricValue}`}>
                  {sup.avgTatMinutes}m
                </div>
              </div>

              <div className={styles.metricBox}>
                <div className={styles.metricLabel}>
                  <AlertTriangle size={11} /> Removals
                </div>
                <div className={`font-mono ${styles.metricValue} ${sup.removalsCount > 0 ? styles.removalsWarning : styles.removalsNormal}`}>
                  {sup.removalsCount}
                </div>
              </div>
            </div>

            {/* Contact / Intercom bar */}
            <div className={styles.contactBar}>
              <span className={styles.shiftText}>{sup.shift}</span>
              <span className={styles.intercomPill}>
                <Phone size={11} /> Intercom {sup.phoneExt}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

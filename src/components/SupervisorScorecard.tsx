import React, { useState, useMemo } from 'react';
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
import { StatusBadge } from './StatusBadge';
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
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | 'Shift A' | 'Shift B' | 'Shift C'>('all');

  const filteredSupervisors = useMemo(() => {
    if (selectedShiftFilter === 'all') return supervisors;
    return supervisors.filter(sup => sup.shift.startsWith(selectedShiftFilter));
  }, [supervisors, selectedShiftFilter]);

  return (
    <div className={`card ${styles.card}`}>
      
      {/* Title */}
      <div className={styles.titleRow}>
        <div>
          <div className={styles.titleLeft}>
            <Users size={18} color="var(--accent)" />
            <h3 className={styles.title}>
              Supervisor Scorecard
            </h3>
          </div>
          <p className={styles.subtitle}>
            3 daily shifts • 24/7 terminal dispatch operations
          </p>
        </div>

        <StatusBadge kind="verified" icon={ShieldCheck}>
          All supervisors certified
        </StatusBadge>
      </div>

      {/* Daily Shift Filter Pills */}
      <div className={styles.filterBar} role="tablist" aria-label="Filter by daily shift">
        <button
          type="button"
          role="tab"
          aria-selected={selectedShiftFilter === 'all'}
          className={`${styles.filterPill} ${selectedShiftFilter === 'all' ? styles.filterPillActive : ''}`}
          onClick={() => setSelectedShiftFilter('all')}
        >
          All Shifts ({supervisors.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedShiftFilter === 'Shift A'}
          className={`${styles.filterPill} ${selectedShiftFilter === 'Shift A' ? styles.filterPillActive : ''}`}
          onClick={() => setSelectedShiftFilter('Shift A')}
        >
          Shift A (06:00-14:00)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedShiftFilter === 'Shift B'}
          className={`${styles.filterPill} ${selectedShiftFilter === 'Shift B' ? styles.filterPillActive : ''}`}
          onClick={() => setSelectedShiftFilter('Shift B')}
        >
          Shift B (14:00-22:00)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedShiftFilter === 'Shift C'}
          className={`${styles.filterPill} ${selectedShiftFilter === 'Shift C' ? styles.filterPillActive : ''}`}
          onClick={() => setSelectedShiftFilter('Shift C')}
        >
          Shift C (22:00-06:00)
        </button>
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
          <div className={styles.stateBox} style={{ color: 'var(--critical-text)' }}>
            <AlertTriangle size={24} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isLoading && !isError && filteredSupervisors.length === 0 && (
          <div className={styles.stateBox}>
            <Inbox size={24} />
            <span>No supervisors assigned to this active shift</span>
          </div>
        )}

        {!isLoading && !isError && filteredSupervisors.map(sup => (
          <div 
            key={sup.userId}
            className={styles.supervisorCard}
          >
            {/* Top Row: Avatar, Name, Employee ID */}
            <div className={styles.cardTop}>
              <div className={styles.supervisorIdentity}>
                <div 
                  className={styles.avatar}
                  style={{ backgroundColor: sup.avatarColor }}
                >
                  {sup.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className={styles.name}>
                    {sup.name}
                  </div>
                  <div className={styles.idRow}>
                    ID: <strong className={styles.employeeIdStrong}>{sup.employeeId}</strong> •{' '}
                    <span className={styles.shiftTag}>{sup.shift.split(' ')[0]} {sup.shift.split(' ')[1]}</span> • Bays:{' '}
                    <strong className={styles.bayStrong}>{sup.assignedBayIds.join(', ')}</strong>
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

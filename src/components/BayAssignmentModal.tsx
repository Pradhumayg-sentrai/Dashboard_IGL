import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Clock, 
  Users, 
  Truck, 
  Check, 
  FileText, 
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import type { LiveBayState, SupervisorInfo, GateTruckQueueItem } from '../data/plantData';
import { initialSupervisors, gateTruckQueue } from '../data/plantData';
import { useAssignBayTruckAndSupervisor } from '../store/dashboardStore';
import styles from './BayAssignmentModal.module.css';

export interface BayAssignmentModalProps {
  bay: LiveBayState;
  isOpen: boolean;
  onClose: () => void;
}

type ShiftKey = 'Shift A' | 'Shift B' | 'Shift C';

interface ShiftDefinition {
  key: ShiftKey;
  name: string;
  hours: string;
  description: string;
}

const SHIFTS: ShiftDefinition[] = [
  {
    key: 'Shift A',
    name: 'Shift A (Morning)',
    hours: '06:00 – 14:00',
    description: 'First industrial shift',
  },
  {
    key: 'Shift B',
    name: 'Shift B (Evening)',
    hours: '14:00 – 22:00',
    description: 'Peak bottling shift',
  },
  {
    key: 'Shift C',
    name: 'Shift C (Night)',
    hours: '22:00 – 06:00',
    description: 'Overnight freight dispatch',
  },
];

const getCurrentShiftKey = (): ShiftKey => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Shift A';
  if (hour >= 14 && hour < 22) return 'Shift B';
  return 'Shift C';
};

export const BayAssignmentModal: React.FC<BayAssignmentModalProps> = ({
  bay,
  isOpen,
  onClose,
}) => {
  const assignBayTruckAndSupervisor = useAssignBayTruckAndSupervisor();
  const currentActiveShift = useMemo(() => getCurrentShiftKey(), []);

  // Determine initial shift from bay supervisor or active time
  const getInitialShift = (): ShiftKey => {
    if (bay.supervisor.shift.startsWith('Shift A')) return 'Shift A';
    if (bay.supervisor.shift.startsWith('Shift C')) return 'Shift C';
    return 'Shift B';
  };

  const [selectedShift, setSelectedShift] = useState<ShiftKey>(getInitialShift);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorInfo>(bay.supervisor);
  const [truckSource, setTruckSource] = useState<'queue' | 'manual'>('queue');
  const [selectedQueueTruck, setSelectedQueueTruck] = useState<GateTruckQueueItem | null>(() => {
    // Default to first verified truck or first truck
    const verified = gateTruckQueue.find(t => t.status === 'verified');
    return verified || gateTruckQueue[0] || null;
  });

  const [manualTruckReg, setManualTruckReg] = useState(bay.truckReg || '');
  const [manualIndentNo, setManualIndentNo] = useState(bay.indentNo || '');
  const [manualAllocatedQty, setManualAllocatedQty] = useState(bay.allocatedQty || 500);
  const [manualLicenceNo, setManualLicenceNo] = useState(bay.licenceNo || 'LIC/BOTTLING/CLB2/11/2024/462322/26_27');
  const [isSuccess, setIsSuccess] = useState(false);

  // Supervisors for selected shift
  const shiftSupervisors = useMemo(() => {
    return initialSupervisors.filter(sup => sup.shift.startsWith(selectedShift));
  }, [selectedShift]);

  // Ensure supervisor belongs to current shift
  useEffect(() => {
    if (shiftSupervisors.length > 0) {
      const match = shiftSupervisors.find(s => s.userId === selectedSupervisor.userId);
      if (!match) {
        setSelectedSupervisor(shiftSupervisors[0]);
      }
    }
  }, [selectedShift, shiftSupervisors, selectedSupervisor.userId]);

  // Reset state when opening a different bay
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      const initShift = bay.supervisor.shift.startsWith('Shift A')
        ? 'Shift A'
        : bay.supervisor.shift.startsWith('Shift C')
        ? 'Shift C'
        : 'Shift B';
      setSelectedShift(initShift);
      setSelectedSupervisor(bay.supervisor);
      setManualTruckReg(bay.truckReg || '');
      setManualIndentNo(bay.indentNo || '');
      setManualAllocatedQty(bay.allocatedQty || 500);
    }
  }, [isOpen, bay]);

  // Keyboard navigation and backdrop lock
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeTruckReg = truckSource === 'queue' ? (selectedQueueTruck?.truckReg || '') : manualTruckReg.trim();
  const activeIndentNo = truckSource === 'queue' ? (selectedQueueTruck?.indentNo || '') : manualIndentNo.trim();
  const activeQuota = truckSource === 'queue' ? (selectedQueueTruck?.allocatedQty || 500) : manualAllocatedQty;
  const activeLicence = truckSource === 'queue' ? (selectedQueueTruck?.licenceNo || '') : manualLicenceNo.trim();

  const handleConfirm = () => {
    assignBayTruckAndSupervisor(bay.bayId, {
      truckReg: activeTruckReg,
      indentNo: activeIndentNo,
      allocatedQty: activeQuota,
      supervisor: selectedSupervisor,
      licenceNo: activeLicence,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-bay-title"
        onClick={event => event.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitleRow}>
              <CalendarCheck size={20} color="var(--accent)" aria-hidden="true" />
              <h2 id="assign-bay-title" className={styles.title}>
                Assign Bay & Shift Roster
              </h2>
            </div>
            <p className={styles.subtitle}>
              {bay.bayName} · {bay.dockLocation} · Current status: {bay.status}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Section 1: 3 Daily Shifts */}
          <section className={styles.section} aria-labelledby="shift-select-title">
            <div className={styles.sectionHeader}>
              <h3 id="shift-select-title" className={styles.sectionTitle}>
                <Clock size={16} color="var(--accent)" aria-hidden="true" />
                1. Operational Shift (3 Shifts / Day)
              </h3>
            </div>

            <div className={styles.shiftPills} role="radiogroup" aria-label="Select Daily Shift">
              {SHIFTS.map(shift => {
                const isSelected = selectedShift === shift.key;
                const isNow = currentActiveShift === shift.key;

                return (
                  <button
                    key={shift.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.shiftCard} ${isSelected ? styles.shiftCardSelected : ''}`}
                    onClick={() => setSelectedShift(shift.key)}
                  >
                    <div className={styles.shiftNameRow}>
                      <span className={styles.shiftName}>{shift.name}</span>
                      {isNow && <span className={styles.nowBadge}>Active</span>}
                    </div>
                    <span className={styles.shiftHours}>{shift.hours}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Shift Supervisor */}
          <section className={styles.section} aria-labelledby="sup-select-title">
            <div className={styles.sectionHeader}>
              <h3 id="sup-select-title" className={styles.sectionTitle}>
                <Users size={16} color="var(--accent)" aria-hidden="true" />
                2. Supervisor on Duty ({shiftSupervisors.length} in this shift)
              </h3>
            </div>

            <div className={styles.supervisorsGrid} role="radiogroup" aria-label="Select Shift Supervisor">
              {shiftSupervisors.map(sup => {
                const isSelected = selectedSupervisor.userId === sup.userId;

                return (
                  <button
                    key={sup.userId}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.supervisorCard} ${isSelected ? styles.supervisorCardSelected : ''}`}
                    onClick={() => setSelectedSupervisor(sup)}
                  >
                    <div
                      className={styles.supAvatar}
                      style={{ backgroundColor: sup.avatarColor }}
                      aria-hidden="true"
                    >
                      {sup.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div className={styles.supInfo}>
                      <div className={styles.supName}>{sup.name}</div>
                      <div className={styles.supMeta}>
                        <span>{sup.employeeId}</span>
                        <span>·</span>
                        <span>Ext: {sup.phoneExt}</span>
                        <span>·</span>
                        <span>★ {sup.rating}%</span>
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="var(--accent)" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 3: Truck & Indent Allocation */}
          <section className={styles.section} aria-labelledby="truck-select-title">
            <div className={styles.sectionHeader}>
              <h3 id="truck-select-title" className={styles.sectionTitle}>
                <Truck size={16} color="var(--accent)" aria-hidden="true" />
                3. Truck & Quota Allocation
              </h3>

              <div className={styles.modeTabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={truckSource === 'queue'}
                  className={`${styles.modeTab} ${truckSource === 'queue' ? styles.modeTabActive : ''}`}
                  onClick={() => setTruckSource('queue')}
                >
                  From Gate Queue ({gateTruckQueue.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={truckSource === 'manual'}
                  className={`${styles.modeTab} ${truckSource === 'manual' ? styles.modeTabActive : ''}`}
                  onClick={() => setTruckSource('manual')}
                >
                  Direct / Manual Entry
                </button>
              </div>
            </div>

            {truckSource === 'queue' ? (
              <div className={styles.queueList} role="radiogroup" aria-label="Select Truck from Gate Queue">
                {gateTruckQueue.map(t => {
                  const isSelected = selectedQueueTruck?.truckReg === t.truckReg;

                  return (
                    <button
                      key={t.truckReg}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`${styles.queueCard} ${isSelected ? styles.queueCardSelected : ''}`}
                      onClick={() => setSelectedQueueTruck(t)}
                    >
                      <div className={styles.queueTruckCol}>
                        <span className={styles.plateBadge}>{t.truckReg}</span>
                        <span className={styles.driverInfo}>
                          {t.driverName} ({t.driverPhone})
                        </span>
                        <span className={styles.indentSnippet} title={t.indentNo}>
                          Indent: {t.indentNo}
                        </span>
                      </div>

                      <div className={styles.queueMetaCol}>
                        <span className={styles.queueQuota}>{t.allocatedQty} cartons</span>
                        <span className={styles.nowBadge}>{t.status.replace('_', ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.manualForm}>
                <div className={styles.formField}>
                  <label htmlFor="assign-truck-reg" className={styles.formLabel}>
                    Truck Registration Plate
                  </label>
                  <input
                    id="assign-truck-reg"
                    type="text"
                    className={`${styles.formInput} ${styles.formInputMono}`}
                    value={manualTruckReg}
                    onChange={e => setManualTruckReg(e.target.value.toUpperCase())}
                    placeholder="e.g. UP58AT9207"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="assign-quota" className={styles.formLabel}>
                    Allocated Quota (Cartons)
                  </label>
                  <input
                    id="assign-quota"
                    type="number"
                    min="1"
                    max="2000"
                    step="50"
                    className={styles.formInput}
                    value={manualAllocatedQty}
                    onChange={e => setManualAllocatedQty(Number(e.target.value) || 0)}
                  />
                </div>

                <div className={styles.formFieldFull}>
                  <label htmlFor="assign-indent" className={styles.formLabel}>
                    Excise Indent Reference
                  </label>
                  <input
                    id="assign-indent"
                    type="text"
                    className={styles.formInput}
                    value={manualIndentNo}
                    onChange={e => setManualIndentNo(e.target.value)}
                    placeholder="e.g. BOTTELING912384-CLB2-WHOLESALE712001..."
                  />
                </div>

                <div className={styles.formFieldFull}>
                  <label htmlFor="assign-licence" className={styles.formLabel}>
                    Bottling Licence
                  </label>
                  <input
                    id="assign-licence"
                    type="text"
                    className={styles.formInput}
                    value={manualLicenceNo}
                    onChange={e => setManualLicenceNo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Review Summary */}
          <div className={styles.summaryBox}>
            <FileText size={18} className={styles.summaryIcon} aria-hidden="true" />
            <div className={styles.summaryText}>
              Assigning <strong>{bay.bayName}</strong> to truck{' '}
              <strong>{activeTruckReg || '(Unassigned)'}</strong> (
              <strong>{activeQuota} cartons</strong>) under Supervisor{' '}
              <strong>{selectedSupervisor.name}</strong> for{' '}
              <strong>{selectedShift}</strong>.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`btn-action btn-ghost ${styles.cancelBtn}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn-action btn-primary ${styles.confirmBtn}`}
            onClick={handleConfirm}
            disabled={isSuccess || !activeTruckReg}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Assigned!</span>
              </>
            ) : (
              <span>Confirm & Assign</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


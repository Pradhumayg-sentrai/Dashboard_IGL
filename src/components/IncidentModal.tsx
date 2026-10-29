import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IncidentItem, VideoDetection } from '../data/plantData';
import {
  X,
  ShieldAlert,
  Barcode,
  CheckCircle2,
  Cpu,
  Activity,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  XCircle,
  AlertOctagon,
  StickyNote,
  Loader2,
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { StatusBadge } from './StatusBadge';
import styles from './IncidentModal.module.css';

const MOCK_INCIDENT_VIDEO_SRC = `${import.meta.env.BASE_URL}mock-cctv.mp4`;

const SEVERITY_COLORS: Record<IncidentItem['severity'], string> = {
  critical: 'var(--critical)',
  high: 'var(--critical)',
  medium: 'var(--warn)',
  low: 'var(--text-muted)',
};

function formatIncidentType(type: string): string {
  return type.replaceAll('_', ' ');
}

function buildMockDetections(incident: IncidentItem): VideoDetection[] {
  const color = SEVERITY_COLORS[incident.severity];
  const primaryX = 0.3 + (incident.id % 4) * 0.025;

  return [
    {
      id: `incident-${incident.id}-primary`,
      label: formatIncidentType(incident.type).toUpperCase(),
      confidence: 0.92,
      bbox: { x: primaryX, y: 0.26, width: 0.22, height: 0.32 },
      color,
    },
    {
      id: `incident-${incident.id}-carton`,
      label: 'CARTON',
      confidence: 0.87,
      bbox: { x: primaryX + 0.24, y: 0.36, width: 0.18, height: 0.27 },
      color: 'var(--accent)',
    },
    {
      id: `incident-${incident.id}-zone`,
      label: 'STACK ZONE',
      confidence: 1,
      bbox: { x: 0.15, y: 0.18, width: 0.68, height: 0.55 },
      color: 'var(--ok)',
      dashed: true,
    },
  ];
}

interface IncidentModalProps {
  incident: IncidentItem | null;
  incidents?: IncidentItem[];
  onClose: () => void;
  onNavigate?: (incident: IncidentItem) => void;
  onReview: (id: number, notes?: string) => Promise<void> | void;
  onDismiss: (id: number, reason: string, notes?: string) => Promise<void> | void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  incident,
  incidents = [],
  onClose,
  onNavigate,
  onReview,
  onDismiss,
}) => {
  const [notes, setNotes] = useState('');
  const [showDismiss, setShowDismiss] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);

  const orderedIncidents = useMemo(() => {
    const list = [...incidents].sort((a, b) => {
      const byTime = b.occurred_at.localeCompare(a.occurred_at);
      return byTime !== 0 ? byTime : b.id - a.id;
    });

    if (incident && !list.some(item => item.id === incident.id)) {
      list.unshift(incident);
    }

    return list;
  }, [incidents, incident]);

  const currentIndex = incident
    ? orderedIncidents.findIndex(item => item.id === incident.id)
    : -1;
  const canNavigatePrevious = currentIndex > 0;
  const canNavigateNext = currentIndex >= 0 && currentIndex < orderedIncidents.length - 1;

  const detections = useMemo<VideoDetection[]>(
    () => (incident ? buildMockDetections(incident) : []),
    [incident],
  );

  useEffect(() => {
    setNotes(incident?.notes ?? '');
    setShowDismiss(false);
    setDismissReason('');
    setError(null);
    setSuccess(null);
    // Only reset when the inspected incident changes, not when its status patches land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident?.id]);

  useEffect(() => {
    if (incident?.status !== 'open') {
      setShowDismiss(false);
      setDismissReason('');
    }
  }, [incident?.status]);

  const goToOffset = useCallback((offset: number) => {
    if (!onNavigate || currentIndex < 0) return;

    const target = orderedIncidents[currentIndex + offset];
    if (!target) return;

    setShowDismiss(false);
    setDismissReason('');
    setError(null);
    setSuccess(null);
    onNavigate(target);
  }, [onNavigate, currentIndex, orderedIncidents]);

  const handleReview = useCallback(async () => {
    if (!incident || incident.status !== 'open' || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await onReview(incident.id, notes.trim() || undefined);
      setSuccess(`Incident #${incident.id} marked as reviewed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review this incident.');
    } finally {
      setIsSubmitting(false);
    }
  }, [incident, isSubmitting, notes, onReview]);

  const handleDismiss = useCallback(async () => {
    if (!incident || incident.status !== 'open' || isSubmitting) return;

    const reason = dismissReason.trim();
    if (!reason) {
      setError('A dismissal reason is required.');
      reasonRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await onDismiss(incident.id, reason, notes.trim() || undefined);
      setShowDismiss(false);
      setDismissReason('');
      setSuccess(`Incident #${incident.id} dismissed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to dismiss this incident.');
    } finally {
      setIsSubmitting(false);
    }
  }, [incident, isSubmitting, dismissReason, notes, onDismiss]);

  const openDismissPanel = useCallback(() => {
    if (!incident || incident.status !== 'open' || isSubmitting) return;

    setShowDismiss(true);
    setError(null);
    setSuccess(null);
    window.requestAnimationFrame(() => reasonRef.current?.focus());
  }, [incident, isSubmitting]);

  useEffect(() => {
    if (!incident) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (showDismiss) {
          setShowDismiss(false);
          setDismissReason('');
        } else {
          onClose();
        }
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'j':
          event.preventDefault();
          goToOffset(1);
          break;
        case 'k':
          event.preventDefault();
          goToOffset(-1);
          break;
        case 'r':
          if (incident.status === 'open') {
            event.preventDefault();
            void handleReview();
          }
          break;
        case 'd':
          if (incident.status === 'open') {
            event.preventDefault();
            openDismissPanel();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incident, showDismiss, onClose, goToOffset, handleReview, openDismissPanel]);

  if (!incident) return null;

  const positionLabel = currentIndex >= 0
    ? `${currentIndex + 1} / ${orderedIncidents.length}`
    : `#${incident.id}`;

  return (
    <div className={styles.backdrop}>
      <div
        className={`card ${styles.modal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-modal-title"
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.alertIconBox}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 id="incident-modal-title" className={styles.headerTitle}>
                Incident #{incident.id}: {formatIncidentType(incident.type)}
              </h3>
              <span className={styles.headerSubtitle}>
                Occurred: {incident.occurred_at} • {incident.bay_name ?? 'Bay 1'} • Vehicle{' '}
                {incident.truck_reg || 'Unassigned'} • CPPLUS-01 (Inward Truck CCTV)
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.navGroup} aria-label="Incident navigation">
              <button
                type="button"
                onClick={() => goToOffset(-1)}
                disabled={!canNavigatePrevious}
                className={styles.navBtn}
                title="Previous incident (K)"
                aria-label="Previous incident (K)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className={styles.navPosition}>{positionLabel}</span>
              <button
                type="button"
                onClick={() => goToOffset(1)}
                disabled={!canNavigateNext}
                className={styles.navBtn}
                title="Next incident (J)"
                aria-label="Next incident (J)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`btn-action btn-ghost ${styles.closeBtn}`}
              aria-label="Close incident inspection modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.cctvFrame}>
            <VideoPlayer
              src={MOCK_INCIDENT_VIDEO_SRC}
              detections={detections}
              className={styles.videoPlayer}
              ariaLabel={`Camera evidence for incident ${incident.id}`}
            />

            <div className={styles.watermarkTop}>
              REC • BAY {incident.bay_id ?? 1} CAM_IN (DA51PL3C-L-Y) • 25 FPS • MOCK FEED
            </div>
            <div className={styles.watermarkBottom}>{incident.occurred_at} UTC</div>
          </div>

          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryCard}>
              <div className={styles.telemetryLabel}>
                <Activity size={12} color="var(--critical)" />
                Detection Severity
              </div>
              <div className={styles.severityVal}>
                <StatusBadge
                  kind={
                    incident.severity === 'critical' || incident.severity === 'high'
                      ? 'critical'
                      : incident.severity === 'medium'
                        ? 'warning'
                        : 'low'
                  }
                >
                  {incident.severity}
                </StatusBadge>
              </div>
            </div>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryLabel}>
                <Barcode size={12} color="var(--accent)" />
                Associated Barcode
              </div>
              <div className={`font-mono ${styles.barcodeVal}`}>
                {incident.barcode_value || 'No Scanned Barcode'}
              </div>
            </div>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryLabel}>
                <Cpu size={12} color="var(--ok)" />
                Lane / Vehicle
              </div>
              <div className={`font-mono ${styles.processIdVal}`}>
                {incident.bay_name ?? 'Bay 1'} • {incident.truck_reg || 'N/A'}
              </div>
            </div>
          </div>

          <div className={styles.evidenceBox}>
            <span className={styles.evidenceLabel}>Physical Evidence & Signature</span>
            <p className={styles.evidenceText}>{incident.details}</p>
            {incident.dismissal_reason && (
              <p className={styles.dismissedReason}>
                Dismissed: {incident.dismissal_reason}
              </p>
            )}
          </div>

          <div className={styles.notesBox}>
            <label htmlFor="incident-review-notes" className={styles.notesLabel}>
              <StickyNote size={13} />
              Investigation notes
            </label>
            <textarea
              id="incident-review-notes"
              className={styles.notesInput}
              rows={3}
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Add context, witness details, or follow-up actions…"
              disabled={isSubmitting}
            />
            <span className={styles.notesHint}>
              Notes are attached to the audit entry when you review or dismiss this incident.
            </span>
          </div>

          {showDismiss && incident.status === 'open' && (
            <div className={styles.dismissPanel} role="alertdialog" aria-labelledby="dismiss-title">
              <div className={styles.dismissHeader}>
                <AlertOctagon size={15} />
                <strong id="dismiss-title">Dismiss incident #{incident.id}</strong>
              </div>
              <p className={styles.dismissHelp}>
                A reason is required. The dismissal, your identity, and the timestamp are written
                to the audit log.
              </p>
              <textarea
                ref={reasonRef}
                className={styles.dismissReasonInput}
                rows={2}
                value={dismissReason}
                onChange={event => setDismissReason(event.target.value)}
                placeholder="Required: why is this incident being dismissed?"
                disabled={isSubmitting}
                aria-required="true"
              />
              <div className={styles.dismissActions}>
                <button
                  type="button"
                  className="btn-action btn-ghost"
                  onClick={() => {
                    setShowDismiss(false);
                    setDismissReason('');
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-danger ${styles.confirmDismissBtn}`}
                  onClick={() => void handleDismiss()}
                  disabled={!dismissReason.trim() || isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={14} className={styles.spinner} /> : <XCircle size={14} />}
                  {isSubmitting ? 'Saving…' : 'Confirm dismissal'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage} role="alert">
              <AlertOctagon size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage} role="status">
              <CheckCircle2 size={14} />
              {success}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerMeta}>
            <span className={styles.statusLabel}>
              Status:{' '}
              <StatusBadge kind={incident.status}>
                {incident.status}
              </StatusBadge>
            </span>
            <span className={styles.shortcutHint}>
              <Keyboard size={12} />
              J/K navigate • R review • D dismiss • Esc close
            </span>
          </div>

          <div className={styles.actionsRow}>
            <button type="button" onClick={onClose} className="btn-action btn-ghost">
              Close
            </button>

            {incident.status === 'open' && (
              <>
                <button
                  type="button"
                  onClick={openDismissPanel}
                  className={`btn-action btn-ghost ${styles.dismissBtn}`}
                  disabled={isSubmitting}
                >
                  <XCircle size={14} />
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => void handleReview()}
                  className={`btn btn-primary ${styles.acknowledgeBtn}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className={styles.spinner} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {isSubmitting ? 'Saving…' : 'Mark Reviewed'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

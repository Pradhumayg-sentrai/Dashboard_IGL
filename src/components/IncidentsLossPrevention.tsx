import React, { useEffect, useMemo, useState } from 'react';
import type {
  IncidentItem,
  IncidentSeverity,
  IncidentStatus,
  RemovalItem,
} from '../data/plantData';
import { sampleRemovals } from '../data/plantData';
import { useIncidents } from '../store/dashboardStore';
import {
  bulkDismissIncidents,
  bulkReviewIncidents,
  reviewIncident,
} from '../data/actions';
import {
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  Eye,
  CheckCircle2,
  Lock,
  Loader2,
  Inbox,
  Search,
  X,
  MapPin,
  Truck,
  Barcode,
  RotateCcw,
  CheckCheck,
  XCircle,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import styles from './IncidentsLossPrevention.module.css';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'severity_desc'
  | 'severity_asc'
  | 'type_asc'
  | 'status';

type BulkAction = 'review' | 'dismiss';

interface BulkConfirmation {
  action: BulkAction;
  ids: number[];
}

interface IncidentsLossPreventionProps {
  onInspectIncident: (item: IncidentItem) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_RANK: Record<IncidentStatus, number> = {
  open: 0,
  reviewed: 1,
  dismissed: 2,
};

function formatIncidentType(type: string): string {
  return type.replaceAll('_', ' ');
}

function severityBadgeClass(severity: IncidentSeverity): string {
  if (severity === 'critical' || severity === 'high') return 'badge badge-rose';
  if (severity === 'medium') return 'badge badge-amber';
  return 'badge badge-slate';
}

function severityShortLabel(severity: IncidentSeverity): string {
  if (severity === 'critical') return 'CRIT';
  if (severity === 'high') return 'HIGH';
  if (severity === 'medium') return 'MED';
  return 'LOW';
}

function statusBadgeClass(status: IncidentStatus): string {
  if (status === 'reviewed') return 'badge badge-emerald';
  if (status === 'dismissed') return 'badge badge-slate';
  return 'badge badge-amber';
}

function hasSecondApprover(removal: RemovalItem): boolean {
  if (!removal.approved_by) return false;
  if (removal.requested_by_id && removal.approved_by_id) {
    return removal.requested_by_id !== removal.approved_by_id;
  }
  return removal.approved_by !== removal.requested_by;
}

export const IncidentsLossPrevention: React.FC<IncidentsLossPreventionProps> = ({
  onInspectIncident,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load surveillance incidents feed',
}) => {
  const incidents = useIncidents();

  const [activeTab, setActiveTab] = useState<'incidents' | 'removals'>('incidents');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'all'>('all');
  const [filterBay, setFilterBay] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirmation | null>(null);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [pendingReviewId, setPendingReviewId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const bayOptions = useMemo(() => {
    const bays = new Map<string, string>();
    incidents.forEach(item => {
      if (item.bay_id !== undefined) {
        bays.set(String(item.bay_id), item.bay_name ?? `Bay ${item.bay_id}`);
      }
    });
    return Array.from(bays.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [incidents]);

  const typeOptions = useMemo(
    () => Array.from(new Set(incidents.map(item => item.type))).sort(),
    [incidents],
  );

  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = incidents.filter(item => {
      if (filterSeverity !== 'all' && item.severity !== filterSeverity) return false;
      if (filterBay !== 'all' && String(item.bay_id ?? '') !== filterBay) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;

      const incidentDate = item.occurred_at.slice(0, 10);
      if (dateFrom && incidentDate < dateFrom) return false;
      if (dateTo && incidentDate > dateTo) return false;

      if (term) {
        const barcode = item.barcode_value?.toLowerCase() ?? '';
        const vehiclePlate = item.truck_reg?.toLowerCase() ?? '';
        if (!barcode.includes(term) && !vehiclePlate.includes(term)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.occurred_at.localeCompare(b.occurred_at);
        case 'severity_desc':
          return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
            || b.occurred_at.localeCompare(a.occurred_at);
        case 'severity_asc':
          return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
            || b.occurred_at.localeCompare(a.occurred_at);
        case 'type_asc':
          return a.type.localeCompare(b.type) || b.id - a.id;
        case 'status':
          return STATUS_RANK[a.status] - STATUS_RANK[b.status]
            || b.occurred_at.localeCompare(a.occurred_at);
        case 'newest':
        default:
          return b.occurred_at.localeCompare(a.occurred_at);
      }
    });
  }, [incidents, search, filterSeverity, filterBay, filterType, filterStatus, dateFrom, dateTo, sortBy]);

  const selectableIncidents = useMemo(
    () => filteredIncidents.filter(item => item.status === 'open'),
    [filteredIncidents],
  );

  const allVisibleSelected =
    selectableIncidents.length > 0
    && selectableIncidents.every(item => selectedIds.has(item.id));

  const selectedCount = selectedIds.size;

  useEffect(() => {
    setSelectedIds(new Set());
    setBulkConfirm(null);
    setActionError(null);
  }, [search, filterSeverity, filterBay, filterType, filterStatus, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearch('');
    setFilterSeverity('all');
    setFilterBay('all');
    setFilterType('all');
    setFilterStatus('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
    setSelectedIds(new Set());
    setBulkConfirm(null);
    setActionError(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(previous => {
      const next = new Set(previous);

      if (allVisibleSelected) {
        selectableIncidents.forEach(item => next.delete(item.id));
      } else {
        selectableIncidents.forEach(item => next.add(item.id));
      }

      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkConfirm(null);
    setBulkReason('');
    setBulkNotes('');
  };

  const openBulkConfirmation = (action: BulkAction) => {
    const ids = incidents
      .filter(item => selectedIds.has(item.id) && item.status === 'open')
      .map(item => item.id);

    if (ids.length === 0) return;

    setBulkConfirm({ action, ids });
    setBulkReason('');
    setBulkNotes('');
    setActionError(null);
    setFeedback(null);
  };

  const handleQuickReview = async (id: number) => {
    setPendingReviewId(id);
    setActionError(null);
    setFeedback(null);

    try {
      await reviewIncident(id);
      setFeedback(`Incident #${id} marked as reviewed.`);
      setSelectedIds(previous => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to review incident.');
    } finally {
      setPendingReviewId(null);
    }
  };

  const handleBulkConfirm = async () => {
    if (!bulkConfirm) return;

    if (bulkConfirm.action === 'dismiss' && !bulkReason.trim()) {
      setActionError('A dismissal reason is required.');
      return;
    }

    setIsBulkSubmitting(true);
    setActionError(null);
    setFeedback(null);

    try {
      const notes = bulkNotes.trim() || undefined;

      const result = bulkConfirm.action === 'review'
        ? await bulkReviewIncidents(bulkConfirm.ids, { notes })
        : await bulkDismissIncidents(bulkConfirm.ids, { reason: bulkReason, notes });

      setFeedback(
        `${result.count} incident${result.count === 1 ? '' : 's'} ${
          bulkConfirm.action === 'review' ? 'marked as reviewed' : 'dismissed'
        }.`,
      );
      setSelectedIds(new Set());
      setBulkConfirm(null);
      setBulkReason('');
      setBulkNotes('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Bulk action failed.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const openCount = incidents.filter(item => item.status === 'open').length;

  return (
    <div className={`glass-card ${styles.card}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleGroup}>
            <ShieldAlert size={20} color="#f43f5e" />
            <h3 className={styles.title}>Quality, Damage & Loss Prevention Telemetry</h3>
          </div>
          <p className={styles.subtitle}>
            Real-time computer vision incidents (cam_in inside truck) & cryptographic removal audits
          </p>
        </div>

        <div className={styles.tabGroup}>
          <button
            className={`btn-tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={14} />
            AI Incidents ({openCount} Open)
          </button>
          <button
            className={`btn-tab ${activeTab === 'removals' ? 'active' : ''}`}
            onClick={() => setActiveTab('removals')}
          >
            <Lock size={14} />
            Removal Audit ({sampleRemovals.length})
          </button>
        </div>
      </div>

      {activeTab === 'incidents' && (
        <div className={styles.viewContainer}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarRow}>
              <div className={styles.searchBox}>
                <Search size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search barcode or vehicle plate…"
                  aria-label="Search incidents by barcode or vehicle plate"
                />
                {search && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <select
                className={styles.select}
                value={filterSeverity}
                onChange={event => setFilterSeverity(event.target.value as IncidentSeverity | 'all')}
                aria-label="Filter by severity"
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                className={styles.select}
                value={filterBay}
                onChange={event => setFilterBay(event.target.value)}
                aria-label="Filter by bay"
              >
                <option value="all">All bays</option>
                {bayOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              <select
                className={styles.select}
                value={filterType}
                onChange={event => setFilterType(event.target.value)}
                aria-label="Filter by incident type"
              >
                <option value="all">All types</option>
                {typeOptions.map(type => (
                  <option key={type} value={type}>{formatIncidentType(type)}</option>
                ))}
              </select>

              <select
                className={styles.select}
                value={filterStatus}
                onChange={event => setFilterStatus(event.target.value as IncidentStatus | 'all')}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className={styles.toolbarRow}>
              <label className={styles.dateField}>
                From
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={event => setDateFrom(event.target.value)}
                  aria-label="Filter incidents from date"
                />
              </label>

              <label className={styles.dateField}>
                To
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={event => setDateTo(event.target.value)}
                  aria-label="Filter incidents to date"
                />
              </label>

              <label className={styles.sortField}>
                Sort
                <select
                  className={styles.select}
                  value={sortBy}
                  onChange={event => setSortBy(event.target.value as SortOption)}
                  aria-label="Sort incidents"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="severity_desc">Severity high → low</option>
                  <option value="severity_asc">Severity low → high</option>
                  <option value="type_asc">Type A → Z</option>
                  <option value="status">Status</option>
                </select>
              </label>

              <button type="button" className={styles.resetBtn} onClick={resetFilters}>
                <RotateCcw size={12} />
                Reset
              </button>

              <span className={styles.resultCount}>
                {filteredIncidents.length} of {incidents.length} incidents
              </span>
            </div>
          </div>

          {actionError && (
            <div className={styles.errorBanner} role="alert">
              <AlertTriangle size={14} />
              {actionError}
            </div>
          )}

          {feedback && (
            <div className={styles.successBanner} role="status">
              <CheckCircle2 size={14} />
              {feedback}
            </div>
          )}

          <div className={`${styles.bulkBar} ${selectedCount > 0 ? styles.bulkBarActive : ''}`}>
            <label className={styles.bulkSelect}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                disabled={selectableIncidents.length === 0}
              />
              Select all open ({selectableIncidents.length})
            </label>

            <span className={styles.bulkCount}>{selectedCount} selected</span>

            <div className={styles.bulkActions}>
              <button
                type="button"
                className={`${styles.bulkBtn} ${styles.bulkReview}`}
                onClick={() => openBulkConfirmation('review')}
                disabled={selectedCount === 0 || isBulkSubmitting}
              >
                <CheckCheck size={12} />
                Review selected
              </button>
              <button
                type="button"
                className={`${styles.bulkBtn} ${styles.bulkDismiss}`}
                onClick={() => openBulkConfirmation('dismiss')}
                disabled={selectedCount === 0 || isBulkSubmitting}
              >
                <XCircle size={12} />
                Dismiss selected
              </button>
              {selectedCount > 0 && (
                <button type="button" className={styles.bulkClear} onClick={clearSelection}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {bulkConfirm && (
            <div className={styles.confirmPanel} role="alertdialog" aria-label="Confirm bulk action">
              <div className={styles.confirmHeader}>
                {bulkConfirm.action === 'review' ? (
                  <CheckCheck size={18} color="#34d399" />
                ) : (
                  <AlertTriangle size={18} color="#fb7185" />
                )}
                <div>
                  <strong>
                    Confirm bulk {bulkConfirm.action} for {bulkConfirm.ids.length} incident
                    {bulkConfirm.ids.length === 1 ? '' : 's'}
                  </strong>
                  <p>
                    {bulkConfirm.action === 'review'
                      ? 'These incidents will be marked as reviewed and an audit entry will be written for this bulk action.'
                      : 'Dismissed incidents require a reason. The reason and your identity will be written to the audit log.'}
                  </p>
                </div>
              </div>

              {bulkConfirm.action === 'dismiss' && (
                <textarea
                  className={styles.confirmInput}
                  rows={2}
                  value={bulkReason}
                  onChange={event => setBulkReason(event.target.value)}
                  placeholder="Dismissal reason (required)"
                  aria-required="true"
                />
              )}

              <textarea
                className={styles.confirmInput}
                rows={2}
                value={bulkNotes}
                onChange={event => setBulkNotes(event.target.value)}
                placeholder="Optional shared note for the audit entry"
              />

              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className="btn-action btn-ghost"
                  onClick={() => {
                    setBulkConfirm(null);
                    setBulkReason('');
                    setBulkNotes('');
                    setActionError(null);
                  }}
                  disabled={isBulkSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn-action ${
                    bulkConfirm.action === 'dismiss' ? styles.confirmDismissBtn : styles.confirmReviewBtn
                  }`}
                  onClick={() => void handleBulkConfirm()}
                  disabled={
                    isBulkSubmitting
                    || (bulkConfirm.action === 'dismiss' && !bulkReason.trim())
                  }
                >
                  {isBulkSubmitting ? <Loader2 size={13} className={styles.spinner} /> : null}
                  {isBulkSubmitting
                    ? 'Saving…'
                    : bulkConfirm.action === 'review'
                      ? 'Confirm review'
                      : 'Confirm dismissal'}
                </button>
              </div>
            </div>
          )}

          <div className={styles.incidentList}>
            {isLoading && (
              <div className={styles.stateBox}>
                <Loader2 size={24} className={styles.spinner} />
                <span>Reading camera stream inference logs...</span>
              </div>
            )}

            {!isLoading && isError && (
              <div className={styles.stateBox} style={{ color: '#fb7185' }}>
                <AlertTriangle size={24} />
                <span>{errorMessage}</span>
              </div>
            )}

            {!isLoading && !isError && filteredIncidents.length === 0 && (
              <div className={styles.stateBox}>
                <Inbox size={24} />
                <span>No incidents match the current search, filters, or date range.</span>
              </div>
            )}

            {!isLoading && !isError && filteredIncidents.map(item => (
              <div
                key={item.id}
                className={`${styles.incidentItem} ${
                  item.status === 'dismissed' ? styles.incidentDismissed : ''
                }`}
              >
                <input
                  type="checkbox"
                  className={styles.rowCheckbox}
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  disabled={item.status !== 'open'}
                  aria-label={`Select incident ${item.id}`}
                />

                <div className={styles.incidentLeft}>
                  <div className={styles.badgeWrapper}>
                    <span className={severityBadgeClass(item.severity)}>
                      {severityShortLabel(item.severity)}
                    </span>
                  </div>
                  <div>
                    <div className={styles.incidentTitleRow}>
                      <strong className={styles.incidentType}>
                        {formatIncidentType(item.type)}
                      </strong>
                      <span className={statusBadgeClass(item.status)}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className={styles.incidentTime}>{item.occurred_at}</span>
                    </div>

                    <p className={styles.incidentText}>{item.details}</p>

                    <div className={styles.incidentMeta}>
                      <span className={styles.metaItem}>
                        <MapPin size={11} />
                        {item.bay_name ?? (item.bay_id ? `Bay ${item.bay_id}` : 'Unassigned bay')}
                      </span>
                      <span className={styles.metaItem}>
                        <Truck size={11} />
                        {item.truck_reg ?? 'No vehicle'}
                      </span>
                      {item.barcode_value && (
                        <span className={`font-mono ${styles.metaItem} ${styles.metaBarcode}`}>
                          <Barcode size={11} />
                          {item.barcode_value}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <div className={styles.incidentNote}>Note: {item.notes}</div>
                    )}

                    {item.dismissal_reason && (
                      <div className={styles.incidentDismissReason}>
                        Dismissed: {item.dismissal_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.incidentActions}>
                  <button
                    onClick={() => onInspectIncident(item)}
                    className={`btn-action btn-ghost ${styles.previewBtn}`}
                    title="View CCTV camera frame & bounding box"
                    aria-label="View CCTV camera frame & bounding box"
                  >
                    <Eye size={12} color="#38bdf8" /> Frame Preview
                  </button>

                  {item.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => void handleQuickReview(item.id)}
                      className={`btn-action btn-ghost ${styles.reviewBtn}`}
                      disabled={pendingReviewId === item.id || isBulkSubmitting}
                      aria-label="Mark incident as reviewed"
                    >
                      {pendingReviewId === item.id ? (
                        <Loader2 size={12} className={styles.spinner} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {pendingReviewId === item.id ? 'Saving…' : 'Mark Reviewed'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'removals' && (
        <div className={styles.removalsContainer}>
          <div className={styles.removalsDesc}>
            Every carton removed from an active truck is cryptographically logged via supervisor
            step-up credentials. Rows missing an independent second approver are highlighted.
            <span className={styles.mockNote}>
              {' '}Hash integrity values are mocked until the ledger API is connected.
            </span>
          </div>

          <div className={styles.removalTable}>
            <div className={styles.removalTableHeader}>
              <span>Removal timeline</span>
              <span>Approvals</span>
              <span>Hash verified</span>
            </div>

            {sampleRemovals.map(removal => {
              const secondApproverVerified = hasSecondApprover(removal);
              const approvedByLabel = secondApproverVerified
                ? removal.approved_by
                : removal.approved_by
                  ? `${removal.approved_by} (same approver)`
                  : 'Awaiting second approver';

              return (
                <div
                  key={removal.id}
                  className={`${styles.removalRow} ${
                    secondApproverVerified ? '' : styles.removalRowMissing
                  }`}
                >
                  <div className={styles.removalMain}>
                    <div className={styles.removalHeader}>
                      <span className={`badge badge-rose ${styles.removalBadge}`}>
                        <KeyRound size={12} />
                        AUTHORIZED REMOVAL #{removal.id}
                      </span>
                      <span className={styles.removalTime}>{removal.timestamp}</span>
                      {!secondApproverVerified && (
                        <span className={`badge badge-amber ${styles.approverWarning}`}>
                          <AlertTriangle size={11} />
                          Missing 2nd approver
                        </span>
                      )}
                    </div>

                    <div className={styles.timeline}>
                      <div className={styles.timelineStep}>
                        <span className={`${styles.timelineDot} ${styles.timelineDotRequested}`} />
                        <div>
                          <span className={styles.timelineLabel}>Requested</span>
                          <span className={styles.timelineValue}>
                            {removal.requested_by ?? removal.authorizer}
                          </span>
                          <span className={styles.timelineTime}>
                            {removal.requested_at ?? removal.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className={styles.timelineStep}>
                        <span
                          className={`${styles.timelineDot} ${
                            secondApproverVerified
                              ? styles.timelineDotApproved
                              : styles.timelineDotMissing
                          }`}
                        />
                        <div>
                          <span className={styles.timelineLabel}>Approved</span>
                          <span
                            className={`${styles.timelineValue} ${
                              secondApproverVerified ? '' : styles.timelineValueMissing
                            }`}
                          >
                            {approvedByLabel}
                          </span>
                          <span className={styles.timelineTime}>
                            {removal.approved_at ?? 'No approval timestamp'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.removalReason}>
                      Reason: <em>"{removal.reason}"</em>
                    </div>
                    <div className={`font-mono ${styles.removalMeta}`}>
                      Barcode: {removal.barcode_value} • Truck: {removal.truck_reg} • Session:{' '}
                      {removal.session_id}
                    </div>
                  </div>

                  <div className={styles.removalApproval}>
                    <span className={styles.columnLabel}>Requested by</span>
                    <span className={styles.approvalValue}>
                      {removal.requested_by ?? removal.authorizer}
                    </span>
                    <span className={styles.approvalId}>
                      {removal.requested_by_id ?? removal.employee_id}
                    </span>

                    <span className={styles.columnLabel}>Approved by</span>
                    <span
                      className={`${styles.approvalValue} ${
                        secondApproverVerified ? '' : styles.approvalValueMissing
                      }`}
                    >
                      {approvedByLabel}
                    </span>
                    <span className={styles.approvalId}>
                      {removal.approved_by_id ?? 'No second approver'}
                    </span>
                  </div>

                  <div className={styles.removalIntegrity}>
                    <span className={styles.columnLabel}>Hash verified</span>
                    {removal.hash_verified ? (
                      <span className={`badge badge-emerald ${styles.hashBadge}`}>
                        <ShieldCheck size={12} />
                        Verified
                      </span>
                    ) : (
                      <span className={`badge badge-rose ${styles.hashBadge}`}>
                        <ShieldX size={12} />
                        Not verified
                      </span>
                    )}
                    <span className={`font-mono ${styles.hashValue}`}>
                      {removal.hash ?? 'hash pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

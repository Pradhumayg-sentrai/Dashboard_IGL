import { useDashboardStore } from '../store/dashboardStore';
import type { AuditAction, AuditEntry, IncidentItem } from './plantData';

/**
 * All incident mutations flow through this module.
 *
 * Today each action is persisted into the in-memory (mock) dashboard store and
 * appended to the audit log. When the backend is ready, only the bodies of the
 * functions below need to change to call the real API — every UI surface already
 * invokes these async functions.
 */

export interface IncidentActionActor {
  id: string;
  name: string;
  role?: string;
}

export interface ReviewIncidentOptions {
  notes?: string;
  actor?: IncidentActionActor;
}

export interface DismissIncidentOptions {
  reason: string;
  notes?: string;
  actor?: IncidentActionActor;
}

export interface BulkIncidentResult {
  incidentIds: number[];
  count: number;
  timestamp: string;
}

export const CURRENT_ACTOR: IncidentActionActor = {
  id: 'SAI-003',
  name: 'Anil Kumar',
  role: 'Dock Supervisor',
};

let auditSequence = 0;

function nextAuditId(): string {
  auditSequence += 1;
  return `audit-${Date.now()}-${auditSequence}`;
}

function waitForMockWrite(ms = 220): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, ms);
  });
}

function getIncidentOrThrow(id: number): IncidentItem {
  const incident = useDashboardStore.getState().incidents.find(item => item.id === id);
  if (!incident) {
    throw new Error(`Incident #${id} was not found.`);
  }
  return incident;
}

function normalizeNotes(notes: string | undefined): string | null | undefined {
  if (notes === undefined) return undefined;
  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireDismissalReason(reason: string): string {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error('A dismissal reason is required.');
  }
  return trimmed;
}

function describeIncidentIds(ids: number[]): string {
  if (ids.length === 1) return `incident #${ids[0]}`;
  const shown = ids.slice(0, 5).map(id => `#${id}`).join(', ');
  const remainder = ids.length > 5 ? ` +${ids.length - 5} more` : '';
  return `${ids.length} incidents (${shown}${remainder})`;
}

function appendAuditEntry(
  action: AuditAction,
  actor: IncidentActionActor,
  incidentIds: number[],
  options: { reason?: string; notes?: string } = {},
): AuditEntry {
  const timestamp = new Date().toISOString();
  const verb = action === 'review' || action === 'bulk_review' ? 'reviewed' : 'dismissed';
  const entry: AuditEntry = {
    id: nextAuditId(),
    timestamp,
    actor_name: actor.name,
    actor_id: actor.id,
    action,
    incident_ids: incidentIds,
    ...(options.reason ? { reason: options.reason } : {}),
    ...(options.notes ? { notes: options.notes } : {}),
    summary: `${actor.name} (${actor.id}) ${verb} ${describeIncidentIds(incidentIds)}${
      options.reason ? ` — reason: ${options.reason}` : ''
    }`,
  };

  useDashboardStore.getState().appendAuditEntry(entry);

  // Visible in the browser console until the audit log is shipped to the backend.
  console.info('[AUDIT]', entry);

  return entry;
}

export async function reviewIncident(
  id: number,
  options: ReviewIncidentOptions = {},
): Promise<IncidentItem> {
  const actor = options.actor ?? CURRENT_ACTOR;
  const notes = normalizeNotes(options.notes);
  const incident = getIncidentOrThrow(id);

  if (incident.status === 'dismissed') {
    throw new Error(`Incident #${id} has already been dismissed and cannot be reviewed.`);
  }

  await waitForMockWrite();

  const timestamp = new Date().toISOString();
  const patch: Partial<IncidentItem> = {
    status: 'reviewed',
    reviewed_by: actor.name,
    reviewed_by_id: actor.id,
    reviewed_at: timestamp,
    ...(notes !== undefined ? { notes } : {}),
  };

  useDashboardStore.getState().updateIncident(id, patch);
  appendAuditEntry('review', actor, [id], { notes: notes ?? undefined });

  return { ...getIncidentOrThrow(id), ...patch };
}

export async function dismissIncident(
  id: number,
  options: DismissIncidentOptions,
): Promise<IncidentItem> {
  const actor = options.actor ?? CURRENT_ACTOR;
  const reason = requireDismissalReason(options.reason);
  const notes = normalizeNotes(options.notes);
  const incident = getIncidentOrThrow(id);

  if (incident.status === 'dismissed') {
    throw new Error(`Incident #${id} has already been dismissed.`);
  }

  await waitForMockWrite();

  const timestamp = new Date().toISOString();
  const patch: Partial<IncidentItem> = {
    status: 'dismissed',
    dismissal_reason: reason,
    dismissed_by: actor.name,
    dismissed_by_id: actor.id,
    dismissed_at: timestamp,
    ...(notes !== undefined ? { notes } : {}),
  };

  useDashboardStore.getState().updateIncident(id, patch);
  appendAuditEntry('dismiss', actor, [id], { reason, notes: notes ?? undefined });

  return { ...getIncidentOrThrow(id), ...patch };
}

export async function bulkReviewIncidents(
  ids: number[],
  options: ReviewIncidentOptions = {},
): Promise<BulkIncidentResult> {
  const actor = options.actor ?? CURRENT_ACTOR;
  const notes = normalizeNotes(options.notes);
  const uniqueIds = Array.from(new Set(ids));
  const incidents = uniqueIds
    .map(id => useDashboardStore.getState().incidents.find(item => item.id === id))
    .filter((item): item is IncidentItem => Boolean(item));

  const actionableIds = incidents
    .filter(item => item.status !== 'dismissed')
    .map(item => item.id);

  if (actionableIds.length === 0) {
    throw new Error('No reviewable incidents were selected.');
  }

  await waitForMockWrite(260);

  const timestamp = new Date().toISOString();
  const patch: Partial<IncidentItem> = {
    status: 'reviewed',
    reviewed_by: actor.name,
    reviewed_by_id: actor.id,
    reviewed_at: timestamp,
    ...(notes !== undefined ? { notes } : {}),
  };

  useDashboardStore.getState().updateIncidents(actionableIds, patch);
  appendAuditEntry('bulk_review', actor, actionableIds, { notes: notes ?? undefined });

  return { incidentIds: actionableIds, count: actionableIds.length, timestamp };
}

export async function bulkDismissIncidents(
  ids: number[],
  options: DismissIncidentOptions,
): Promise<BulkIncidentResult> {
  const actor = options.actor ?? CURRENT_ACTOR;
  const reason = requireDismissalReason(options.reason);
  const notes = normalizeNotes(options.notes);
  const uniqueIds = Array.from(new Set(ids));
  const incidents = uniqueIds
    .map(id => useDashboardStore.getState().incidents.find(item => item.id === id))
    .filter((item): item is IncidentItem => Boolean(item));

  const actionableIds = incidents
    .filter(item => item.status !== 'dismissed')
    .map(item => item.id);

  if (actionableIds.length === 0) {
    throw new Error('No dismissable incidents were selected.');
  }

  await waitForMockWrite(260);

  const timestamp = new Date().toISOString();
  const patch: Partial<IncidentItem> = {
    status: 'dismissed',
    dismissal_reason: reason,
    dismissed_by: actor.name,
    dismissed_by_id: actor.id,
    dismissed_at: timestamp,
    ...(notes !== undefined ? { notes } : {}),
  };

  useDashboardStore.getState().updateIncidents(actionableIds, patch);
  appendAuditEntry('bulk_dismiss', actor, actionableIds, {
    reason,
    notes: notes ?? undefined,
  });

  return { incidentIds: actionableIds, count: actionableIds.length, timestamp };
}

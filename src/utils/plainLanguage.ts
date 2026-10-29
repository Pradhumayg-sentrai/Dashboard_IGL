import type { IncidentSeverity, LiveBayState } from '../data/plantData';

export function plainBayStatus(status: LiveBayState['status']): string {
  switch (status) {
    case 'loading':
      return 'Loading';
    case 'stopped':
      return 'Stopped';
    case 'preparing':
      return 'Getting ready';
    default:
      return 'Waiting for truck';
  }
}

export function plainStopCause(cause: string | null): string {
  if (!cause) return 'Belt stopped';

  const normalized = cause.toLowerCase();

  if (normalized.includes('excise portal silent')) {
    return 'Bay computer is not responding';
  }
  if (normalized.includes('decal unreadable') || normalized.includes('code decal')) {
    return 'Label cannot be read';
  }
  if (normalized.includes('handset')) {
    return 'Gate pass is updating';
  }
  if (normalized.includes('target quantity reached')) {
    return 'Truck is fully loaded, waiting for seal';
  }
  if (normalized.includes('manual supervisor pause')) {
    return 'Supervisor stopped the belt';
  }
  if (normalized.includes('lane stoppage')) {
    return 'Belt stopped';
  }

  return 'The belt stopped unexpectedly';
}

export function plainIncidentType(type: string): string {
  switch (type) {
    case 'throw':
      return 'Camera saw a box thrown';
    case 'drop':
      return 'Camera saw a box drop';
    case 'unscanned_box':
      return 'Box was not scanned';
    case 'missing_box':
      return 'Box is missing';
    case 'camera_blocked':
      return 'Camera is blocked';
    case 'portal_silent':
      return 'Bay computer is not responding';
    default:
      return 'Camera alert';
  }
}

export function plainIncidentAdvice(type: string): string {
  switch (type) {
    case 'throw':
      return 'A box was thrown into the truck. Check the boxes for damage.';
    case 'drop':
      return 'A box was dropped. Check the box before loading.';
    case 'unscanned_box':
      return 'A box was not scanned. Tell your supervisor.';
    case 'missing_box':
      return 'A box is missing. Tell your supervisor before the truck leaves.';
    case 'camera_blocked':
      return 'The camera could not see clearly. Tell your supervisor.';
    case 'portal_silent':
      return 'The bay computer did not respond. Tell your supervisor.';
    default:
      return 'The camera saw something unusual. Tell your supervisor.';
  }
}

export function plainSeverity(severity: IncidentSeverity): string {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'high':
    case 'medium':
      return 'Urgent';
    default:
      return 'Low';
  }
}

export function isAlertCritical(item: { severity: string; type?: string }): boolean {
  if (item.severity === 'critical') return true;
  if (item.type === 'missing_box' || item.type === 'camera_blocked' || item.type === 'portal_silent') {
    return true;
  }
  return false;
}

export function formatClockTime(value: string | number | Date): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value)
        : new Date(value.replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatIncidentTime(value: string): string {
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const dayLabel = sameDay
    ? 'Today'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return `${dayLabel}, ${formatClockTime(date)}`;
}

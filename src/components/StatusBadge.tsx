import React from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  Info,
  Loader2,
  PauseCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  WifiOff,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export type StatusTone = 'ok' | 'warn' | 'critical' | 'info' | 'neutral';

export type StatusKind =
  | 'loading'
  | 'preparing'
  | 'stopped'
  | 'critical'
  | 'high'
  | 'warning'
  | 'ok'
  | 'info'
  | 'low'
  | 'standby'
  | 'open'
  | 'reviewed'
  | 'dismissed'
  | 'live'
  | 'reconnecting'
  | 'offline'
  | 'verified'
  | 'unverified'
  | 'preferred'
  | 'standard'
  | 'review'
  | 'stale';

interface StatusConfig {
  tone: StatusTone;
  icon: LucideIcon;
  label: string;
  spin?: boolean;
}

const STATUS: Record<StatusKind, StatusConfig> = {
  loading: { tone: 'ok', icon: Loader2, label: 'Loading', spin: true },
  preparing: { tone: 'info', icon: Clock3, label: 'Getting ready' },
  stopped: { tone: 'critical', icon: PauseCircle, label: 'Stopped' },
  critical: { tone: 'critical', icon: AlertOctagon, label: 'Urgent' },
  high: { tone: 'critical', icon: AlertTriangle, label: 'Urgent' },
  warning: { tone: 'warn', icon: AlertTriangle, label: 'Check' },
  ok: { tone: 'ok', icon: CheckCircle2, label: 'OK' },
  info: { tone: 'info', icon: Info, label: 'Info' },
  low: { tone: 'neutral', icon: Info, label: 'Low' },
  standby: { tone: 'neutral', icon: CircleDashed, label: 'Waiting' },
  open: { tone: 'warn', icon: AlertCircle, label: 'Open' },
  reviewed: { tone: 'ok', icon: CheckCircle2, label: 'Done' },
  dismissed: { tone: 'neutral', icon: XCircle, label: 'Closed' },
  live: { tone: 'ok', icon: Radio, label: 'Connected' },
  reconnecting: { tone: 'warn', icon: RefreshCw, label: 'Connecting', spin: true },
  offline: { tone: 'critical', icon: WifiOff, label: 'Not connected' },
  verified: { tone: 'ok', icon: ShieldCheck, label: 'Checked' },
  unverified: { tone: 'critical', icon: ShieldX, label: 'Not checked' },
  preferred: { tone: 'ok', icon: Award, label: 'Preferred' },
  standard: { tone: 'neutral', icon: Circle, label: 'Standard' },
  review: { tone: 'warn', icon: AlertTriangle, label: 'Late' },
  stale: { tone: 'warn', icon: AlertTriangle, label: 'Not updating' },
};

interface StatusBadgeProps {
  kind: StatusKind;
  children?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  spinning?: boolean;
  title?: string;
}

/**
 * Status is always icon + text, never colour alone. The tone chooses the
 * colour pair; the label remains readable with the colour stripped out.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  kind,
  children,
  className,
  icon,
  spinning,
  title,
}) => {
  const config = STATUS[kind];
  const Icon = icon ?? config.icon;
  const shouldSpin = spinning ?? config.spin;

  return (
    <span
      className={`badge badge-${config.tone}${className ? ` ${className}` : ''}`}
      title={title}
    >
      <Icon size={12} aria-hidden="true" className={shouldSpin ? 'badge-spin' : undefined} />
      <span>{children ?? config.label}</span>
    </span>
  );
};

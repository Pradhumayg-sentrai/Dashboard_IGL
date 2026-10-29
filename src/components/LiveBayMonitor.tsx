import React, { useEffect, useState } from 'react';
import type { LiveBayState } from '../data/plantData';
import { hardwareDevices } from '../data/plantData';
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  Clock,
  Cpu,
  Phone,
  Radio,
  Smartphone,
  Truck,
  UserCheck,
  Video,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CallSupervisorButton } from './CallSupervisorButton';
import { plainBayStatus, plainStopCause } from '../utils/plainLanguage';
import styles from './LiveBayMonitor.module.css';

interface LiveBayMonitorProps {
  liveBay: LiveBayState;
}

const statusKind = (status: LiveBayState['status']) => {
  switch (status) {
    case 'loading':
      return 'loading' as const;
    case 'stopped':
      return 'stopped' as const;
    case 'preparing':
      return 'preparing' as const;
    default:
      return 'standby' as const;
  }
};

const beltLabel = (state: LiveBayState['beltState']) => {
  switch (state) {
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    case 'warning':
      return 'Needs checking';
    default:
      return 'Stopped';
  }
};

const gateLabel = (flag: LiveBayState['gateFlag']) => {
  switch (flag) {
    case 'pass':
      return 'Clear';
    case 'divert':
      return 'Diverted';
    default:
      return 'Waiting';
  }
};

export const LiveBayMonitor: React.FC<LiveBayMonitorProps> = ({ liveBay }) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const staleAgeMs = now - (liveBay.lastUpdated || 0);
  const isStale =
    liveBay.status === 'loading' &&
    liveBay.beltState === 'running' &&
    staleAgeMs > 10000;

  const percentComplete = Math.min(
    100,
    (liveBay.loadedQty / liveBay.allocatedQty) * 100,
  );
  const minutesLeft = Math.max(1, Math.round(liveBay.estimatedRemainingMinutes));
  const isStopped = liveBay.status === 'stopped';
  const reason = plainStopCause(liveBay.stopCause);

  const getDeviceIcon = (id: string) => {
    switch (id) {
      case 'mvid01':
        return <Barcode size={16} />;
      case 'cpplus01':
        return <Video size={16} />;
      case 'posHandset':
        return <Smartphone size={16} />;
      default:
        return <Cpu size={16} />;
    }
  };

  const guidance = () => {
    switch (liveBay.status) {
      case 'loading':
        return {
          title: 'Loading normally',
          body: 'Cartons are moving into the truck.',
          icon: <CheckCircle2 size={26} aria-hidden="true" />,
        };
      case 'preparing':
        return {
          title: 'Getting ready',
          body: 'The truck is at the bay. Loading has not started yet.',
          icon: <Clock size={26} aria-hidden="true" />,
        };
      case 'stopped':
        return {
          title: 'This bay needs help',
          body: `${reason}. Call your supervisor.`,
          icon: <AlertTriangle size={26} aria-hidden="true" />,
        };
      default:
        return {
          title: 'Waiting for a truck',
          body: 'No truck is loading at this bay right now.',
          icon: <Truck size={26} aria-hidden="true" />,
        };
    }
  };

  const help = guidance();

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>{liveBay.bayName}</h2>
            <StatusBadge kind={statusKind(liveBay.status)}>
              {plainBayStatus(liveBay.status)}
            </StatusBadge>
            {isStale && <StatusBadge kind="stale">Not updating</StatusBadge>}
          </div>
          <p className={styles.subtitle}>{liveBay.dockLocation}</p>
        </div>

        <div className={styles.vehicleBox}>
          <Truck size={22} color="var(--accent)" aria-hidden="true" />
          <div>
            <div className={styles.vehicleLabel}>Truck at this bay</div>
            <div className={styles.vehicleReg}>
              {liveBay.truckReg || 'No truck yet'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.progressBox}>
        <div className={styles.progressTop}>
          <div>
            <span className={styles.progressTitle}>Cartons loaded</span>
            <div className={styles.countRow}>
              <span className={styles.loadedQty}>
                {liveBay.loadedQty.toLocaleString()}
              </span>
              <span className={styles.allocatedQty}>
                of {liveBay.allocatedQty.toLocaleString()}
              </span>
            </div>
          </div>

          <div className={styles.etaRow}>
            <Clock size={17} aria-hidden="true" />
            <span>
              {liveBay.status === 'loading'
                ? `About ${minutesLeft} min left`
                : 'Waiting'}
            </span>
          </div>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={Math.round(percentComplete)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Cartons loaded"
        >
          <div
            className={`${styles.progressFill} ${isStopped ? styles.progressFillStopped : ''}`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <div
        className={`${styles.helpBox} ${isStopped ? styles.helpBoxStopped : styles.helpBoxOk}`}
        role={isStopped ? 'alert' : 'status'}
      >
        <div className={styles.helpIcon}>{help.icon}</div>
        <div className={styles.helpText}>
          <strong className={styles.helpTitle}>{help.title}</strong>
          <p className={styles.helpBody}>{help.body}</p>
        </div>
        {isStopped && (
          <CallSupervisorButton
            bay={liveBay}
            reason={reason}
            className={styles.helpAction}
          />
        )}
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div
            className={styles.avatar}
            style={{ backgroundColor: liveBay.supervisor.avatarColor }}
            aria-hidden="true"
          >
            {liveBay.supervisor.name
              .split(' ')
              .map(name => name[0])
              .join('')}
          </div>
          <div>
            <div className={styles.supLabel}>
              <UserCheck size={15} color="var(--ok)" aria-hidden="true" />
              Your supervisor
            </div>
            <div className={styles.supName}>{liveBay.supervisor.name}</div>
            <div className={styles.supSub}>
              <Phone size={14} className={styles.phoneIcon} aria-hidden="true" />
              <span className={styles.phoneHighlight}>
                {liveBay.supervisor.phoneExt}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.callCard}>
          <div>
            <strong className={styles.callCardTitle}>Need help?</strong>
            <p className={styles.callCardBody}>
              Call your supervisor if you need help.
            </p>
          </div>
          <CallSupervisorButton bay={liveBay} reason={isStopped ? reason : undefined} />
        </div>
      </div>

      <details className={styles.details}>
        <summary className={styles.detailsSummary}>
          Details for supervisor
        </summary>

        <div className={styles.detailsBody}>
          <div className={styles.techGrid}>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Belt</span>
              <strong className={styles.techValue}>{beltLabel(liveBay.beltState)}</strong>
            </div>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Gate pass</span>
              <strong className={styles.techValue}>{gateLabel(liveBay.gateFlag)}</strong>
            </div>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Pace</span>
              <strong className={styles.techValue}>
                {Math.round(liveBay.paceCpm * 60).toLocaleString()} cartons/hr
              </strong>
            </div>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Time at bay</span>
              <strong className={styles.techValue}>
                {liveBay.sessionDurationMinutes} min
              </strong>
            </div>
          </div>

          <div className={styles.manifestGrid}>
            <div className={styles.manifestItem}>
              <div className={styles.manifestLabel}>Dispatch number</div>
              <div className={`font-mono ${styles.manifestValue}`} title={liveBay.indentNo}>
                {liveBay.indentNo}
              </div>
            </div>
            <div className={styles.manifestItem}>
              <div className={styles.manifestLabel}>Excise licence</div>
              <div className={`font-mono ${styles.manifestValue}`} title={liveBay.licenceNo}>
                {liveBay.licenceNo}
              </div>
            </div>
          </div>

          <div className={styles.barcodeCard}>
            <div className={styles.barcodeHeader}>
              <Barcode size={15} color="var(--ok)" aria-hidden="true" />
              <span className={styles.barcodeLabel}>Last carton scanned</span>
            </div>
            <div className={`font-mono ${styles.barcodeVal}`}>
              {liveBay.lastScannedBarcode || 'No carton scanned yet'}
            </div>
          </div>

          <div>
            <div className={styles.hwHeader}>
              <Radio size={15} color="var(--accent)" aria-hidden="true" />
              <span className={styles.hwTitle}>Camera and scanner status</span>
            </div>
            <div className={styles.hwGrid}>
              {hardwareDevices.map(device => (
                <div key={device.id} className={styles.hwCard}>
                  <div className={styles.hwIcon}>{getDeviceIcon(device.id)}</div>
                  <div className={styles.hwContent}>
                    <div className={styles.hwName}>{device.name}</div>
                    <div className={styles.hwLatency}>
                      <span className={`pulse-dot online ${styles.hwPulseDot}`} />
                      {device.latencyMs}ms lag
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

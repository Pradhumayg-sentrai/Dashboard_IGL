import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, WifiOff } from 'lucide-react';
import { useConnectionStatus, useLastUpdateTimestamp } from '../store/dashboardStore';
import styles from './ConnectionStatus.module.css';

export const ConnectionStatus: React.FC = () => {
  const status = useConnectionStatus();
  const lastUpdateTimestamp = useLastUpdateTimestamp();
  const [ageSeconds, setAgeSeconds] = useState<number>(0);

  useEffect(() => {
    const updateAge = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - lastUpdateTimestamp) / 1000));
      setAgeSeconds(elapsed);
    };

    updateAge();
    const timer = setInterval(updateAge, 1000);
    return () => clearInterval(timer);
  }, [lastUpdateTimestamp]);

  const getStatusClass = () => {
    switch (status) {
      case 'live':
        return styles.statusLive;
      case 'reconnecting':
        return styles.statusReconnecting;
      case 'offline':
        return styles.statusOffline;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'live':
        return <Radio size={13} aria-hidden="true" />;
      case 'reconnecting':
        return <RefreshCw size={13} className={styles.spin} aria-hidden="true" />;
      case 'offline':
        return <WifiOff size={13} aria-hidden="true" />;
    }
  };

  const formatAge = () => {
    if (ageSeconds < 2) return '<1s ago';
    if (ageSeconds < 60) return `${ageSeconds}s ago`;
    const mins = Math.floor(ageSeconds / 60);
    return `${mins}m ago`;
  };

  return (
    <div 
      className={`${styles.statusPill} ${getStatusClass()}`}
      title={`Connection: ${status.toUpperCase()} • Telemetry Age: ${ageSeconds}s`}
      aria-label={`Connection status: ${status}, updated ${formatAge()}`}
    >
      {getStatusIcon()}
      <span className={styles.label}>
        {status === 'live' && 'Live'}
        {status === 'reconnecting' && 'Reconnecting'}
        {status === 'offline' && 'Offline'}
      </span>
      <span className={styles.age}>
        ({formatAge()})
      </span>
    </div>
  );
};

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
    if (ageSeconds < 5) return 'just now';
    if (ageSeconds < 60) {
      const seconds = Math.round(ageSeconds);
      return `updated ${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
    }
    const mins = Math.floor(ageSeconds / 60);
    return `updated ${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  };

  return (
    <div
      className={`${styles.statusPill} ${getStatusClass()}`}
      title={`Connection: ${status === 'live' ? 'Connected' : status === 'reconnecting' ? 'Connecting' : 'Not connected'}, ${formatAge()}`}
      aria-label={`Connection status: ${status === 'live' ? 'Connected' : status === 'reconnecting' ? 'Connecting' : 'Not connected'}, ${formatAge()}`}
    >
      {getStatusIcon()}
      <span className={styles.label}>
        {status === 'live' && 'Connected'}
        {status === 'reconnecting' && 'Connecting'}
        {status === 'offline' && 'Not connected'}
      </span>
      <span className={styles.age}>
        {formatAge()}
      </span>
    </div>
  );
};

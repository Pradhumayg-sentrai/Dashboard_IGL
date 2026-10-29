import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Phone, X } from 'lucide-react';
import type { LiveBayState } from '../data/plantData';
import { formatClockTime } from '../utils/plainLanguage';
import styles from './CallSupervisorButton.module.css';

interface CallSupervisorButtonProps {
  bay: LiveBayState;
  reason?: string;
  className?: string;
  label?: string;
  variant?: 'primary' | 'ghost';
}

export const CallSupervisorButton: React.FC<CallSupervisorButtonProps> = ({
  bay,
  reason,
  className,
  label = 'Call supervisor',
  variant = 'primary',
}) => {
  const [open, setOpen] = useState(false);
  const [notified, setNotified] = useState(false);
  const [notifiedAt, setNotifiedAt] = useState('');

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openDialog = () => {
    setNotified(false);
    setNotifiedAt('');
    setOpen(true);
  };

  const markNotified = () => {
    setNotifiedAt(formatClockTime(new Date()));
    setNotified(true);
  };

  return (
    <>
      <button
        type="button"
        className={`btn-action ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${styles.button}${className ? ` ${className}` : ''}`}
        onClick={event => {
          event.stopPropagation();
          openDialog();
        }}
      >
        <Phone size={17} aria-hidden="true" />
        <span>{label}</span>
      </button>

      {open &&
        createPortal(
          <div
            className={styles.backdrop}
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="call-supervisor-title"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className={styles.phoneIcon}>
                <Phone size={26} aria-hidden="true" />
              </div>

              <h2 id="call-supervisor-title" className={styles.title}>
                Call supervisor
              </h2>
              <p className={styles.bayName}>
                {bay.bayName} · {bay.dockLocation}
              </p>

              {reason && <p className={styles.reason}>{reason}</p>}

              <div className={styles.contact}>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Supervisor</span>
                  <strong className={styles.contactValue}>{bay.supervisor.name}</strong>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Phone</span>
                  <strong className={styles.contactValue}>{bay.supervisor.phoneExt}</strong>
                </div>
              </div>

              {notified ? (
                <div className={styles.confirmation} role="status">
                  <CheckCircle2 size={22} aria-hidden="true" />
                  <span>
                    Supervisor notified at {notifiedAt}. Please wait at {bay.bayName}.
                  </span>
                </div>
              ) : (
                <div className={styles.actions}>
                  <a
                    className={`btn-action btn-primary ${styles.actionBtn}`}
                    href={`tel:${bay.supervisor.phoneExt}`}
                  >
                    <Phone size={19} aria-hidden="true" />
                    Call now
                  </a>
                  <button
                    type="button"
                    className={`btn-action btn-ghost ${styles.actionBtn}`}
                    onClick={markNotified}
                  >
                    <CheckCircle2 size={19} aria-hidden="true" />
                    Supervisor notified
                  </button>
                </div>
              )}

              <p className={styles.note}>
                Only the supervisor can start or stop the belt.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

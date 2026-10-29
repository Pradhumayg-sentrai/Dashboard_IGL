import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Hand,
  Phone,
  Truck,
} from 'lucide-react';
import styles from './HelpPage.module.css';

const steps = [
  {
    icon: Eye,
    title: '1. Look at the top',
    body: 'Green means all bays are okay. Red means one or more bays need help.',
  },
  {
    icon: Truck,
    title: '2. Look at the bays',
    body: '“Loading” means cartons are moving. “Stopped” means the belt is not moving.',
  },
  {
    icon: Phone,
    title: '3. Call your supervisor',
    body: 'Press “Call supervisor.” Tell them the bay number and what is wrong. Do not touch the belt.',
  },
];

export const HelpPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={`card ${styles.helpCard}`}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Hand size={28} aria-hidden="true" />
          </div>
          <div>
            <h1 className={styles.title}>How to use this screen</h1>
            <p className={styles.subtitle}>
              This screen shows what is happening in the loading bays.
            </p>
          </div>
        </div>

        <ol className={styles.steps}>
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <li key={step.title} className={styles.step}>
                <div className={styles.stepIcon}>
                  <Icon size={26} aria-hidden="true" />
                </div>
                <div>
                  <h2 className={styles.stepTitle}>{step.title}</h2>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className={styles.legendSection}>
          <h2 className={styles.legendTitle}>What the words mean</h2>
          <div className={styles.legendGrid}>
            <div className={styles.legendItem}>
              <span className={`badge badge-ok ${styles.legendBadge}`}>
                <CheckCircle2 size={16} aria-hidden="true" />
                Loading
              </span>
              <span>Cartons are moving into the truck.</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`badge badge-critical ${styles.legendBadge}`}>
                <AlertTriangle size={16} aria-hidden="true" />
                Stopped
              </span>
              <span>The belt is not moving. Call the supervisor.</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`badge badge-info ${styles.legendBadge}`}>
                <CheckCircle2 size={16} aria-hidden="true" />
                Getting ready
              </span>
              <span>The truck is at the bay, but loading has not started.</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`badge badge-neutral ${styles.legendBadge}`}>
                <Truck size={16} aria-hidden="true" />
                Waiting for truck
              </span>
              <span>No truck is loading at this bay.</span>
            </div>
          </div>
        </div>

        <div className={styles.safetyNote}>
          <Phone size={22} aria-hidden="true" />
          <div>
            <strong>Only the supervisor can start or stop a belt.</strong>
            <p>If you are not sure what to do, call your supervisor.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/wall" className={`btn-action btn-primary ${styles.actionBtn}`}>
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
};

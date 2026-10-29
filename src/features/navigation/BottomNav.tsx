import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Factory, UserCheck, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import styles from './BottomNav.module.css';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isBaysRoute = location.pathname.startsWith('/bay/');

  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      <NavLink 
        to="/wall" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <Factory size={18} />
        <span>Manager</span>
      </NavLink>

      <NavLink 
        to="/plant" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <UserCheck size={18} />
        <span>Supervisor</span>
      </NavLink>

      <NavLink 
        to="/bay/1" 
        className={`${styles.navItem} ${isBaysRoute ? styles.navItemActive : ''}`}
        aria-current={isBaysRoute ? 'page' : undefined}
      >
        <SlidersHorizontal size={18} />
        <span>Bays</span>
      </NavLink>

      <NavLink 
        to="/excise" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <ShieldCheck size={18} />
        <span>Excise</span>
      </NavLink>
    </nav>
  );
};


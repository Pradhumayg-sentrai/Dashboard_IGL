import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, CircleHelp, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
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
        <LayoutDashboard size={18} />
        <span>Overview</span>
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
        to="/plant"
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <BarChart3 size={18} />
        <span>Reports</span>
      </NavLink>

      <NavLink
        to="/help"
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <CircleHelp size={18} />
        <span>Help</span>
      </NavLink>
    </nav>
  );
};

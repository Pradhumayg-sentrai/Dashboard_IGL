import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tv, Factory, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import styles from './BottomNav.module.css';

export const BottomNav: React.FC = () => {
  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      <NavLink 
        to="/wall" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <Tv size={18} />
        <span>Wall</span>
      </NavLink>

      <NavLink 
        to="/plant" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <Factory size={18} />
        <span>Plant</span>
      </NavLink>

      <NavLink 
        to="/bay/1" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <SlidersHorizontal size={18} />
        <span>Bay 1</span>
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


import React from 'react';
import { Search, X, FileSpreadsheet, ChevronDown, RotateCcw } from 'lucide-react';
import styles from './ExciseFilterBar.module.css';

export type ExciseTimeframe = '1d' | '1w' | '15d' | '1m' | 'custom';

export interface IndentOption {
  value: string;
  label: string;
}

interface ExciseFilterBarProps {
  timeframe: ExciseTimeframe;
  onTimeframeChange: (tf: ExciseTimeframe) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
  selectedIndent: string;
  onIndentChange: (indent: string) => void;
  indentOptions: IndentOption[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  totalResults: number;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const ExciseFilterBar: React.FC<ExciseFilterBarProps> = ({
  timeframe,
  onTimeframeChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  selectedIndent,
  onIndentChange,
  indentOptions,
  searchQuery,
  onSearchQueryChange,
  totalResults,
  onResetFilters,
  isFiltered,
}) => {
  return (
    <div className={styles.filterBar} role="search" aria-label="Filter state excise and removal records">
      {/* Top row: Live Search & Indent Filter */}
      <div className={styles.topRow}>
        <div className={styles.searchContainer}>
          <Search size={17} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by indent, barcode, truck, supervisor..."
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            aria-label="Search records"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear search text"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className={styles.indentSelectWrapper}>
          <FileSpreadsheet size={17} className={styles.indentIcon} aria-hidden="true" />
          <select
            className={styles.indentSelect}
            value={selectedIndent}
            onChange={e => onIndentChange(e.target.value)}
            aria-label="Filter by Indent"
          >
            <option value="all">All Indents</option>
            {indentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className={styles.selectArrow} aria-hidden="true" />
        </div>
      </div>

      {/* Bottom row: Timeframe pills, custom date range pickers, and match counter */}
      <div className={styles.bottomRow}>
        <div className={styles.timeframeGroup} role="group" aria-label="Select timeframe">
          <button
            type="button"
            className={`${styles.timeframeBtn} ${timeframe === '1d' ? styles.timeframeBtnActive : ''}`}
            onClick={() => onTimeframeChange('1d')}
          >
            1 Day (Today)
          </button>
          <button
            type="button"
            className={`${styles.timeframeBtn} ${timeframe === '1w' ? styles.timeframeBtnActive : ''}`}
            onClick={() => onTimeframeChange('1w')}
          >
            1 Week
          </button>
          <button
            type="button"
            className={`${styles.timeframeBtn} ${timeframe === '15d' ? styles.timeframeBtnActive : ''}`}
            onClick={() => onTimeframeChange('15d')}
          >
            Last 15 Days
          </button>
          <button
            type="button"
            className={`${styles.timeframeBtn} ${timeframe === '1m' ? styles.timeframeBtnActive : ''}`}
            onClick={() => onTimeframeChange('1m')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`${styles.timeframeBtn} ${timeframe === 'custom' ? styles.timeframeBtnActive : ''}`}
            onClick={() => onTimeframeChange('custom')}
          >
            Custom Date
          </button>
        </div>

        {timeframe === 'custom' && (
          <div className={styles.customDateContainer}>
            <div className={styles.dateInputGroup}>
              <span className={styles.dateLabel}>From:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={customStartDate}
                onChange={e => onCustomStartDateChange(e.target.value)}
                aria-label="Start date"
              />
            </div>
            <div className={styles.dateInputGroup}>
              <span className={styles.dateLabel}>To:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={customEndDate}
                onChange={e => onCustomEndDateChange(e.target.value)}
                aria-label="End date"
              />
            </div>
          </div>
        )}

        <div className={styles.metaRow}>
          <span className={styles.matchCount}>
            <strong>{totalResults}</strong> records match
          </span>

          {isFiltered && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={onResetFilters}
              title="Reset all filters to default"
            >
              <RotateCcw size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ChartDataPoint, Timeframe } from '../data/plantData';
import { 
  BarChart3, 
  Target, 
  Plus, 
  Minus, 
  MoveVertical,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Inbox,
  RotateCw,
  GitCompare
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ReferenceLine
} from 'recharts';
import { StatusBadge } from './StatusBadge';
import styles from './ThroughputAnalytics.module.css';

interface ThroughputAnalyticsProps {
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export type ShiftFilter = 'all' | 'shift_a' | 'shift_b' | 'shift_c';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: ChartDataPoint & { previousVolume?: number };
  }>;
  label?: string;
  unit: string;
  target: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit, target }) => {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0].payload;
  const currentVol = dataPoint.volume;
  const prevVol = dataPoint.previousVolume;
  const attainment = target > 0 ? Math.round((currentVol / target) * 100) : 0;
  const isPerMinute = unit === 'cases / min';

  return (
    <div className={styles.tooltipCard}>
      <div className={styles.tooltipInterval}>
        Interval: <strong style={{ color: 'var(--text)' }}>{label}</strong>
      </div>
      <div className={styles.tooltipVolume}>
        {isPerMinute ? 'Rate' : 'Volume'}: {currentVol.toLocaleString()} {isPerMinute ? 'cases/min' : 'cases'}
      </div>
      {prevVol !== undefined && (
        <div className={styles.tooltipPrev}>
          Prev Period: {prevVol.toLocaleString()} {isPerMinute ? 'cases/min' : 'cases'} ({Number((currentVol - prevVol).toFixed(1)) >= 0 ? '+' : ''}{Number((currentVol - prevVol).toFixed(1)).toLocaleString()})
        </div>
      )}
      <div className={styles.tooltipTarget}>
        Target: {target.toLocaleString()} {unit} ({attainment}%)
      </div>
    </div>
  );
};

export const ThroughputAnalytics: React.FC<ThroughputAnalyticsProps> = ({ 
  chartData, 
  timeframe,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to fetch PLC throughput telemetry',
  onRetry,
}) => {
  const [selectedShift, setSelectedShift] = useState<ShiftFilter>('all');
  const [compareToPrevious, setCompareToPrevious] = useState<boolean>(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState<boolean>(false);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  // Timeframe target configuration
  const getTargetConfig = useCallback((tf: Timeframe) => {
    switch (tf) {
      case 'realtime':
        return { defaultVal: 20, min: 8, max: 32, step: 1, unit: 'cases / min' };
      case 'daily':
        return { defaultVal: 1100, min: 400, max: 2000, step: 50, unit: 'cases / hr' };
      case 'monthly':
        return { defaultVal: 20000, min: 8000, max: 35000, step: 500, unit: 'cases / day' };
      case 'yearly':
        return { defaultVal: 600000, min: 200000, max: 1000000, step: 25000, unit: 'cases / month' };
    }
  }, []);

  const config = getTargetConfig(timeframe);
  const [customTarget, setCustomTarget] = useState<number>(config.defaultVal);

  useEffect(() => {
    setCustomTarget(config.defaultVal);
    setSelectedShift('all');
  }, [timeframe, config.defaultVal]);

  // Quick increment / decrement
  const adjustTarget = (delta: number) => {
    setCustomTarget(prev => Math.max(config.min, Math.min(config.max, prev + delta)));
  };

  // Filter and decorate data points with previous period comparisons
  const processedData = useMemo(() => {
    return chartData
      .filter((point, index) => {
        if (selectedShift === 'all') return true;
        if (timeframe !== 'daily') return true;

        // Daily shift mapping: Shift A (06:00-14:00), Shift B (14:00-22:00), Shift C (22:00-06:00)
        if (selectedShift === 'shift_a') {
          return point.shiftA !== undefined || (index >= 0 && index <= 3);
        }
        if (selectedShift === 'shift_b') {
          return point.shiftB !== undefined || (index >= 4 && index <= 7);
        }
        if (selectedShift === 'shift_c') {
          return point.shiftC !== undefined || (index >= 8 && index <= 11);
        }
        return true;
      })
      .map((point, idx) => {
        // Deterministic previous period comparison curve
        const varianceFactor = 0.92 + ((idx % 4) * 0.035);
        const prevVolume = timeframe === 'realtime'
          ? Number((point.volume * varianceFactor).toFixed(1))
          : Math.round(point.volume * varianceFactor);
        return {
          ...point,
          previousVolume: prevVolume,
        };
      });
  }, [chartData, selectedShift, timeframe]);

  // Target attainment calculation
  const avgVolumeRaw = processedData.length > 0 
    ? processedData.reduce((acc, d) => acc + d.volume, 0) / processedData.length
    : 0;
  const avgVolume = timeframe === 'realtime'
    ? Number(avgVolumeRaw.toFixed(1))
    : Math.round(avgVolumeRaw);
  const pacingPercentage = customTarget > 0 ? Math.round((avgVolume / customTarget) * 100) : 0;
  const pacingDiff = Number((avgVolume - customTarget).toFixed(1));

  // Cases expected across one 8-hour shift for the active target unit
  const shiftTargetCases = timeframe === 'realtime'
    ? customTarget * 60 * 8
    : timeframe === 'daily'
      ? customTarget * 8
      : customTarget / 90;

  // Max scale calculation for YAxis and drag coordinator
  const maxDataVolume = processedData.length > 0 
    ? Math.max(...processedData.map(d => Math.max(d.volume, d.previousVolume || 0)))
    : 100;
  const yMax = Math.ceil(Math.max(maxDataVolume, customTarget) * 1.18);

  // Drag interaction to update target line
  const updateTargetFromClientY = useCallback((clientY: number) => {
    if (!chartWrapperRef.current) return;
    const rect = chartWrapperRef.current.getBoundingClientRect();
    const chartHeight = 240;
    const chartTopOffset = 25; // padding top inside wrapper

    const relY = clientY - rect.top - chartTopOffset;
    const clampedY = Math.max(0, Math.min(chartHeight, relY));

    // Invert Y coordinate to value scale
    const rawVal = ((chartHeight - clampedY) / chartHeight) * yMax;
    const clampedVal = Math.max(config.min, Math.min(config.max, rawVal));
    const rounded = Math.round(clampedVal / config.step) * config.step;
    setCustomTarget(rounded);
  }, [yMax, config.min, config.max, config.step]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTarget(true);
    updateTargetFromClientY(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDraggingTarget(true);
      updateTargetFromClientY(e.touches[0].clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingTarget) {
      updateTargetFromClientY(e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingTarget && e.touches.length > 0) {
      updateTargetFromClientY(e.touches[0].clientY);
    }
  };

  const handleDragEnd = () => {
    setIsDraggingTarget(false);
  };

  // Percentage height for drag handle position overlay
  const targetPct = Math.min(100, Math.max(5, (customTarget / yMax) * 100));
  const handleTopStyle = `${100 - targetPct}%`;

  return (
    <div className={`card ${styles.card}`}>
      
      {/* 1. Header & Live Attainment Badge */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <BarChart3 size={20} color="var(--accent)" />
            <h3 className={styles.title}>
              Throughput & Loading Cadence
            </h3>
          </div>
          <p className={styles.subtitle}>
            {timeframe === 'realtime' && 'Per-minute dispatch rate vs target'}
            {timeframe === 'daily' && '24-hour dispatch curve across shifts'}
            {timeframe === 'monthly' && 'Daily volume vs dispatch target'}
            {timeframe === 'yearly' && '12-month trend vs monthly quota'}
          </p>
        </div>

        <div className={styles.headerControls}>
          <StatusBadge
            kind={pacingPercentage >= 100 ? 'ok' : 'warning'}
            className={styles.pacingBadge}
          >
            Pacing {pacingPercentage}% ({pacingDiff >= 0 ? '+' : ''}{pacingDiff.toLocaleString()} {config.unit})
          </StatusBadge>
        </div>
      </div>

      {/* 2. Secondary Filter Bar: Shift Selectors & Previous Period Comparison */}
      <div className={styles.filterBar}>
        <div className={styles.shiftFilters}>
          <span className={styles.filterLabel}>Shift Focus:</span>
          <button 
            onClick={() => setSelectedShift('all')}
            className={`${styles.shiftBtn} ${selectedShift === 'all' ? styles.shiftBtnActive : ''}`}
          >
            All Shifts
          </button>
          <button 
            onClick={() => setSelectedShift('shift_a')}
            className={`${styles.shiftBtn} ${selectedShift === 'shift_a' ? styles.shiftBtnActive : ''}`}
          >
            Shift A (06-14)
          </button>
          <button 
            onClick={() => setSelectedShift('shift_b')}
            className={`${styles.shiftBtn} ${selectedShift === 'shift_b' ? styles.shiftBtnActive : ''}`}
          >
            Shift B (14-22)
          </button>
          <button 
            onClick={() => setSelectedShift('shift_c')}
            className={`${styles.shiftBtn} ${selectedShift === 'shift_c' ? styles.shiftBtnActive : ''}`}
          >
            Shift C (22-06)
          </button>
        </div>

        <label className={styles.compareToggle}>
          <input 
            type="checkbox"
            checked={compareToPrevious}
            onChange={(e) => setCompareToPrevious(e.target.checked)}
            className={styles.compareCheckbox}
          />
          <GitCompare size={14} color="var(--accent)" />
          <span>Compare to Prev. Period</span>
        </label>
      </div>

      {/* 3. Target Control Toolbar */}
      <div className={styles.targetToolbar}>
        <div className={styles.targetLabelGroup}>
          <Target size={18} color="var(--warn)" />
          <span className={styles.targetLabel}>
            SET PLANT TARGET:
          </span>
          <span className={`font-mono ${styles.targetValuePill}`}>
            {customTarget.toLocaleString()} <span className={styles.targetUnit}>{config.unit}</span>
          </span>
        </div>

        <div className={styles.targetControls}>
          <button 
            onClick={() => adjustTarget(-config.step)} 
            className={`btn-action btn-ghost ${styles.adjustBtn}`}
            title={`Decrease target by ${config.step}`}
            aria-label={`Decrease target by ${config.step}`}
          >
            <Minus size={14} />
          </button>
          
          <input 
            type="range" 
            min={config.min} 
            max={config.max} 
            step={config.step} 
            value={customTarget} 
            onChange={(e) => setCustomTarget(Number(e.target.value))}
            className={styles.rangeSlider}
            aria-label="Target adjustment range slider"
          />

          <button 
            onClick={() => adjustTarget(config.step)} 
            className={`btn-action btn-ghost ${styles.adjustBtn}`}
            title={`Increase target by ${config.step}`}
            aria-label={`Increase target by ${config.step}`}
          >
            <Plus size={14} />
          </button>

          <span className={styles.dragHint}>
            <MoveVertical size={13} color="var(--warn)" />
            <span>or drag line on chart</span>
          </span>
        </div>
      </div>

      {/* 4. Chart Area / States (Loading, Error, Empty, or Active Recharts) */}
      <div 
        ref={chartWrapperRef}
        className={`${styles.chartWrapper} ${isDraggingTarget ? styles.chartDragging : ''}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
      >
        {/* Loading State */}
        {isLoading && (
          <div className={styles.stateBox}>
            <Loader2 size={32} className={styles.stateIconSpinner} />
            <div className={styles.stateTitle}>Synchronizing PLC Throughput Telemetry...</div>
            <div className={styles.stateDesc}>Reading carton scanner counts from Modbus edge bridge</div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className={styles.stateBox}>
            <AlertTriangle size={32} className={styles.stateIconError} />
            <div className={styles.stateTitle}>Throughput Telemetry Unavailable</div>
            <div className={styles.stateDesc}>{errorMessage}</div>
            {onRetry && (
              <button onClick={onRetry} className={`btn-action btn-ghost ${styles.retryBtn}`}>
                <RotateCw size={13} />
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && processedData.length === 0 && (
          <div className={styles.stateBox}>
            <Inbox size={32} className={styles.stateIconEmpty} />
            <div className={styles.stateTitle}>No Carton Dispatch Records Found</div>
            <div className={styles.stateDesc}>
              No events match the selected shift filter ({selectedShift}) in this {timeframe} window.
            </div>
          </div>
        )}

        {/* Active Recharts Canvas with Draggable Target Overlay */}
        {!isLoading && !isError && processedData.length > 0 && (
          <>
            {/* Draggable Target Handle Overlay Pill */}
            <div 
              className={styles.dragHandleOverlay}
              style={{ top: handleTopStyle }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              title="Click and drag to adjust target quota"
            >
              <Target size={12} aria-hidden="true" />
              <span>{customTarget.toLocaleString()}</span>
              <MoveVertical size={12} aria-hidden="true" />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart 
                data={processedData} 
                margin={{ top: 20, right: 35, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="volumeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--chart-grid)" 
                />

                <XAxis 
                  dataKey="label" 
                  stroke="var(--text-muted)" 
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />

                <YAxis 
                  stroke="var(--text-muted)" 
                  domain={[0, yMax]}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(val: number) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`}
                  width={48}
                />

                <Tooltip 
                  content={<CustomTooltip unit={config.unit} target={customTarget} />} 
                />

                {/* Optional Range Brush for Zoom/Pan on Dense Data */}
                {timeframe !== 'realtime' && processedData.length > 10 && (
                  <Brush 
                    dataKey="label" 
                    height={24} 
                    stroke="var(--accent)" 
                    fill="var(--surface)"
                    tickFormatter={() => ''}
                  />
                )}

                {/* Compare to Previous Period Line */}
                {compareToPrevious && (
                  <Line 
                    type="monotone" 
                    dataKey="previousVolume" 
                    name="Previous Period"
                    stroke="var(--text-muted)" 
                    strokeWidth={1.8} 
                    strokeDasharray="4 4" 
                    dot={false}
                  />
                )}

                {/* Actual Volume Area */}
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  name="Cartons Dispatched"
                  stroke="var(--accent)" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#volumeAreaGradient)" 
                />

                {/* Movable Target Quota Reference Line */}
                <ReferenceLine 
                  y={customTarget} 
                  stroke="var(--warn)" 
                  strokeDasharray="6 3" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Accessible Legend */}
            <div className={styles.legendRow}>
              <div className={styles.legendItem}>
                <span className={styles.legendDotVolume}></span>
                <span>{timeframe === 'realtime' ? 'Actual Dispatch Rate' : 'Actual Dispatched Volume'}</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDotTarget}></span>
                <span style={{ color: 'var(--warn-text)' }}>Plant Target ({customTarget.toLocaleString()})</span>
              </div>
              {compareToPrevious && (
                <div className={styles.legendItem}>
                  <span className={styles.legendDotPrev}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Previous Period Baseline</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 5. Shift Performance Summary (Daily Context) */}
      <div className={styles.shiftGrid}>
        <div className={styles.shiftCard}>
          <div className={styles.shiftCardHeader}>
            <span className={styles.shiftName}>Shift A (Morning)</span>
            <span className={`badge badge-ok ${styles.shiftBadge}`}>
              <CheckCircle2 size={11} aria-hidden="true" />
              {Math.round((7840 / shiftTargetCases) * 100)}%
            </span>
          </div>
          <div className={styles.shiftVolume}>
            7,840 <span className={styles.shiftUnit}>cases</span>
          </div>
          <div className={styles.shiftSub}>06:00 - 14:00 • 11 Trucks</div>
        </div>

        <div className={styles.shiftCard}>
          <div className={styles.shiftCardHeader}>
            <span className={styles.shiftName}>Shift B (Evening)</span>
            <span className={`badge badge-info ${styles.shiftBadge}`}>
              <TrendingUp size={11} aria-hidden="true" />
              {Math.round((7980 / shiftTargetCases) * 100)}%
            </span>
          </div>
          <div className={`${styles.shiftVolume} ${styles.shiftVolumeCyan}`}>
            7,980 <span className={styles.shiftUnit}>cases</span>
          </div>
          <div className={styles.shiftSub}>14:00 - 22:00 • 10 Trucks</div>
        </div>

        <div className={styles.shiftCard}>
          <div className={styles.shiftCardHeader}>
            <span className={styles.shiftName}>Shift C (Night)</span>
            <StatusBadge kind="standby" className={styles.shiftBadge}>Upcoming</StatusBadge>
          </div>
          <div className={`${styles.shiftVolume} ${styles.shiftVolumeSlate}`}>
            2,630 <span className={styles.shiftUnit}>est.</span>
          </div>
          <div className={styles.shiftSub}>22:00 - 06:00 • 4 Scheduled</div>
        </div>
      </div>

    </div>
  );
};

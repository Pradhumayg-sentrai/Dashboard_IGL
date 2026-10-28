import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ChartDataPoint, Timeframe } from '../data/plantData';
import { 
  BarChart3, 
  Target, 
  Plus, 
  Minus, 
  MoveVertical,
  CheckCircle2, 
  AlertCircle,
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

  return (
    <div className={styles.tooltipCard}>
      <div className={styles.tooltipInterval}>
        Interval: <strong style={{ color: '#fff' }}>{label}</strong>
      </div>
      <div className={styles.tooltipVolume}>
        Volume: {currentVol.toLocaleString()} cases
      </div>
      {prevVol !== undefined && (
        <div className={styles.tooltipPrev}>
          Prev Period: {prevVol.toLocaleString()} cases ({currentVol >= prevVol ? '+' : ''}{(currentVol - prevVol).toLocaleString()})
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
        return { defaultVal: 100, min: 40, max: 160, step: 5, unit: 'cases / 5-min' };
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
        const prevVolume = Math.round(point.volume * varianceFactor);
        return {
          ...point,
          previousVolume: prevVolume,
        };
      });
  }, [chartData, selectedShift, timeframe]);

  // Target attainment calculation
  const avgVolume = processedData.length > 0 
    ? Math.round(processedData.reduce((acc, d) => acc + d.volume, 0) / processedData.length)
    : 0;
  const pacingPercentage = customTarget > 0 ? Math.round((avgVolume / customTarget) * 100) : 0;
  const pacingDiff = avgVolume - customTarget;

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
    <div className={`glass-card ${styles.card}`}>
      
      {/* 1. Header & Live Attainment Badge */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <BarChart3 size={20} color="#38bdf8" />
            <h3 className={styles.title}>
              Throughput & Loading Cadence
            </h3>
          </div>
          <p className={styles.subtitle}>
            {timeframe === 'realtime' && 'Live 5-minute carton dispatch rate vs dynamic target (Recharts Engine)'}
            {timeframe === 'daily' && '24-hour dispatch curve across Shifts A, B & C (Set Target/Hour)'}
            {timeframe === 'monthly' && 'Daily volume progression vs daily dispatch target (October)'}
            {timeframe === 'yearly' && '12-month seasonal dispatch trend vs monthly quota'}
          </p>
        </div>

        <div className={styles.headerControls}>
          {pacingPercentage >= 100 ? (
            <span className={`badge badge-emerald ${styles.pacingBadge}`}>
              <CheckCircle2 size={13} />
              Pacing {pacingPercentage}% (+{pacingDiff.toLocaleString()} {config.unit})
            </span>
          ) : (
            <span className={`badge badge-amber ${styles.pacingBadge}`}>
              <AlertCircle size={13} />
              Pacing {pacingPercentage}% ({pacingDiff.toLocaleString()} {config.unit})
            </span>
          )}
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
          <GitCompare size={14} color="#38bdf8" />
          <span>Compare to Prev. Period</span>
        </label>
      </div>

      {/* 3. Target Control Toolbar */}
      <div className={styles.targetToolbar}>
        <div className={styles.targetLabelGroup}>
          <Target size={18} color="#fbbf24" />
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
            <MoveVertical size={13} color="#fbbf24" />
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
              <span>🎯 {customTarget.toLocaleString()}</span>
              <MoveVertical size={12} />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart 
                data={processedData} 
                margin={{ top: 20, right: 35, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="volumeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255, 255, 255, 0.06)" 
                />

                <XAxis 
                  dataKey="label" 
                  stroke="var(--text-muted)" 
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
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
                    stroke="#38bdf8" 
                    fill="rgba(15, 23, 42, 0.9)"
                    tickFormatter={() => ''}
                  />
                )}

                {/* Compare to Previous Period Line */}
                {compareToPrevious && (
                  <Line 
                    type="monotone" 
                    dataKey="previousVolume" 
                    name="Previous Period"
                    stroke="#64748b" 
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
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#volumeAreaGradient)" 
                />

                {/* Movable Target Quota Reference Line */}
                <ReferenceLine 
                  y={customTarget} 
                  stroke="#f59e0b" 
                  strokeDasharray="6 3" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Accessible Legend */}
            <div className={styles.legendRow}>
              <div className={styles.legendItem}>
                <span className={styles.legendDotVolume}></span>
                <span>Actual Dispatched Volume</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDotTarget}></span>
                <span style={{ color: '#fbbf24' }}>Plant Target ({customTarget.toLocaleString()})</span>
              </div>
              {compareToPrevious && (
                <div className={styles.legendItem}>
                  <span className={styles.legendDotPrev}></span>
                  <span style={{ color: '#94a3b8' }}>Previous Period Baseline</span>
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
            <span className={`badge badge-emerald ${styles.shiftBadge}`}>
              {Math.round((7840 / (customTarget * 8)) * 100)}%
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
            <span className={`badge badge-cyan ${styles.shiftBadge}`}>
              {Math.round((7980 / (customTarget * 8)) * 100)}%
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
            <span className={`badge badge-slate ${styles.shiftBadge}`}>Upcoming</span>
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

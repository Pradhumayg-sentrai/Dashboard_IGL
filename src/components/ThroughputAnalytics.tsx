import React, { useState, useRef, useEffect } from 'react';
import type { ChartDataPoint, Timeframe } from '../data/plantData';
import { 
  BarChart3, 
  Target, 
  Plus, 
  Minus, 
  MoveVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ThroughputAnalyticsProps {
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
}

export const ThroughputAnalytics: React.FC<ThroughputAnalyticsProps> = ({ chartData, timeframe }) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [isDraggingTarget, setIsDraggingTarget] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Timeframe target configuration (Default, Min, Max, Step, Unit)
  const getTargetConfig = (tf: Timeframe) => {
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
  };

  const config = getTargetConfig(timeframe);
  const [customTarget, setCustomTarget] = useState<number>(config.defaultVal);

  // Update target when timeframe changes
  useEffect(() => {
    setCustomTarget(config.defaultVal);
  }, [timeframe]);

  // Dynamic chart scaling based on both volumes and current target
  const maxVolume = Math.max(...chartData.map(d => d.volume), customTarget) * 1.18;
  const chartHeight = 190;
  const chartWidth = 560;

  const getX = (index: number) => {
    return (index / (chartData.length - 1)) * (chartWidth - 70) + 40;
  };

  const getY = (val: number) => {
    return chartHeight - (val / maxVolume) * (chartHeight - 45) - 22;
  };

  // Convert SVG mouse Y to Target value
  const updateTargetFromMouseY = (clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relY = clientY - rect.top;
    const svgY = (relY / rect.height) * chartHeight;

    const rawVal = ((chartHeight - 22 - svgY) / (chartHeight - 45)) * maxVolume;
    const clamped = Math.max(config.min, Math.min(config.max, rawVal));
    const rounded = Math.round(clamped / config.step) * config.step;
    setCustomTarget(rounded);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTarget(true);
    updateTargetFromMouseY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingTarget) {
      updateTargetFromMouseY(e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingTarget(false);
  };

  // Quick increment / decrement
  const adjustTarget = (delta: number) => {
    setCustomTarget(prev => Math.max(config.min, Math.min(config.max, prev + delta)));
  };

  // Calculate actual average vs target attainment
  const avgVolume = Math.round(chartData.reduce((acc, d) => acc + d.volume, 0) / chartData.length);
  const pacingPercentage = Math.round((avgVolume / customTarget) * 100);
  const pacingDiff = avgVolume - customTarget;

  // Build SVG path for volume
  const points = chartData.map((d, i) => `${getX(i)},${getY(d.volume)}`).join(' ');
  const areaPoints = `${getX(0)},${chartHeight - 22} ${points} ${getX(chartData.length - 1)},${chartHeight - 22}`;
  const targetY = getY(customTarget);

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Title & Interactive Target Setter Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Throughput & Loading Cadence
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {timeframe === 'realtime' && 'Live 5-minute carton dispatch rate vs dynamic target'}
            {timeframe === 'daily' && '24-hour dispatch curve across Shifts A, B & C (Set Target/Hour)'}
            {timeframe === 'monthly' && 'Daily volume progression vs daily dispatch target (October)'}
            {timeframe === 'yearly' && '12-month seasonal dispatch trend vs monthly quota'}
          </p>
        </div>

        {/* Pacing Attainment Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pacingPercentage >= 100 ? (
            <span className="badge badge-emerald" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              <CheckCircle2 size={13} />
              Pacing {pacingPercentage}% (+{pacingDiff.toLocaleString()} {config.unit})
            </span>
          ) : (
            <span className="badge badge-amber" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              <AlertCircle size={13} />
              Pacing {pacingPercentage}% ({pacingDiff.toLocaleString()} {config.unit})
            </span>
          )}
        </div>
      </div>

      {/* Target Control Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'rgba(245, 158, 11, 0.08)', 
        border: '1px solid rgba(245, 158, 11, 0.25)', 
        padding: '10px 16px', 
        borderRadius: '10px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={18} color="#fbbf24" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>
            SET PLANT TARGET:
          </span>
          <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '6px' }}>
            {customTarget.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{config.unit}</span>
          </span>
        </div>

        {/* Target Adjuster Buttons & Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => adjustTarget(-config.step)} 
            className="btn-action btn-ghost" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px' }}
            title={`Decrease target by ${config.step}`}
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
            style={{ 
              accentColor: '#f59e0b', 
              cursor: 'pointer', 
              width: '120px',
              height: '5px'
            }} 
          />

          <button 
            onClick={() => adjustTarget(config.step)} 
            className="btn-action btn-ghost" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px' }}
            title={`Increase target by ${config.step}`}
          >
            <Plus size={14} />
          </button>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
            <MoveVertical size={13} color="#fbbf24" />
            <span>or drag line on chart</span>
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart with Movable Target Line */}
      <div 
        style={{ 
          position: 'relative', 
          background: 'rgba(0, 0, 0, 0.35)', 
          borderRadius: '12px', 
          padding: '16px 12px 10px',
          border: '1px solid var(--border-subtle)',
          userSelect: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          style={{ width: '100%', height: '210px', overflow: 'visible', cursor: isDraggingTarget ? 'ns-resize' : 'default' }}
        >
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
            </linearGradient>
            <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartHeight - pct * (chartHeight - 45) - 22;
            return (
              <line 
                key={idx} 
                x1="40" 
                y1={y} 
                x2={chartWidth - 15} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.06)" 
                strokeDasharray="4 4" 
              />
            );
          })}

          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#volumeGradient)" />

          {/* Actual Volume Line stroke */}
          <polyline 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="2.5" 
            points={points} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* MOVABLE TARGET LINE & DRAG HANDLE */}
          <g style={{ cursor: 'ns-resize' }} onMouseDown={handleMouseDown}>
            
            {/* Invisible thicker stroke for easy hover/grab */}
            <line 
              x1="35" 
              y1={targetY} 
              x2={chartWidth - 5} 
              y2={targetY} 
              stroke="transparent" 
              strokeWidth="20" 
            />

            {/* Glowing amber dashed target line */}
            <line 
              x1="35" 
              y1={targetY} 
              x2={chartWidth - 8} 
              y2={targetY} 
              stroke="#f59e0b" 
              strokeWidth={isDraggingTarget ? "2.5" : "1.8"} 
              strokeDasharray="6 3" 
              filter={isDraggingTarget ? "url(#amberGlow)" : undefined}
            />

            {/* Target Value Pill Pinned to the Right */}
            <g transform={`translate(${chartWidth - 120}, ${targetY - 11})`}>
              <rect 
                width="115" 
                height="22" 
                rx="6" 
                fill="#1e293b" 
                stroke="#f59e0b" 
                strokeWidth={isDraggingTarget ? "2" : "1"} 
              />
              <text 
                x="57" 
                y="15" 
                textAnchor="middle" 
                fill="#fbbf24" 
                fontSize="10" 
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                🎯 {customTarget.toLocaleString()} ⇅
              </text>
            </g>
          </g>

          {/* Interactive Volume Data Points */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const y = getY(d.volume);
            const isHovered = hoveredPoint?.label === d.label;

            return (
              <g 
                key={i} 
                onMouseEnter={() => !isDraggingTarget && setHoveredPoint(d)} 
                onMouseLeave={() => setHoveredPoint(null)} 
                style={{ cursor: 'pointer' }}
              >
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isHovered ? 6 : 3.5} 
                  fill={isHovered ? '#f8fafc' : '#0284c7'} 
                  stroke="#38bdf8" 
                  strokeWidth={isHovered ? 2.5 : 1.5} 
                />
                
                {/* X-axis labels */}
                {(chartData.length <= 15 || i % Math.ceil(chartData.length / 8) === 0) && (
                  <text 
                    x={x} 
                    y={chartHeight - 4} 
                    textAnchor="middle" 
                    fill="var(--text-muted)" 
                    fontSize="10" 
                    fontFamily="var(--font-mono)"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && !isDraggingTarget && (
          <div style={{ 
            position: 'absolute', 
            top: '12px', 
            left: '16px', 
            background: 'rgba(15, 23, 42, 0.95)', 
            border: '1px solid rgba(56, 189, 248, 0.3)', 
            padding: '8px 14px', 
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            fontSize: '0.78rem',
            pointerEvents: 'none'
          }}>
            <div style={{ color: 'var(--text-secondary)' }}>Interval: <strong style={{ color: '#fff' }}>{hoveredPoint.label}</strong></div>
            <div style={{ color: '#38bdf8', fontWeight: 600 }}>Volume: {hoveredPoint.volume.toLocaleString()} cases</div>
            <div style={{ color: '#fbbf24', fontSize: '0.72rem' }}>
              Target: {customTarget.toLocaleString()} ({((hoveredPoint.volume / customTarget) * 100).toFixed(0)}% of target)
            </div>
          </div>
        )}
      </div>

      {/* Shift Performance Summary (Daily context) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>Shift A (Morning)</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              {Math.round((7840 / (customTarget * 8)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
            7,840 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>cases</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>06:00 - 14:00 • 11 Trucks</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>Shift B (Evening)</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              {Math.round((7980 / (customTarget * 8)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-heading)' }}>
            7,980 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>cases</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>14:00 - 22:00 • 10 Trucks</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>Shift C (Night)</span>
            <span className="badge badge-slate" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Upcoming</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'var(--font-heading)' }}>
            2,630 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>est.</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>22:00 - 06:00 • 4 Scheduled</div>
        </div>

      </div>

    </div>
  );
};

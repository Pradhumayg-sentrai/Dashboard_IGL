import React from 'react';
import { Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts';
import type { ChartDataPoint, LiveBayState } from '../../data/plantData';
import { StatusBadge } from '../../components/StatusBadge';
import styles from './PlantPulse.module.css';

interface PlantPulseProps {
  bays: LiveBayState[];
  chartData: ChartDataPoint[];
  sampleMinutes?: number;
}

interface TrendPoint {
  label: string;
  value: number;
}

interface BayBar {
  bay: string;
  value: number;
  status: LiveBayState['status'];
  color: string;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BayBar }>;
}

const STATUS_COLOR: Record<LiveBayState['status'], string> = {
  loading: 'var(--ok)',
  stopped: 'var(--critical)',
  preparing: 'var(--warn)',
  standby: 'var(--text-muted)',
};

const STATUS_LABEL: Record<LiveBayState['status'], string> = {
  loading: 'Loading',
  stopped: 'Stopped',
  preparing: 'Preparing',
  standby: 'Standby',
};

const formatCompact = (value: number) => {
  if (value < 1000) return value.toLocaleString();
  return value % 1000 === 0
    ? `${value / 1000}k`
    : `${(value / 1000).toFixed(1)}k`;
};

const TrendTooltip: React.FC<TrendTooltipProps & { sampleMinutes: number }> = ({ active, payload, sampleMinutes }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>
        {point.label === 'now' ? 'Current sample' : `Sample ${point.label}`}
      </div>
      <div className={styles.tooltipValue}>
        {point.value.toLocaleString()} <span>cartons/hr</span>
      </div>
      <div className={styles.tooltipMeta}>{sampleMinutes}-minute sample</div>
    </div>
  );
};

const BarTooltip: React.FC<BarTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>Bay {point.bay}</div>
      <div className={styles.tooltipValue}>
        {point.value.toLocaleString()} <span>cartons/hr</span>
      </div>
      <div className={styles.tooltipMeta}>{STATUS_LABEL[point.status]}</div>
    </div>
  );
};

export const PlantPulse: React.FC<PlantPulseProps> = ({ bays, chartData, sampleMinutes = 1 }) => {
  const activeBays = bays.filter(
    bay => bay.status === 'loading' && bay.beltState === 'running',
  );
  const activeCount = activeBays.length;
  const scaleBays = Math.max(activeCount, 1);
  const currentRate = Math.round(
    activeBays.reduce((sum, bay) => sum + bay.paceCpm, 0) * 60,
  );
  const target = scaleBays * 1200;
  const onTarget = activeCount > 0 && currentRate >= target;

  const trendData: TrendPoint[] = chartData.map((point, index) => {
    const minutesAgo = (chartData.length - 1 - index) * sampleMinutes;
    return {
      label: minutesAgo === 0 ? 'now' : `-${minutesAgo}m`,
      value: Math.round(point.volume * scaleBays * 60),
    };
  });

  // Keep the final trend point aligned with the live fleet pace shown above.
  if (trendData.length > 0 && currentRate > 0) {
    trendData[trendData.length - 1] = {
      ...trendData[trendData.length - 1],
      value: currentRate,
    };
  }

  const trendMax = Math.max(
    2000,
    Math.ceil(
      (Math.max(target, ...trendData.map(point => point.value), 1) * 1.08) / 2000,
    ) * 2000,
  );

  const tickStep = Math.max(1, Math.round((trendData.length - 1) / 4));
  const trendTicks = trendData
    .filter((_, index) => index % tickStep === 0 || index === trendData.length - 1)
    .map(point => point.label);

  const trendYTicks = Array.from(
    { length: 5 },
    (_, index) => (trendMax / 4) * index,
  );

  const bayBars: BayBar[] = bays.map(bay => ({
    bay: `${bay.bayId}`,
    value: Math.round(bay.paceCpm * 60),
    status: bay.status,
    color: STATUS_COLOR[bay.status],
  }));

  const barMax = Math.ceil(
    (Math.max(1200, ...bayBars.map(bar => bar.value), 1) * 1.2) / 100,
  ) * 100;

  const barSummary = bayBars
    .map(bar => `Bay ${bar.bay}: ${bar.value} cartons per hour, ${STATUS_LABEL[bar.status]}`)
    .join('. ');

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <Activity size={18} color="var(--accent)" />
            <h2 className={styles.title}>Plant Pulse</h2>
            <StatusBadge kind={activeCount === 0 ? 'info' : onTarget ? 'ok' : 'warning'}>
              {activeCount === 0 ? 'Idle' : onTarget ? 'On target' : 'Below target'}
            </StatusBadge>
          </div>
          <p className={styles.subtitle}>
            {sampleMinutes}-min samples · last 60 min · {activeCount} active {activeCount === 1 ? 'bay' : 'bays'}
          </p>
        </div>

        <div className={styles.rateBlock}>
          <span className={styles.rateValue}>{currentRate.toLocaleString()}</span>
          <span className={styles.rateUnit}>cartons/hr</span>
          <span className={styles.rateTarget}>
            Target {target.toLocaleString()}
          </span>
        </div>
      </div>

      <div className={styles.charts}>
        <div className={styles.chartTile}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Fleet throughput</span>
            <span className={styles.chartMeta}>{sampleMinutes}-min samples</span>
          </div>

          <div
            className={styles.chartBox}
            role="img"
            aria-label={`Fleet throughput over the last 60 minutes. Current ${currentRate} cartons per hour, target ${target} cartons per hour.`}
          >
            {trendData.length > 0 ? (
              <div aria-hidden="true" className={styles.chartCanvas}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 6, right: 14, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="pulseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      ticks={trendTicks}
                      interval={0}
                      tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      width={32}
                      domain={[0, trendMax]}
                      ticks={trendYTicks}
                      interval={0}
                      tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                      tickFormatter={(value: number) => formatCompact(value)}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip content={<TrendTooltip sampleMinutes={sampleMinutes} />} />

                    <ReferenceLine
                      y={target}
                      stroke="var(--warn)"
                      strokeDasharray="5 4"
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      fill="url(#pulseAreaGradient)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.empty}>No throughput samples</div>
            )}
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotActual}`} />
              Actual
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dash} />
              Target {target.toLocaleString()}/hr
            </span>
          </div>
        </div>

        <div className={styles.chartTile}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Bay pace</span>
            <span className={styles.chartMeta}>Target 1,200/hr</span>
          </div>

          <div
            className={styles.chartBox}
            role="img"
            aria-label={`Bay pace in cartons per hour. ${barSummary}. Target 1,200 cartons per hour per bay.`}
          >
            <div aria-hidden="true" className={styles.chartCanvas}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bayBars}
                  margin={{ top: 14, right: 2, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="bay"
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis hide domain={[0, barMax]} />

                  <Tooltip
                    content={<BarTooltip />}
                    cursor={{ fill: 'var(--surface)' }}
                  />

                  <ReferenceLine
                    y={1200}
                    stroke="var(--warn)"
                    strokeDasharray="5 4"
                  />

                  <Bar
                    dataKey="value"
                    radius={[2, 2, 0, 0]}
                    minPointSize={2}
                    isAnimationActive={false}
                  >
                    {bayBars.map(bar => (
                      <Cell key={bar.bay} fill={bar.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: unknown) => formatCompact(Number(value))}
                      fill="var(--text-muted)"
                      fontSize={8}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotLoading}`} />
              Loading
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotStopped}`} />
              Stopped
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotPreparing}`} />
              Preparing
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotStandby}`} />
              Standby
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dash} />
              Target
            </span>
          </div>
        </div>
      </div>

      <span className={styles.srOnly}>
        Fleet throughput is derived from the active bay cadence and shown in
        cartons per hour over {sampleMinutes}-minute samples across the last 60 minutes. Current fleet pace is
        {' '}{currentRate.toLocaleString()} cartons per hour against a target of
        {' '}{target.toLocaleString()} cartons per hour.
      </span>
    </div>
  );
};

import { useLang } from '@/context/LanguageContext';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const { t } = useLang();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 20;
  const innerRadius = radius * 0.62;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedRotation = 0;
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const dashLength = fraction * circumference;
    const segment = {
      ...d,
      dashLength,
      gapLength: circumference - dashLength,
      rotation: accumulatedRotation,
      percentage: Math.round(fraction * 100),
    };
    accumulatedRotation += fraction * 360;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {total === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#E6E9EC"
              strokeWidth={size * 0.11}
            />
          ) : (
            segments.map((seg, i) => (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={size * 0.11}
                strokeDasharray={`${seg.dashLength} ${seg.gapLength}`}
                strokeDashoffset={-seg.rotation * (circumference / 360)}
                strokeLinecap="butt"
              />
            ))
          )}
          <circle cx={center} cy={center} r={innerRadius} fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{total}</span>
          <span className="text-xs text-muted">{t('Total', 'کل')}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-muted">{seg.label}</span>
            <span className="font-semibold text-ink">{seg.value}</span>
            <span className="text-xs text-muted/70">({seg.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}

export function BarChart({ data, maxValue }: BarChartProps) {
  const { t } = useLang();
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barHeight = 28;
  const gap = 10;
  const totalHeight = data.length * (barHeight + gap) - gap;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2.5">
        {data.map((d, i) => {
          const widthPercent = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 flex-shrink-0 truncate text-sm text-muted sm:w-32" title={d.label}>
                {d.label}
              </div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-brand-50">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: d.color || '#2D7D5A',
                  }}
                />
                <span className="absolute inset-y-0 end-2 flex items-center text-xs font-semibold text-ink">
                  {d.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {totalHeight === 0 && (
        <div className="py-8 text-center text-sm text-muted">{t('No data available', 'کوئی ڈیٹا دستیاب نہیں')}</div>
      )}
    </div>
  );
}

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function AreaChart({ data, height = 140, color = '#2D7D5A' }: AreaChartProps) {
  const { t } = useLang();
  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">{t('No data available', 'کوئی ڈیٹا دستیاب نہیں')}</div>;
  }

  const width = 100;
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = 8;
  const chartHeight = height - padding * 2;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: padding + chartHeight - (d.value / max) * chartHeight,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted">
        {data.map((d, i) => (
          <span key={i} className={i === 0 || i === data.length - 1 ? '' : 'hidden sm:inline'}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ data, color = '#2D7D5A', width = 80, height = 24 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * height,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

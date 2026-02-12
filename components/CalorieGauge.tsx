import React from 'react';

interface CalorieGaugeProps {
  netCalories: number;
  bmr: number;
  eaten: number;
  burned: number;
}

const CalorieGauge: React.FC<CalorieGaugeProps> = ({ netCalories, bmr }) => {
  const width = 200;
  const height = 120;
  const cx = width / 2;
  const cy = 100;
  const r = 72;
  const strokeWidth = 14;

  // Range: ±50% of BMR
  const cap = Math.round(bmr * 0.5);

  // Clamp net to [-cap, +cap]
  const clampedNet = Math.max(-cap, Math.min(cap, netCalories));
  const needleAngle = cap > 0 ? (clampedNet / cap) * 90 : 0;
  const isPinned = Math.abs(netCalories) > cap;
  const isDeficit = netCalories <= 0;

  // SVG angle mapping: our 0° (top) = SVG 270°
  const svgNeedleAngle = 270 + needleAngle;
  const arcStart = 180;
  const arcEnd = 360;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const polar = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const describeArc = (start: number, end: number, radius: number) => {
    const s = polar(start, radius);
    const e = polar(end, radius);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Active arc: from center (270°) toward needle
  const activeStart = isDeficit ? svgNeedleAngle : 270;
  const activeEnd = isDeficit ? 270 : svgNeedleAngle;

  // Needle tip
  const needleLen = r - 18;
  const tip = polar(svgNeedleAngle, needleLen);

  // Tapered needle (triangle) - wide base tapering to tip
  const baseHalfWidth = 4;
  const perpAngle = svgNeedleAngle + 90;
  const bL = { x: cx + baseHalfWidth * Math.cos(toRad(perpAngle)), y: cy + baseHalfWidth * Math.sin(toRad(perpAngle)) };
  const bR = { x: cx - baseHalfWidth * Math.cos(toRad(perpAngle)), y: cy - baseHalfWidth * Math.sin(toRad(perpAngle)) };
  const needlePath = `M ${bL.x} ${bL.y} L ${tip.x} ${tip.y} L ${bR.x} ${bR.y} Z`;

  // Colors
  const activeColor = isDeficit ? '#10b981' : '#f43f5e';
  const textColor = netCalories === 0 ? 'text-white' : isDeficit ? 'text-emerald-400' : 'text-rose-400';
  const pinnedTextColor = isDeficit ? 'text-emerald-300' : 'text-rose-300';

  // Unique ID for gradients
  const gradId = 'gauge-grad';
  const glowId = 'gauge-glow';
  const activeGradId = 'gauge-active-grad';

  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
        <defs>
          {/* Background arc gradient: green → gray → red */}
          <linearGradient id={gradId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#6b7280" stopOpacity="0.08" />
            <stop offset="55%" stopColor="#6b7280" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
          </linearGradient>

          {/* Active arc gradient */}
          <linearGradient id={activeGradId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={describeArc(arcStart, arcEnd, r)}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Active arc (glow layer) */}
        {Math.abs(clampedNet) > 0 && (
          <path
            d={describeArc(activeStart, activeEnd, r)}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            opacity={0.15}
            filter={`url(#${glowId})`}
          />
        )}

        {/* Active arc (main) */}
        {Math.abs(clampedNet) > 0 && (
          <path
            d={describeArc(activeStart, activeEnd, r)}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {/* Center tick mark (0 position at 12 o'clock) */}
        <line
          x1={polar(270, r + strokeWidth / 2 + 2).x}
          y1={polar(270, r + strokeWidth / 2 + 2).y}
          x2={polar(270, r + strokeWidth / 2 + 8).x}
          y2={polar(270, r + strokeWidth / 2 + 8).y}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />

        {/* Needle (tapered triangle) */}
        <path
          d={needlePath}
          fill="white"
          opacity={0.95}
          style={{
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))',
          }}
        />

        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r={6} fill="#1f2937" stroke="white" strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.6)" />

        {/* Endpoint labels */}
        <text
          x={polar(180, r + strokeWidth / 2 + 4).x - 2}
          y={polar(180, r + strokeWidth / 2 + 4).y}
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          fontWeight="500"
          textAnchor="end"
          dominantBaseline="middle"
        >
          −{cap}
        </text>

        {/* 0 label */}
        <text
          x={polar(270, r + strokeWidth / 2 + 16).x}
          y={polar(270, r + strokeWidth / 2 + 16).y}
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          0
        </text>

        <text
          x={polar(360, r + strokeWidth / 2 + 4).x + 2}
          y={polar(360, r + strokeWidth / 2 + 4).y}
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          fontWeight="500"
          textAnchor="start"
          dominantBaseline="middle"
        >
          +{cap}
        </text>

        {/* Subtle "deficit" / "surplus" labels */}
        <text
          x={polar(225, r + strokeWidth / 2 + 16).x}
          y={polar(225, r + strokeWidth / 2 + 16).y}
          fill="rgba(16,185,129,0.3)"
          fontSize="7"
          fontWeight="500"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          deficit
        </text>
        <text
          x={polar(315, r + strokeWidth / 2 + 16).x}
          y={polar(315, r + strokeWidth / 2 + 16).y}
          fill="rgba(244,63,94,0.3)"
          fontSize="7"
          fontWeight="500"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          surplus
        </text>
      </svg>

      {/* Center text below gauge */}
      <div className="flex flex-col items-center mt-1">
        <span className={`text-[26px] font-extrabold tracking-tight leading-none ${isPinned ? pinnedTextColor : textColor}`}>
          {netCalories > 0 ? '+' : ''}{netCalories}
        </span>
        <span className="text-[10px] text-gray-500 font-medium mt-0.5">net kcal</span>
      </div>
    </div>
  );
};

export default CalorieGauge;

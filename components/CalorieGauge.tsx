import React from 'react';

interface CalorieGaugeProps {
  netCalories: number;
  bmr: number;
  eaten: number;
  burned: number;
}

const CalorieGauge: React.FC<CalorieGaugeProps> = ({ netCalories, bmr, eaten, burned }) => {
  const width = 160;
  const height = 110;
  const cx = width / 2;
  const cy = 90;
  const r = 62;
  const strokeWidth = 10;

  // Range: ±50% of BMR
  const cap = Math.round(bmr * 0.5);

  // Clamp net to [-cap, +cap]
  const clampedNet = Math.max(-cap, Math.min(cap, netCalories));

  // Map clampedNet to angle: -90° (left, deficit) to +90° (right, surplus)
  // 0 net = 0° (12 o'clock / top)
  const needleAngle = (clampedNet / cap) * 90;

  // Arc helpers - draw from -90° to +90° (left to right, going over the top)
  // In SVG, 0° is 3 o'clock. We want our gauge from 9 o'clock (-180° SVG) to 3 o'clock (0° SVG)
  // going over the top (counter-clockwise visually but clockwise in SVG terms)
  // Actually let's think in terms of: 
  //   - Our "left" (9 o'clock) = SVG angle 180°
  //   - Our "top" (12 o'clock) = SVG angle 270° 
  //   - Our "right" (3 o'clock) = SVG angle 360°
  
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Arc from startAngle to endAngle (SVG angles, clockwise)
  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // Our gauge arc goes from 180° (left/9 o'clock) to 360° (right/3 o'clock)
  // passing through 270° (top/12 o'clock)
  const arcStart = 180; // 9 o'clock
  const arcEnd = 360;   // 3 o'clock

  // Background arc (full semi-circle)
  const bgArc = describeArc(arcStart, arcEnd);

  // Needle angle: convert from our system to SVG angle
  // Our 0 (top) = SVG 270°, our -90 (left) = SVG 180°, our +90 (right) = SVG 360°
  const svgNeedleAngle = 270 + needleAngle;
  const needleLength = r - 14;
  const needleTip = {
    x: cx + needleLength * Math.cos((svgNeedleAngle * Math.PI) / 180),
    y: cy + needleLength * Math.sin((svgNeedleAngle * Math.PI) / 180),
  };

  // Tick marks
  const ticks = [
    { value: -cap, label: `-${cap}`, svgAngle: 180 },
    { value: Math.round(-cap * 0.5), label: '', svgAngle: 225 },
    { value: 0, label: '0', svgAngle: 270 },
    { value: Math.round(cap * 0.5), label: '', svgAngle: 315 },
    { value: cap, label: `+${cap}`, svgAngle: 360 },
  ];

  // Create gradient stops for the arc
  // We'll draw multiple arc segments for the color gradient effect
  const segments = 40;
  const segmentArcs = [];
  for (let i = 0; i < segments; i++) {
    const startA = arcStart + (i / segments) * (arcEnd - arcStart);
    const endA = arcStart + ((i + 1) / segments) * (arcEnd - arcStart) + 0.5; // slight overlap
    // Map position to color: left = green, center = neutral, right = red
    const t = i / (segments - 1); // 0 to 1
    
    let r_c: number, g_c: number, b_c: number;
    if (t < 0.5) {
      // Green to neutral (gray/dim)
      const p = t / 0.5;
      r_c = Math.round(34 + (120 - 34) * p);
      g_c = Math.round(197 + (120 - 197) * p);
      b_c = Math.round(94 + (120 - 94) * p);
    } else {
      // Neutral to red
      const p = (t - 0.5) / 0.5;
      r_c = Math.round(120 + (239 - 120) * p);
      g_c = Math.round(120 + (68 - 120) * p);
      b_c = Math.round(120 + (68 - 120) * p);
    }

    segmentArcs.push({
      path: describeArc(startA, Math.min(endA, arcEnd)),
      color: `rgb(${r_c}, ${g_c}, ${b_c})`,
      opacity: 0.25,
    });
  }

  // Active/filled segments (highlight up to needle position)
  const activeSegments = [];
  const needlePosition = (svgNeedleAngle - arcStart) / (arcEnd - arcStart); // 0 to 1
  const centerPosition = 0.5; // 270° = center

  for (let i = 0; i < segments; i++) {
    const segStart = i / segments;
    const segEnd = (i + 1) / segments;
    const startA = arcStart + (i / segments) * (arcEnd - arcStart);
    const endA = arcStart + ((i + 1) / segments) * (arcEnd - arcStart) + 0.5;
    const t = i / (segments - 1);

    let isActive = false;
    if (netCalories <= 0) {
      // Deficit: highlight from needle to center (left portion)
      isActive = segStart >= needlePosition && segEnd <= centerPosition + 0.01;
    } else {
      // Surplus: highlight from center to needle (right portion)
      isActive = segStart >= centerPosition - 0.01 && segEnd <= needlePosition + (1 / segments);
    }

    if (isActive) {
      let r_c: number, g_c: number, b_c: number;
      if (t < 0.5) {
        const p = t / 0.5;
        r_c = Math.round(34 + (160 - 34) * p);
        g_c = Math.round(197 + (160 - 197) * p);
        b_c = Math.round(94 + (160 - 94) * p);
      } else {
        const p = (t - 0.5) / 0.5;
        r_c = Math.round(160 + (239 - 160) * p);
        g_c = Math.round(160 + (68 - 160) * p);
        b_c = Math.round(160 + (68 - 160) * p);
      }

      activeSegments.push({
        path: describeArc(startA, Math.min(endA, arcEnd)),
        color: `rgb(${r_c}, ${g_c}, ${b_c})`,
      });
    }
  }

  const isPinned = Math.abs(netCalories) > cap;

  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background arc segments (dim) */}
        {segmentArcs.map((seg, i) => (
          <path
            key={`bg-${i}`}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={seg.opacity}
          />
        ))}

        {/* Active/filled arc segments (bright) */}
        {activeSegments.map((seg, i) => (
          <path
            key={`active-${i}`}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={0.9}
          />
        ))}

        {/* Tick marks */}
        {ticks.map((tick, i) => {
          const outerR = r + strokeWidth / 2 + 2;
          const innerR = r + strokeWidth / 2 - 2;
          const rad = (tick.svgAngle * Math.PI) / 180;
          const outer = { x: cx + outerR * Math.cos(rad), y: cy + outerR * Math.sin(rad) };
          const inner = { x: cx + innerR * Math.cos(rad), y: cy + innerR * Math.sin(rad) };
          const labelR = r + strokeWidth / 2 + 12;
          const labelPos = { x: cx + labelR * Math.cos(rad), y: cy + labelR * Math.sin(rad) };
          return (
            <g key={`tick-${i}`}>
              <line
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}
              />
              {tick.label && (
                <text
                  x={labelPos.x} y={labelPos.y}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="8"
                  fontWeight="500"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {tick.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleTip.x} y2={needleTip.y}
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{
            transition: 'x2 0.6s ease-out, y2 0.6s ease-out',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
          }}
        />
        {/* Needle pivot circle */}
        <circle cx={cx} cy={cy} r={4} fill="white" opacity={0.9} />
        <circle cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.5)" />
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center" style={{ bottom: 2, left: '50%', transform: 'translateX(-50%)' }}>
        <span className={`text-2xl font-extrabold tracking-tight ${isPinned ? 'text-red-400' : 'text-white'}`}>
          {netCalories > 0 ? '+' : ''}{netCalories}
        </span>
        <span className="text-[10px] text-gray-400 font-medium -mt-0.5">net kcal</span>
      </div>
    </div>
  );
};

export default CalorieGauge;

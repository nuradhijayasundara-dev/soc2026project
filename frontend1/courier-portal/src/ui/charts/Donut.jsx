import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Donut chart drawn with SVG circles. Each segment is its own circle
 * (stroke-dasharray technique) so it can be hovered and show a native
 * browser tooltip. No chart library required.
 */
export default function Donut({
  data = [],
  size = 200,
  thickness = 24,
  centerTop,
  centerBottom,
  emptyLabel = 'No data yet',
}) {
  const [hover, setHover] = useState(-1);

  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);

  if (!total || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px dashed #C6D2E0`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94A3B8',
          }}
        >
          <Typography variant="body2" fontWeight={600}>{emptyLabel}</Typography>
        </Box>
      </Box>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 2;
  let acc = 0;
  const segments = data.map((d, i) => {
    const frac = (Number(d.value) || 0) / total;
    const start = acc;
    acc += frac;
    return { ...d, frac, start };
  });

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#EEF2F7"
              strokeWidth={thickness}
            />
            {segments.map((s, i) => {
              const len = Math.max(0, s.frac * circumference - gap);
              const inactive = hover !== -1 && hover !== i;
              return (
                <circle
                  key={`${s.label}-${i}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === i ? thickness + 4 : thickness}
                  strokeDasharray={`${len} ${circumference - len}`}
                  strokeDashoffset={-(s.start * circumference + gap / 2)}
                  style={{
                    transition: 'stroke-width .15s ease, opacity .15s ease',
                    opacity: inactive ? 0.35 : 1,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(-1)}
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
            })}
          </g>
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          {centerTop && <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.05 }}>{centerTop}</Typography>}
          {centerBottom && (
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{centerBottom}</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
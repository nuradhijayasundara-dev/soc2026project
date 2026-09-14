import React, { useId } from 'react';
import { Box, Typography } from '@mui/material';

const PAD = { top: 24, right: 48, bottom: 30, left: 8 };

/**
 * SVG area / line chart. Pure visual – no interactivity beyond native
 * <title> tooltips on each point.
 *
 * Props:
 *   series      [{ label, value }]  – value may be string|number
 *   color       stroke / fill colour (default #F59E0B)
 *   formatValue fn(number) → label shown on y-axis & tooltip (default: LKR compact)
 *   height      pixel height (default 260)
 */
export default function LineArea({
  series = [],
  color = '#F59E0B',
  formatValue = compactFormat,
  height = 260,
}) {
  const gradId = useId();
  if (series.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>No data in selected period</Typography>
      </Box>
    );
  }

  const W = 600;
  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const vals = series.map((d) => Number(d.value) || 0);
  const maxVal = Math.max(1, ...vals);
  const niceMax = niceCeil(maxVal);
  const ticks = niceTicks(niceMax, 4);

  const xAt = (i) => PAD.left + (i / Math.max(series.length - 1, 1)) * plotW;
  const yAt = (v) => PAD.top + plotH * (1 - Math.min(v, niceMax) / niceMax);

  const linePath = series
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(Number(s.value) || 0).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${xAt(series.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${xAt(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`;

  const xLabelStep = series.length <= 7 ? 1 : series.length <= 12 ? 2 : Math.ceil(series.length / 8);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} y1={yAt(t)} x2={W - PAD.right} y2={yAt(t)} stroke="#E5EAF2" strokeWidth="1" />
          <text x={W - PAD.right + 6} y={yAt(t) + 4} fill="#94A3B8" fontSize="10" fontFamily="Inter,Roboto,sans-serif">
            {formatValue(t)}
          </text>
        </g>
      ))}

      {/* x baseline */}
      <line x1={PAD.left} y1={PAD.top + plotH} x2={W - PAD.right} y2={PAD.top + plotH} stroke="#E5EAF2" strokeWidth="1" />

      {/* area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* dots + x labels */}
      {series.map((s, i) => (
        <g key={`${s.label}-${i}`}>
          <circle cx={xAt(i)} cy={yAt(Number(s.value) || 0)} r="4" fill="#fff" stroke={color} strokeWidth="2" style={{ cursor: 'default' }}>
            <title>{`${s.label}\n${formatValue(Number(s.value) || 0)}`}</title>
          </circle>
          {i % xLabelStep === 0 && (
            <text
              x={xAt(i)}
              y={PAD.top + plotH + 16}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10"
              fontFamily="Inter,Roboto,sans-serif"
            >
              {s.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ---------- helpers ---------- */

function compactFormat(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function niceCeil(v) {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const steps = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  const nice = steps.find((s) => s >= norm) || 10;
  return nice * mag;
}

function niceTicks(max, count = 4) {
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => {
    const raw = (step * i);
    const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    return Math.round(raw / (mag / 10)) * (mag / 10);
  }).filter((t) => t <= max * 1.01);
}
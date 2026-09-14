import React, { useId } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Vertical bar chart drawn with SVG rects. Quiet, dependency-free,
 * with native <title> tooltips on every bar.
 *
 * Props:
 *   data        [{ label, value }]
 *   color       bar colour (default #2563EB)
 *   formatValue fn(number) → label (default: plain number)
 *   height      px (default 260)
 */
export default function VerticalBars({
  data = [],
  color = '#2563EB',
  formatValue = (v) => String(v),
  height = 260,
}) {
  const gradId = useId();
  const W = 600;
  const PAD = { top: 20, right: 40, bottom: 30, left: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  if (data.length) {
    const vals = data.map((d) => Number(d.value) || 0);
    const maxVal = Math.max(1, ...vals);
    const niceMax = niceCeil(maxVal);
    const slot = plotW / data.length;
    const barW = Math.min(slot * 0.62, 46);
    const xLabelStep = data.length <= 8 ? 1 : data.length <= 14 ? 2 : Math.ceil(data.length / 10);

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            y1={PAD.top + plotH * (1 - f)}
            x2={W - PAD.right}
            y2={PAD.top + plotH * (1 - f)}
            stroke="#E5EAF2"
            strokeWidth="1"
          />
        ))}

        {data.map((d, i) => {
          const v = Number(d.value) || 0;
          const h = plotH * (v / niceMax);
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const y = PAD.top + plotH - h;
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={x} y={y} width={barW} height={Math.max(h, v > 0 ? 2 : 0)} rx="5" fill={`url(#${gradId})`} style={{ cursor: 'default' }}>
                <title>{`${d.label}: ${formatValue(v)}`}</title>
              </rect>
              {i % xLabelStep === 0 && (
                <text
                  x={x + barW / 2}
                  y={PAD.top + plotH + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="Inter,Roboto,sans-serif"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>No data in selected period</Typography>
    </Box>
  );
}

function niceCeil(v) {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const steps = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  return (steps.find((s) => s >= norm) || 10) * mag;
}
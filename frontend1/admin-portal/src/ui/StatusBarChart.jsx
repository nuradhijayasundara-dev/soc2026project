import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { statusColor } from './statusColors';

/**
 * Bar chart of a { STATUS: count } breakdown (exactly what every
 * /admin/stats endpoint returns for *ByStatus fields) — each bar colored to
 * match the STATUS's StatusChip tone, so the chart and the tables/chips
 * elsewhere in the portal read as one consistent color language.
 */
export default function StatusBarChart({ title, data, height = 240 }) {
  const rows = Object.entries(data || {}).map(([status, count]) => ({ status, count }));
  const hasData = rows.some((r) => r.count > 0);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      {!hasData ? (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">No data yet</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" vertical={false} />
            <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E5EAF2', fontSize: 12 }}
              cursor={{ fill: 'rgba(11,36,71,0.04)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
              {rows.map((r) => (
                <Cell key={r.status} fill={statusColor(r.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

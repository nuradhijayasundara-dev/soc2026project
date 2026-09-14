import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statusColor } from './statusColors';

/** Donut chart of a { STATUS: count } breakdown, colors matched to StatusChip. */
export default function StatusPieChart({ title, data, height = 240 }) {
  const rows = Object.entries(data || {})
    .map(([status, count]) => ({ status, count }))
    .filter((r) => r.count > 0);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      {rows.length === 0 ? (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">No data yet</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="status"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {rows.map((r) => (
                <Cell key={r.status} fill={statusColor(r.status)} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5EAF2', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

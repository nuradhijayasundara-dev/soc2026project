import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

/**
 * Dashboard metric card with an icon tile, value, label and optional subtitle.
 */
export default function StatCard({ icon, label, value, sub, accent = '#FFB020' }) {
  return (
    <Paper
      sx={{
        p: 2.25,
        height: '100%',
        transition: 'transform .15s ease, box-shadow .15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(16,24,40,0.10)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.02em' }}>
          {label}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h4">{value}</Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}
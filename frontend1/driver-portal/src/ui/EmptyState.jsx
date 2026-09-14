import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

/**
 * Friendly empty state for lists/tables with no data.
 */
export default function EmptyState({ icon, title = 'Nothing here yet', message }) {
  return (
    <Paper
      sx={{
        p: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderStyle: 'dashed',
        bgcolor: '#F0F7FD',
      }}
    >
      {icon && (
        <Box sx={{ color: '#B6C2D6', fontSize: 46, mb: 1.5, display: 'flex' }}>{icon}</Box>
      )}
      <Typography sx={{ fontWeight: 700, color: '#334155' }}>{title}</Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 420 }}>
          {message}
        </Typography>
      )}
    </Paper>
  );
}
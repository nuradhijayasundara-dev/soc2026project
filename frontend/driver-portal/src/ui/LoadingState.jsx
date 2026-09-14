import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <Box
      sx={{
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <CircularProgress size={32} thickness={4} sx={{ color: '#FFB020' }} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
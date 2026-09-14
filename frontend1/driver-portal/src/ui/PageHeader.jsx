import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * Consistent page heading: amber accent bar + title + optional subtitle,
 * with an optional action button on the right.
 */
export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 4, height: 34, borderRadius: 2, bgcolor: '#FFB020' }} />
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1.15 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action && actionLabel && (
        <Button variant="contained" color="primary" onClick={action} startIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
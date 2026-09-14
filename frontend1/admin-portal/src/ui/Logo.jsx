import React from 'react';
import { Box } from '@mui/material';

/**
 * Backhaul-Match logo mark: a truck-with-loop glyph (backhaul = the return
 * leg) on the platform's amber gradient badge. Used in the sidebar header
 * and reusable anywhere else the portal wants a compact brand mark.
 */
export default function Logo({ size = 36, radius = 10 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${radius}px`,
        background: 'linear-gradient(135deg, #FFB020, #F59E0B)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 10px rgba(245,158,11,0.35)',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 16V7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9M3 16h10M3 16a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0ZM14 10h4l3 3v3h-3"
          stroke="#081B36"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 4.5 4.5 6.5M4.5 6.5 6.5 8.5M4.5 6.5H10"
          stroke="#081B36"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}

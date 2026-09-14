import { createTheme } from '@mui/material/styles';

// Backhaul-Match "logistics platform" theme — shared look across every portal.
const NAVY = '#0B2447';
const NAVY_DARK = '#081B36';
const NAVY_LIGHT = '#123B73';
const AMBER = '#FFB020';
const AMBER_DARK = '#F59E0B';

const theme = createTheme({
  palette: {
    primary: { main: NAVY, light: NAVY_LIGHT, dark: NAVY_DARK },
    secondary: { main: AMBER, dark: AMBER_DARK, contrastText: NAVY_DARK },
    success: { main: '#16A34A' },
    error: { main: '#DC2626' },
    warning: { main: '#F59E0B' },
    info: { main: '#0284C7' },
    background: { default: '#E3EDF7', paper: '#F0F7FD' },
    divider: '#E5EAF2',
    text: { primary: '#14213D', secondary: '#5B6B84' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
    caption: { fontSize: '0.75rem' },
  },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: '#E3EDF7' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, padding: '0.55rem 1.15rem', boxShadow: 'none' },
        containedPrimary: {
          background: `linear-gradient(135deg, ${NAVY_LIGHT}, ${NAVY})`,
          '&:hover': { background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})` },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`,
          color: NAVY_DARK,
          '&:hover': { background: `linear-gradient(135deg, ${AMBER_DARK}, ${AMBER_DARK})` },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #E5EAF2',
          boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        },
      },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiCardContent: { styleOverrides: { root: { padding: '1.25rem' } } },
    MuiTableCell: {
      styleOverrides: {
        head: {
          background: '#EAF2FA',
          color: '#64748B',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #E5EAF2',
          padding: '0.7rem 1rem',
        },
        root: { borderBottom: '1px solid #ECF0F6', padding: '0.8rem 1rem', color: '#334155' },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:hover': { backgroundColor: '#EAF2FA !important' } } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 10, backgroundColor: '#F0F7FD' } },
      },
    },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiAutocomplete: { defaultProps: { size: 'small' } },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
        title: { fontWeight: 700 },
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#F0F7FD',
          color: '#14213D',
          boxShadow: '0 1px 0 rgba(16,24,40,0.06)',
        },
      },
    },
  },
});

export default theme;
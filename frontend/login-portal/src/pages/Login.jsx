import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Alert, Chip, Stack, InputAdornment,
  IconButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import apiClient from '../apiClient';
import { redirectAfterLogin } from '../portals';

const hintCardBorder = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFB800', borderWidth: 2 },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,184,0,0.6)' },
  },
  '& .MuiInputBase-input': { color: '#000000', '-webkit-text-fill-color': '#000000' },
  '& .MuiInputLabel-root': { color: '#334155' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0B2447' },
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const uname = username.trim();
    const pass = password.trim();
    if (!uname || !pass) {
      setError('Please enter both username and password.');
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.post('/auth/login', { username: uname, password: pass });
      const target = redirectAfterLogin(data.token, data.role);
      if (!target) {
        setError(`Unknown role "${data.role}" — cannot route you to a portal.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: '#0B2447',
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 4.5 },
          borderRadius: '20px',
          boxShadow: '0 30px 60px rgba(2,11,31,0.55)',
          backgroundColor: '#0B2447',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FFB800, #F59E0B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#081B36',
              fontSize: 18,
            }}
          >
            BM
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF' }}>
              Backhaul-Match
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12.5, letterSpacing: '.08em', fontWeight: 700 }}>
              LEARNED FREIGHT MARKETS
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          One account for the whole platform — sign in and we take you to your portal.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            sx={hintCardBorder}
            startAdornment={
              <InputAdornment position="start">
                <PersonIcon sx={{ color: '#FFB800', fontSize: 18 }} />
              </InputAdornment>
            }
          />
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            sx={hintCardBorder}
            startAdornment={
              <InputAdornment position="start">
                <LockIcon sx={{ color: '#FFB800', fontSize: 18 }} />
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                  sx={{ p: 0 }}
                >
                  {showPassword ? <VisibilityOffIcon sx={{ color: '#FFB800', fontSize: 18 }} /> : <VisibilityIcon sx={{ color: '#FFB800', fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            }
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.4,
              fontWeight: 700,
              textTransform: 'none',
              backgroundColor: '#FFB800',
              color: '#0B2447',
              borderRadius: 10,
              '&:hover': { backgroundColor: '#FFAB00' },
              '&:disabled': { backgroundColor: '#FFD980', color: '#0B2447' },
            }}
          >
            {loading ? 'Signing you in…' : 'Sign in'} <ArrowForwardIcon sx={{ ml: 1 }} />
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
          Not registered? <Link to="/register" style={{ color: '#FFB800', fontWeight: 700 }}>Create an account</Link>
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 1.75,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
            Demo accounts — password for all:{' '}
            <Typography component="span" sx={{ color: '#FFB800', fontWeight: 700 }}>Passw0rd!</Typography>
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.75 }}>
            {['demo_courier', 'demo_fleet', 'demo_driver', 'demo_admin'].map((u) => (
              <Chip
                key={u}
                size="small"
                icon={<PersonIcon sx={{ color: '#FFB800', fontSize: 14 }} />}
                label={u}
                sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
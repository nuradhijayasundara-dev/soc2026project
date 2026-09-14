import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Alert, MenuItem, FormControl,
  InputLabel, Select, FormHelperText,
} from '@mui/material';
import apiClient from '../apiClient';
import { ROLES } from '../portals';

const fieldStyle = {
  '& .MuiInputBase-input': { color: '#000000', '-webkit-text-fill-color': '#000000' },
  '& .MuiInputLabel-root': { color: '#334155' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0B2447' },
};

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'COURIER_USER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiClient.post('/auth/register', form);
      setSuccess('Account created. You can now sign in.');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Registration failed');
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
          maxWidth: 440,
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
              Create an account
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12.5, letterSpacing: '.08em', fontWeight: 700 }}>
              BACKHAUL-MATCH
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          One account, one role — the Login Portal routes you to the right system.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Username" fullWidth margin="normal" value={form.username}
            onChange={update('username')} required autoFocus sx={fieldStyle} />
          <TextField label="Email" type="email" fullWidth margin="normal" value={form.email}
            onChange={update('email')} required sx={fieldStyle} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={form.password}
            onChange={update('password')} required sx={fieldStyle} />
          <FormControl fullWidth margin="normal" sx={fieldStyle}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={update('role')}>
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
            <FormHelperText sx={{ color: '#B0BEC5' }}>This decides which portal you land in after sign-in.</FormHelperText>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.4,
              fontWeight: 700,
              backgroundColor: '#FFB800',
              color: '#0B2447',
              borderRadius: 10,
              '&:hover': { backgroundColor: '#FFAB00' },
              '&:disabled': { backgroundColor: '#FFD980', color: '#0B2447' },
            }}
          >
            {loading ? 'Creating…' : 'Register'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
          Already registered? <Link to="/" style={{ color: '#FFB800', fontWeight: 700 }}>Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
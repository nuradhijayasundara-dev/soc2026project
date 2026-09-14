import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Alert, Button, Chip, TextField, MenuItem, InputAdornment, Select,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import DataTable from '../ui/DataTable';

const ROLES = ['ADMIN', 'COURIER_USER', 'FLEET_MANAGER', 'DRIVER'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const load = () => {
    setLoading(true);
    apiClient.get('/auth/admin/users')
      .then((r) => setUsers(r.data))
      .catch(() => setError('Could not load users (is auth-service running?).'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleEnabled = async (user) => {
    setBusyId(user.id);
    setError('');
    try {
      await apiClient.patch(`/auth/admin/users/${user.id}/enabled`, { enabled: !user.enabled });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, enabled: !u.enabled } : u)));
    } catch {
      setError('Could not update user.');
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    setBusyId(user.id);
    setError('');
    try {
      await apiClient.patch(`/auth/admin/users/${user.id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
    } catch {
      setError('Could not change this user\'s role.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (u) => (
        <Select
          size="small"
          value={u.role}
          disabled={busyId === u.id}
          onChange={(e) => changeRole(u, e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
          {!ROLES.includes(u.role) && <MenuItem value={u.role}>{u.role}</MenuItem>}
        </Select>
      ),
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (u) => (
        <Chip
          size="small"
          label={u.enabled ? 'Enabled' : 'Disabled'}
          sx={{
            backgroundColor: u.enabled ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
            color: u.enabled ? '#16A34A' : '#DC2626',
            fontWeight: 700,
          }}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <Button
          size="small"
          color={u.enabled ? 'error' : 'success'}
          disabled={busyId === u.id}
          onClick={() => toggleEnabled(u)}
        >
          {u.enabled ? 'Disable' : 'Enable'}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="User Administration"
        subtitle="Manage accounts registered across the platform: search, filter, change roles and enable/disable access."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading users…" />}

      {!loading && (
        <>
          <Paper sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <TextField
              placeholder="Search by username or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="ALL">All roles</MenuItem>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </Paper>

          {filtered.length === 0 && (
            <EmptyState
              icon={<PeopleOutlineIcon fontSize="inherit" />}
              title="No matching users"
              message="No registered accounts match this search/filter."
            />
          )}

          {filtered.length > 0 && (
            <DataTable columns={columns} rows={filtered} />
          )}
        </>
      )}
    </Box>
  );
}

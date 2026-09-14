import React from 'react';
import { Table, TableHead, TableRow, TableBody, TableCell, Paper } from '@mui/material';

/**
 * Generic admin list table. Every Admin Portal management page (Courier
 * Companies, Fleet Companies, Trucks, Drivers, Shipments, Matching,
 * Bookings, Payments, Notifications, ...) renders its rows through this
 * instead of hand-rolling its own <Table>, so the look stays consistent
 * with the Users page this project already shipped.
 *
 * `columns`: [{ key, label, align, render?(row) }]
 *   - `render`, when given, controls the cell content; otherwise the cell
 *     falls back to `row[key]`.
 * The caller still owns loading/empty states (LoadingState/EmptyState) —
 * this component only renders once there are rows to show.
 */
export default function DataTable({ columns, rows, getRowKey = (row) => row.id, size = 'small' }) {
  return (
    <Paper sx={{ overflowX: 'auto' }}>
      <Table size={size}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={getRowKey(row)}
              hover
              sx={{ backgroundColor: i % 2 === 1 ? '#F0F7FD' : 'transparent' }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align}>
                  {col.render ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

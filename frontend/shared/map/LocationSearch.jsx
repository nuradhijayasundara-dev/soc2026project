import React, { useState } from 'react';
import { Autocomplete, TextField, CircularProgress, Box } from '@mui/material';
import { searchPlaces } from '../../lib/geo';

// SHARED component (both portals). Canonical copy: frontend/shared/map — edit there and
// re-sync to courier-portal/src/components/map and fleet-portal/src/components/map.

/**
 * Reusable address search (Nominatim/OSM autocomplete). Selection shape:
 *   { label, name, lat, lng }
 * Used by LocationPicker, and — on the Live Tracking page — to label the map.
 */
export default function LocationSearch({ label = 'Search place', onSelect, sx }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInput = async (value) => {
    if (!value || value.trim().length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      setOptions(await searchPlaces(value));
    } catch {
      setOptions([{ label: 'Search failed — try clicking the map instead', lat: null, lng: null }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={sx}>
      <Autocomplete
        fullWidth
        freeSolo
        options={options}
        getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
        filterOptions={(x) => x}
        onInputChange={(_, value) => handleInput(value)}
        onChange={(_, value) => {
          if (value && typeof value !== 'string' && value.lat != null) {
            onSelect(value);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="e.g. Kandy, Matale, Colombo..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress size={18} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
}
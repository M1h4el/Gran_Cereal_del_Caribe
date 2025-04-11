import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export default function AutoComplete({data, label, sx, onChange, value}) {
  return (
    <Autocomplete
      fullWidth
      disablePortal
      options={data}
      sx={sx}
      onChange={onChange}
      renderInput={(params) => <TextField {...params} label={label} />}
      value={value}
    />
  );
}
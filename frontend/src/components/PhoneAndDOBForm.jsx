import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

const PhoneAndDOBForm = ({ formData, onChange }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Datos de contacto</Typography>
      
      <TextField
        required
        name="phone"
        label="Número de teléfono"
        variant="outlined"
        fullWidth
        value={formData.phone}
        onChange={onChange}
      />

      <TextField
        name="dob"
        label="Fecha de nacimiento"
        type="date"
        variant="outlined"
        InputLabelProps={{ shrink: true }}
        fullWidth
        value={formData.dob}
        onChange={onChange}
      />
    </Box>
  );
};

export default PhoneAndDOBForm;
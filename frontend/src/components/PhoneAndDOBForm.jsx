import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

const PhoneAndDOBForm = ({ formData, onChange, error }) => {
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
        error={error.startsWith('Duplicate entry') ? true : false}
        helperText={error.startsWith('Duplicate entry') ? "El número telefónico digitado ya se encuentra registrado." : ""}
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
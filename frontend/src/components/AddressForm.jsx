import React from 'react';
import { TextField, Box, Typography, Button } from '@mui/material';
import RoomIcon from '@mui/icons-material/Room';

const AddressForm = ({ formData, onChange, onMapClick }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Dirección</Typography>
      
      <TextField
        name="country"
        label="País"
        variant="outlined"
        fullWidth
        value={formData.country}
        onChange={onChange}
      />

      <TextField
        name="region"
        label="Región"
        variant="outlined"
        fullWidth
        value={formData.region}
        onChange={onChange}
      />

      <TextField
        name="city"
        label="Ciudad"
        variant="outlined"
        fullWidth
        value={formData.city}
        onChange={onChange}
      />

      <TextField
        name="postalCode"
        label="Código Postal"
        variant="outlined"
        fullWidth
        value={formData.postalCode}
        onChange={onChange}
      />

      <TextField
        name="address"
        label="Dirección de domicilio"
        variant="outlined"
        fullWidth
        value={formData.address}
        onChange={onChange}
      />

      <Button
        variant="outlined"
        startIcon={<RoomIcon />}
        onClick={onMapClick}
        disabled
      >
        Integrar con mapa
      </Button>
    </Box>
  );
};

export default AddressForm;

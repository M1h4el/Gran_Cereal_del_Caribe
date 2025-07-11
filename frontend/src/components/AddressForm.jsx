import React, { useState } from "react";
import { TextField, Box, Typography, Button } from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import Modal from "./Modal";
import dynamic from "next/dynamic";

const MapWithSearch = dynamic(
  () => import("@/components/LeafletMaps/MapWithSearch"),
  {
    ssr: false,
  }
);

const AddressForm = ({ formData, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationType, setLocationType] = useState(false); // false = manual, true = actual

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLocationType(false);
  };

  const handleMapClick = () => {
    setLocationType(false); // modo manual
    setIsModalOpen(true);
  };

  const handleLocationSelect = ({
    lat,
    lon,
    country,
    city,
    neighborhood,
    address,
  }) => {
    // Actualiza el formData con todos los campos que recibes
    onChange({ target: { name: "lat", value: lat } });
    onChange({ target: { name: "lon", value: lon } });
    if (country) onChange({ target: { name: "country", value: country } });
    if (city) onChange({ target: { name: "city", value: city } });
    if (neighborhood)
      onChange({ target: { name: "neighborhood", value: neighborhood } });
    if (address) onChange({ target: { name: "address", value: address } });
    setLocationType(false);
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">Localización</Typography>

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
          label="Región/Departamento"
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
          name="neighborhood"
          label="Barrio/Sector"
          variant="outlined"
          fullWidth
          value={formData.neighborhood}
          onChange={onChange}
        />

        <TextField
          name="address"
          label="Dirección"
          variant="outlined"
          fullWidth
          value={formData.address}
          onChange={onChange}
        />

        <TextField
          name="postalCode"
          label="Código Postal (Opcional)"
          variant="outlined"
          fullWidth
          value={formData.postalCode}
          onChange={onChange}
        />

        <TextField
          name="description"
          label="Descripción (Opcional)"
          variant="outlined"
          fullWidth
          value={formData.description}
          onChange={onChange}
        />
          <Button
            variant="outlined"
            startIcon={<RoomIcon />}
            onClick={handleMapClick}
            disabled={!formData.country || !formData.city}
          >
            Ubicación Manual
          </Button>          
      </Box>

      <Modal open={isModalOpen} onClose={handleCloseModal}>
        {isModalOpen && (
          <MapWithSearch
            button={locationType}
            cityParam={formData.city}
            countryParam={formData.country}
            addressParam={formData.address}
            neighborhoodParam={formData.neighborhood}
            onClose={handleCloseModal}
            markerPosition={
              formData.lat && formData.lon
                ? [formData.lat, formData.lon]
                : undefined
            }
            onSelect={handleLocationSelect}
          />
        )}
      </Modal>
    </>
  );
};

export default AddressForm;

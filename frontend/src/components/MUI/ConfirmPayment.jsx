import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

function ConfirmPayment({ onCancel, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [details, setDetails] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const newErrors = {};

    if (!paymentMethod) newErrors.paymentMethod = "Requerido";
    if (!details.trim()) newErrors.details = "Requerido";
    if (!paymentType) newErrors.paymentType = "Requerido";
    if (paymentType === "parcial" && (!partialAmount || isNaN(partialAmount)))
      newErrors.partialAmount = "Monto válido requerido";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onConfirm({
        paymentMethod,
        details,
        paymentType,
        amount: paymentType === "parcial" ? parseFloat(partialAmount) : "total",
      });
    }
  };

  return (
    <Box sx={{ p: 3, width: "500px" }}>
      <Typography variant="h6" gutterBottom sx={{paddingBottom: "20px"}}>
        Confirmar Pago de Factura
      </Typography>
      <Grid container spacing={2} sx={{display: "flex", flexDirection: "column"}}>
        {/* Modalidad de Pago */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.paymentMethod} >
            <InputLabel>Modalidad de Pago</InputLabel>
            <Select
              value={paymentMethod}
              label="Modalidad de Pago"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="Nequi">Nequi</MenuItem>
              <MenuItem value="Banco">Banco</MenuItem>
              <MenuItem value="Efectivo">Efectivo</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Tipo de Pago */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.paymentType}>
            <InputLabel>Tipo de Pago</InputLabel>
            <Select
              value={paymentType}
              label="Tipo de Pago"
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <MenuItem value="total">Total</MenuItem>
              <MenuItem value="parcial">Parcial</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Monto en caso de parcial */}
        {paymentType === "parcial" && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Monto a abonar"
              type="number"
              fullWidth
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              error={!!errors.partialAmount}
              helperText={errors.partialAmount}
            />
          </Grid>
        )}

        {/* Detalles */}
        <Grid item xs={12}>
          <TextField
            label="Detalles de la Transacción"
            multiline
            rows={3}
            fullWidth
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            error={!!errors.details}
            helperText={errors.details}
          />
        </Grid>

        {/* Botones */}
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Button variant="outlined" color="error" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Confirmar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ConfirmPayment;

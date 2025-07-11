import React, { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [details, setDetails] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [amount, setAmount] = useState(0);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const newErrors = {};

    if (!selectedDate) newErrors.selectedDate = "Fecha requerida";
    if (!paymentMethod) newErrors.paymentMethod = "Requerido";
    if (!details.trim()) newErrors.details = "Requerido";
    if (!paymentType) newErrors.paymentType = "Requerido";
    if (paymentType === "parcial" && (!amount || isNaN(amount)))
      newErrors.amount = "Monto válido requerido";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onConfirm({
        date: selectedDate.format("YYYY-MM-DD"),
        paymentMethod,
        details,
        paymentType,
        amount: paymentType === "parcial" ? parseFloat(amount) : NaN,
      });
    }

    // Reset form fields after submission
    setSelectedDate(null);
    setPaymentMethod("");
    setDetails("");
    setPaymentType("");
    setAmount("");
    setErrors({});
  };

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Typography variant="h6" gutterBottom sx={{ paddingBottom: "20px" }}>
        Confirmar Pago de Factura
      </Typography>
      <Grid
        container
        spacing={2}
        sx={{ display: "flex", flexDirection: "column" }}
      >
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FormControl fullWidth error={!!errors.paymentMethod}>
              <DatePicker
                label="Selecciona una fecha"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                format="YYYY-MM-DD"
              />
            </FormControl>
          </LocalizationProvider>
        </Grid>
        {/* Modalidad de Pago */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.paymentMethod}>
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

        {paymentType === "parcial" && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Monto a abonar"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
            />
          </Grid>
        )}

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

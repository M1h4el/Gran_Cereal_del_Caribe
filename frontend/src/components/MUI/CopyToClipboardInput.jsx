import React, { useState } from "react";
import {
  InputAdornment,
  IconButton,
  OutlinedInput,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from "@mui/material";
import { PiCopySimpleDuotone, PiCopySimpleFill } from "react-icons/pi";

const CopyToClipboardField = ({ valueToCopy }) => {
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <>
      <FormControl sx={{ m: 1, width: "25ch" }} variant="outlined">
        <InputLabel
          htmlFor="outlined-adornment-password"
          sx={{
            color: "black",
            "&.Mui-focused": {
              color: "black",
            },
          }}
        >
          Código de invitación
        </InputLabel>
        <OutlinedInput
          value={valueToCopy}
          id="outlined-adornment-password"
          type="text"
          label="Código de invitación"
          sx={{
            backgroundColor: "#b0b0b0",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "black",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "black",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "black",
            },
          }}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="Copy to clipboard"
                onClick={handleCopy}
                edge="end"
              >
                {copied ? <PiCopySimpleDuotone /> : <PiCopySimpleFill />}
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>

      {/* Snackbar de confirmación */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          ¡Copiado al portapapeles!
        </Alert>
      </Snackbar>
    </>
  );
};

export default CopyToClipboardField;

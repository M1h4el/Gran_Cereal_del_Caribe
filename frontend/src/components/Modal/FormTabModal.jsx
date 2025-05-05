import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PhoneAndDOBForm from "../PhoneAndDOBForm";
import AddressForm from "../AddressForm";
import { useState } from "react";
import { fetchData } from "../../../utils/api";
import { useSession, signIn } from "next-auth/react";

const steps = ["Verificar Email", "Datos Personales", "Localización"];

export default function FormTabModal({
  onClose,
  user,
  statusUser,
  handleStatus,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    dob: "",
    country: "",
    region: "",
    city: "",
    postalCode: "",
    address: "",
  });

  console.log("useState error", error);

  console.log("formData", formData);

  const saveData = async () => {
    try {
      const res = await fetchData(`users?userId=${user.id}`, "PUT", formData);
      console.log("res desde el backend", res);
      if (res.message) {
        console.log("res:", res.message);
      } else {
        console.error(
          "Error en la respuesta del servidor:",
          res.error,
          res.statusText
        );
        setError(res.error);
      }
    } catch (err) {
      const errMsg = err?.message || String(err);
      console.error("Error al guardar los datos:", errMsg);
      setError(errMsg);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleMapClick = () => {
    console.log("Integrando con mapa con esta dirección:", formData.address);
    // Aquí podrías abrir un modal o componente de mapa (como Google Maps)
  };

  const isStepSkipped = (step) => skipped.has(step);

  const handleNext = (end) => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prev) => prev + 1);
    setSkipped(newSkipped);

    if (end) {
      saveData();
      if (statusUser && statusUser !== "confirmed") {
        handleStatus();
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      throw new Error("No puedes saltar un paso que no es opcional.");
    }

    setActiveStep((prev) => prev + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  /* const handleReset = () => {
    setActiveStep(0);
  }; */

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {activeStep === steps.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            {!error ? "Registro completado correctamente 🎉" : error.startsWith('Duplicate entry') ? "El número telefónico digitado ya se encuentra registrado." : error}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button
              color="inherit"
              disabled={error === ""}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >Atrás</Button>
            <Box sx={{ flex: "1 1 auto" }} />
            <Button variant="contained" color="primary" onClick={onClose}>
              Cerrar
            </Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Box sx={{ mt: 2, mb: 1 }}>
            {activeStep === 0 ? (
              <Typography>Verifica tu email para continuar.</Typography>
            ) : activeStep === 1 ? (
              <PhoneAndDOBForm formData={formData} onChange={handleChange} error={error}/>
            ) : (
              <AddressForm
                formData={formData}
                onChange={handleChange}
                onMapClick={handleMapClick}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0 || error === ""}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Atrás
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />
            <Button
              onClick={() => handleNext(activeStep === steps.length - 1)}
              variant="contained"
              disabled={error !== "" && activeStep == steps.length - 1}
            >
              {activeStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}

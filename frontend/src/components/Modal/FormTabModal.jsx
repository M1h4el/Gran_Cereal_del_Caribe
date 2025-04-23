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

const steps = ["Verificar Email", "Datos Personales", "Localización"];

export default function FormTabModal({ onClose, user }) {
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

  console.log("formData", formData);

  const saveData = async () => {
    try {
      const res = fetchData(`users?userId=${user.id}`, "PUT", formData);
    } catch (error) {
      console.error("Error al guardar los datos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapClick = () => {
    console.log("Integrando con mapa con esta dirección:", formData.address);
    // Aquí podrías abrir un modal o componente de mapa (como Google Maps)
  };

  const isStepOptional = (step) => null;
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

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Opcional</Typography>
            );
          }
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
            Registro completado correctamente 🎉
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
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
              <PhoneAndDOBForm formData={formData} onChange={handleChange} />
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
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Atrás
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                Omitir
              </Button>
            )}
            <Button
              onClick={() => handleNext(activeStep === steps.length - 1)}
              variant="contained"
            >
              {activeStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}

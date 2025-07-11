import React, { useEffect, useMemo, useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Autocomplete,
  Typography,
  Box,
  Paper,
  Grid,
} from "@mui/material";
import { fetchData } from "../../../utils/api";

const SupplyInventory = ({ arrayProducts }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isValidProductSelected, setIsValidProductSelected] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [currentProduct, setCurrentProduct] = useState({
    name: "",
    quantity: 1,
    price: 0,
    utility: 0,
  });

  console.log("Producto en Supply", products);

  const formatOptions = arrayProducts.map((product) => {
    const code = product.productCode;
    const name = product.name;
    const formattedOption = `${code} - ${name}`;
    return formattedOption;
  });

  const getFilteredOptions = useMemo(() => {
    const selectedCodes = products.map((p) => p.name.split(" - ")[0]);
    return formatOptions.filter((option) => {
      const optionCode = option.split(" - ")[0];
      return !selectedCodes.includes(optionCode);
    });
  }, [products, formatOptions]);

  const typeSoldNet = products.reduce((suma, product) => {
    return suma + product.price * product.quantity;
  }, 0);

  const typeUtilityNet = products.reduce((suma, product) => {
    return suma + product.utility * product.quantity;
  }, 0);

  const typeDebt = typeSoldNet - typeUtilityNet;

  useEffect(() => {
    const isValid = formatOptions.includes(currentProduct.name);
    setIsValidProductSelected(isValid);
  }, [currentProduct.name, formatOptions]);

  async function postingSupply(supply, aditionalData) {
    const newData = {
      supply: [...supply],
      ...aditionalData,
    };
    try {
      const postingSupply = fetchData("sucursales/supplyInventory", "POST", newData);

      if (!postingSupply.success) {
        console.log("Error",  error)
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    } catch (error) {
      console.error("Error registrando solicitud", error);
    }
  }

  const steps = ["Solicitar Productos", "Datos facturados", "Confirmación"];

  const handleNext = () => {
    switch (activeStep) {
      case 0:
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        break;

      case 1:
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        break;

      case 2:
        let aditionalData = {
          totalSold: typeSoldNet,
          totalDebt: typeDebt,
          totalUtility: typeUtilityNet,
        };
        postingSupply(products, aditionalData);
        break

      default:
        break;
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAddProduct = () => {
    setIsAddingProduct(true);
  };

  const handleSaveProduct = () => {
    if (currentProduct.name) {
      setProducts(prevData => [...prevData, currentProduct]);
      setCurrentProduct({ name: "", quantity: 1, price: 0 });
      setIsAddingProduct(false);
    }
  };

  const handleRemoveProduct = (index) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
    setIsAddingProduct(false);
  };

  const handleProductChange = (event, newValue, reason) => {
    const updatedProduct = {
      ...currentProduct,
      name: newValue,
    };

    if (reason === "selectOption" && newValue.includes(" - ")) {
      const productCode = newValue.split(" - ")[0];
      const productSelected = arrayProducts.find(
        (p) => p.productCode === productCode
      );

      if (productSelected) {
        updatedProduct.price = productSelected.baseSucursalPricing;
        updatedProduct.utility =
          (productSelected.BaseSellerPricing -
            productSelected.baseSucursalPricing) *
          currentProduct.quantity;
      }
    }

    setCurrentProduct(updatedProduct);
  };

  const priceDisplayed = (nameString, amount) => {
    if (!isValidProductSelected) return "Valor";

    const formatValue = nameString.split(" - ")[0];
    const productFound = arrayProducts.find(
      (product) => product.productCode === formatValue
    );

    if (!productFound) return "Producto no encontrado";

    // Calcular el precio total
    const totalPrice =
      Number(productFound.baseSucursalPricing) * Number(amount);

    // Formatear con puntos como separadores de miles
    return `$${totalPrice.toLocaleString("es-CO")}`;
  };

  const handleQuantityChange = (event) => {
    setCurrentProduct({
      ...currentProduct,
      quantity: parseInt(event.target.value) || 0,
    });
  };

  return (
    <Box sx={{ width: "1000px", padding: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ marginTop: 4 }}>
        {activeStep === 0 && (
          <Paper
            sx={{
              padding: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            {products.length === 0 && !isAddingProduct && (
              <Typography
                variant="h6"
                gutterBottom
                sx={{ width: "100%", marginBottom: "30px" }}
              >
                Añade un producto a tu orden
              </Typography>
            )}

            {!isAddingProduct ? (
              <Button
                variant="contained"
                onClick={handleAddProduct}
                disabled={isAddingProduct}
                sx={{ marginBottom: 3 }}
              >
                Agregar Producto
              </Button>
            ) : (
              <Box sx={{ marginBottom: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={getFilteredOptions}
                      value={currentProduct.name}
                      onInputChange={handleProductChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Producto"
                          variant="outlined"
                          sx={{ width: "450px" }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={currentProduct.quantity}
                      onChange={handleQuantityChange}
                      fullWidth
                      error={currentProduct.quantity < 1}
                      helperText={
                        currentProduct.quantity < 1
                          ? "El valor mínimo es 1"
                          : ""
                      }
                      InputProps={{
                        inputProps: {
                          min: 1,
                        },
                      }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TextField
                      value={priceDisplayed(
                        currentProduct.name,
                        currentProduct.quantity
                      )}
                      sx={{ width: "150px" }}
                    ></TextField>
                  </Grid>
                </Grid>

                <Box sx={{ marginTop: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProduct}
                    sx={{ marginRight: 2 }}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsAddingProduct(false)}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            )}

            {products.length > 0 && (
              <Box sx={{ marginTop: 3, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <th
                        style={{ textAlign: "left", padding: "12px", flex: 1 }}
                      >
                        Producto
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          width: "150px",
                        }}
                      >
                        Cantidad
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          width: "200px",
                        }}
                      >
                        Precio Unitario
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          width: "120px",
                        }}
                      >
                        Total
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          width: "180px",
                        }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const totalPrice = product.price * product.quantity;
                      return (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #e0e0e0",
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <td style={{ padding: "12px", textAlign: "left" }}>
                            {product.name}
                          </td>
                          <td style={{ textAlign: "right", padding: "12px" }}>
                            {product.quantity}
                          </td>
                          <td style={{ textAlign: "right", padding: "12px" }}>
                            ${Number(product.price).toLocaleString("es-CO")}
                          </td>
                          <td style={{ textAlign: "right", padding: "12px" }}>
                            ${totalPrice.toLocaleString("es-CO")}
                          </td>
                          <td style={{ textAlign: "center", padding: "12px" }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRemoveProduct(index)}
                              sx={{ minWidth: "90px" }}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Paper>
        )}

        {activeStep === 1 && (
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: "left" }}>
              Datos facturados
            </Typography>
            <hr />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "12px", flex: 1 }}>
                    Producto
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      width: "150px",
                    }}
                  >
                    Cantidad
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      width: "150px",
                    }}
                  >
                    Utilidad/Venta
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      width: "150px",
                    }}
                  >
                    Utilidad Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const totalPrice = product.price * product.quantity;
                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #e0e0e0",
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <td style={{ padding: "12px", textAlign: "left" }}>
                        {product.name}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px" }}>
                        {product.quantity}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px" }}>
                        ${product.utility.toLocaleString("es-CO")}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px" }}>
                        $
                        {Number(
                          product.utility * product.quantity
                        ).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Typography
                  variant="h6"
                  sx={{ textAlign: "left", marginTop: "10px" }}
                >
                  Total Venta
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ textAlign: "left", marginTop: "10px" }}
                >
                  Utilidad Neta
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ textAlign: "left", marginTop: "10px" }}
                >
                  Deuda Asociada
                </Typography>
              </div>
              <div>
                <Typography
                  variant="h6"
                  sx={{ textAlign: "right", marginTop: "10px" }}
                >{`$${typeSoldNet.toLocaleString("es-CO")}`}</Typography>
                <Typography
                  variant="h6"
                  sx={{ textAlign: "right", marginTop: "10px" }}
                >{`$${typeUtilityNet.toLocaleString("es-CO")}`}</Typography>
                <Typography
                  variant="h6"
                  sx={{ textAlign: "right", marginTop: "10px" }}
                >{`$${typeDebt.toLocaleString("es-CO")}`}</Typography>
              </div>
            </div>
          </Paper>
        )}

        {activeStep === 2 && (
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom align="left">
              Confirmación
            </Typography>
            <Typography align="left">
              Verifique los datos suministrados antes de completar el registro
              de abastecimiento.
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ marginRight: 1 }}>
              Atrás
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === 0 && products.length === 0}
          >
            {activeStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SupplyInventory;

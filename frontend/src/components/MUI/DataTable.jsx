"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import DataTableBase from "react-data-table-component";
import { Autocomplete, Box, LinearProgress, TextField } from "@mui/material";
import { fetchData } from "../../../utils/api";

const validateRows = (rows) => {
  const requiredFields = ["product", "quantity", "unitPrice", "total"];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    for (let field of requiredFields) {
      const value = row[field];

      // Validación específica para el campo 'product'
      if (field === "product") {
        const isValidProduct =
          value &&
          ((typeof value === "object" &&
            value.label &&
            value.label.trim() !== "") ||
            (typeof value === "string" && value.trim() !== "") ||
            typeof value === "number");

        if (!isValidProduct) {
          console.warn(
            `Fila ${i + 1}: el campo "product" está vacío o incompleto`,
            row
          );
          return false;
        }

        continue;
      }

      // Validación general para los demás campos
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && isNaN(value));

      if (isEmpty) {
        console.warn(
          `Fila ${i + 1}: el campo "${field}" está vacío o incompleto`,
          row
        );
        return false;
      }
    }
  }

  return true;
};

export default function DataTable({
  rows,
  columns,
  options,
  dataInvoice,
  openModal,
  loadingDetails,
  updating,
}) {
  const [tableRows, setTableRows] = useState(rows);
  const [originalRows, setOriginalRows] = useState(rows);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const style = {
    h2: {
      fontSize: "2rem",
      fontWeight: "bold",
      margin: "30px 0",
    },
    h3: {
      fontSize: "1.2rem",
      marginBottom: "10px",
      fontWeight: "normal",
      color: "#333",
    },
  };

  const getModifiedRows = () => {
    return tableRows.filter((row) => {
      const original = originalRows.find(
        (orig) => String(orig.id) === String(row.id)
      );
      if (!original) return true;

      for (let key in row) {
        const rowValue = row[key];
        const originalValue = original[key];

        if (key === "product") {
          const currentLabel = rowValue?.label || rowValue;
          const originalLabel = originalValue?.label || originalValue;
          if (currentLabel !== originalLabel) {
            return true;
          }
          continue;
        }

        const isObject =
          rowValue !== null &&
          typeof rowValue === "object" &&
          originalValue !== null &&
          typeof originalValue === "object";

        if (isObject) {
          if (JSON.stringify(rowValue) !== JSON.stringify(originalValue)) {
            console.log(`Cambio detectado en ${key}:`, rowValue, originalValue);
            return true;
          }
        } else {
          if (rowValue !== originalValue) {
            console.log(`Cambio detectado en ${key}:`, rowValue, originalValue);
            return true;
          }
        }
      }

      return false;
    });
  };

  useEffect(() => {
    setTableRows(rows);
    setOriginalRows(rows);
  }, [rows]);

  const handleAdd = () => {
    setTableRows((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`, // ID temporal para distinguir las nuevas
        product: "",
        quantity: 0,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleEdit = () => {
    if (!isEditing) {
      setOriginalRows(JSON.parse(JSON.stringify(tableRows))); // Hacemos una copia profunda de las filas originales
      setIsEditing(true);
      setSelectedRows([]); // Limpiamos la selección al entrar en modo edición
    } else {
      setTableRows(originalRows); // Restauramos si ya está en edición
      setIsEditing(false);
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    const isValid = validateRows(tableRows);

    if (!isValid) {
      alert(
        "Por favor, completa todos los campos obligatorios antes de guardar."
      );
      return;
    }

    openModal("¿Deseas guardar los cambios?", async () => {
      const changedRows = getModifiedRows();

      const rowsToSend = changedRows.map((row) => {
        let productLabel = row.product;

        if (typeof productLabel === "object" && productLabel !== null) {
          productLabel = productLabel.label || "";
        }

        return {
          ...row,
          product: productLabel,
        };
      });

      const res = await fetchData(
        `invoices/${dataInvoice?.invoice_id}/details`,
        "PUT",
        {
          data: rowsToSend,
        }
      );

      if (res.error) {
        console.error("Error al guardar cambios:", res.error);
        return;
      }

      setOriginalRows(tableRows);
      setIsEditing(false);
      setSelectedRows([]);
    });
  };

  const handleDelete = async () => {
    if (selectedRows.length === 0) return;

    // Filas que tienen ID temporal (no se deben enviar al backend)
    const tempRowsToDelete = selectedRows.filter((row) =>
      String(row.id).startsWith("temp")
    );

    // Filas originales que existen en la base de datos
    const originalRowsToDelete = selectedRows.filter(
      (row) =>
        !String(row.id).startsWith("temp") &&
        originalRows.find((orig) => String(orig.id) === String(row.id))
    );

    const deleteSelectedRows = async () => {
      const newRows = tableRows.filter(
        (row) => !selectedRows.some((sel) => sel.id === row.id)
      );
      setTableRows(newRows);
      setSelectedRows([]);

      if (originalRowsToDelete.length > 0) {
        const idsToDelete = originalRowsToDelete.map((row) => row.id);

        const res = await fetchData(
          `invoices/${dataInvoice?.invoice_id}/details`,
          "DELETE",
          {
            data: idsToDelete,
          }
        );

        if (res.error) {
          console.error("Error al eliminar en el backend:", res.error);
        } else {
          // Actualizamos las filas originales
          const updatedOriginalRows = originalRows.filter(
            (row) => !idsToDelete.includes(row.id)
          );
          setOriginalRows(updatedOriginalRows);
          setTableRows(newRows);
          console.log("Filas eliminadas en el backend:", idsToDelete);
        }
      }
    };

    if (originalRowsToDelete.length > 0) {
      openModal(
        "¿Estás seguro de que deseas eliminar los elementos seleccionados?",
        deleteSelectedRows
      );
    } else {
      deleteSelectedRows(); // solo hay filas temporales, no necesita confirmación
    }
  };

  const handleRowChange = useCallback((rowIndex, field, value) => {
    setTableRows((prevRows) => {
      const updatedRows = [...prevRows];
      const updatedRow = { ...updatedRows[rowIndex] };

      updatedRow[field] = value;

      if (field === "product") {
        const selectedProduct = options.find(
          (opt) => opt.label === value?.label || opt.label === value
        );
        updatedRow.unitPrice = selectedProduct?.price || 0;
      }

      const qty = Number(updatedRow.quantity) || 0;
      const price = Number(updatedRow.unitPrice) || 0;
      updatedRow.total = qty * price;

      updatedRows[rowIndex] = updatedRow;

      return updatedRows;
    });
  }, [options, tableRows]);

  const customColumns = useMemo(() => {
    return columns.map((col) => ({
      name: col.name,
      selector: (row) => row[col.field],
      sortable: true,
      grow: col.flex || 1,
      right: col.right,
      cell: (row, rowIndex) =>
        col.editable && isEditing ? (
          col.type === "autocomplete" ? (
            <Autocomplete
              disableClearable
              value={
                typeof row[col.field] === "object"
                  ? row[col.field]
                  : options.find((opt) => opt.label === row[col.field]) || null
              }
              onChange={(_, newValue) =>
                handleRowChange(rowIndex, col.field, newValue)
              }
              options={options.filter((opt) => {
                const selectedLabels = tableRows
                  .filter((_, idx) => idx !== rowIndex) // ignorar la fila actual
                  .map((r) =>
                    typeof r.product === "object" ? r.product.label : r.product
                  );

                return !selectedLabels.includes(opt.label);
              })}
              getOptionLabel={(option) => option.label || ""}
              renderInput={(params) => (
                <TextField {...params} variant="standard" />
              )}
              size="medium"
              sx={{ width: "100%" }}
            />
          ) : (
            <TextField
              type={col.type === "number" ? "number" : "text"}
              value={row[col.field]}
              onChange={(e) =>
                handleRowChange(rowIndex, col.field, e.target.value)
              }
              variant="outlined"
              size="small"
              sx={{ input: { padding: "4px", width: "70px" } }} // Para imitar el padding anterior
            />
          )
        ) : col.format ? (
          col.format(row[col.field])
        ) : typeof row[col.field] === "object" && row[col.field] !== null ? (
          row[col.field].label ||
          row[col.field].name ||
          JSON.stringify(row[col.field])
        ) : (
          row[col.field]
        ),
    }));
  }, [columns, isEditing, options, tableRows]);

  const totalSum = useMemo(() => {
    let tot = tableRows.reduce((sum, row) => {
      const value = parseFloat(row.total);

      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    updating(tot);

    const formatValue = (value) =>
      `$${Number(value || 0).toLocaleString("es-CL", {
        minimumFractionDigits: 0,
      })}`;

    const newTotal = formatValue(tot);

    return newTotal;
  }, [tableRows]);

  console.log("SubTotal", totalSum);

  return (
    <Paper sx={{ padding: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: "1400px",
          height: "auto",
          marginBottom: 2,
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="contained"
          color={isEditing ? "error" : "primary"}
          onClick={handleEdit}
          disabled={tableRows.length === 0 ? true : false}
        >
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={!isEditing}
          >
            Guardar cambios
          </Button>
          <Button variant="contained" onClick={handleAdd} disabled={!isEditing}>
            Agregar
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={!isEditing || selectedRows.length === 0}
          >
            Eliminar Seleccionados
          </Button>
        </div>
      </Stack>

      <DataTableBase
        columns={customColumns}
        data={tableRows}
        selectableRows={isEditing}
        onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
        pagination
        highlightOnHover
        dense
        progressPending={loadingDetails}
        progressComponent={
          <Box sx={{ width: "100%" }}>
            <LinearProgress />
          </Box>
        }
        fixedHeader
        fixedHeaderScrollHeight="400px"
        customStyles={{
          rows: {
            style: {
              minHeight: "10px", // override the row height
            },
          },
          headCells: {
            style: {
              minHeight: "50px", // override the row height for head cells
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#333",
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #ddd",
              borderTop: "1px solid #ddd",
              borderLeft: "1px solid #ddd",
              borderRight: "1px solid #ddd",
              "&:first-child": {
                borderLeft: "none",
              },
              "&:last-child": {
                borderRight: "none",
              },
              "&:hover": {
                backgroundColor: "#e0e0e0",
              },
              "&:active": {
                backgroundColor: "#ccc",
              },
              "&:focus": {
                backgroundColor: "#ccc",
              },
              "&:focus-within": {
                backgroundColor: "#ccc",
              },
              "&:focus-visible": {
                backgroundColor: "#ccc",
              },
              paddingLeft: "8px", // override the cell padding for head cells
              paddingRight: "8px",
            },
          },
          cells: {
            style: {
              paddingLeft: "8px", // override the cell padding for data cells
              paddingRight: "8px",
              minHeight: "50px", // override the cell padding for data cells
            },
          },
        }}
        noDataComponent={
          <div
            style={{
              height: "400px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: "30px",
            }}
          >
            <h2 style={{ textAlign: "center", color: "GrayText" }}>
              Personaliza tu carrito de compras.
            </h2>
            <Button
              variant="contained"
              style={{ width: "150px", height: "50px", fontSize: "18px" }}
              onClick={() => {
                handleAdd();
                setIsEditing(true);
              }}
            >
              Agregar
            </Button>
          </div>
        }
      />
      <h3 style={style.h3}>Sub Total: {totalSum}</h3>
      <h3 style={style.h3}>Descuento: %{0}</h3>
      <hr />
      <h2 style={style.h2}>Total Neto: {totalSum}</h2>
    </Paper>
  );
}

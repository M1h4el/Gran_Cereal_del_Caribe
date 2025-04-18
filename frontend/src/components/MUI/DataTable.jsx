"use client";

import React, { useEffect, useMemo, useState } from "react";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import DataTableBase from "react-data-table-component";
import { Autocomplete, TextField } from "@mui/material";
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
  closeModal,
}) {
  const [tableRows, setTableRows] = useState(rows);
  const [originalRows, setOriginalRows] = useState(rows);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  console.log("dataInvoice:", dataInvoice);

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
            console.log(
              "Cambio detectado en product:",
              currentLabel,
              originalLabel
            );
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
    console.log("tabla actualizada", tableRows);
  }, [tableRows]);

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

  const handleDelete = () => {
    if (selectedRows.length === 0) return;
  
    openModal("¿Estás seguro de que deseas eliminar los elementos seleccionados?", () => {
      const newRows = tableRows.filter(
        (row) => !selectedRows.some((sel) => sel.id === row.id)
      );
      setTableRows(newRows);
      setSelectedRows([]);
    });
  };

  const handleRowChange = (rowIndex, field, value) => {
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
  };

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
            <input
              type={col.type === "number" ? "number" : "text"}
              value={row[col.field]}
              onChange={(e) =>
                handleRowChange(rowIndex, col.field, e.target.value)
              }
              style={{ width: "100%", padding: "4px" }}
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
            Eliminar seleccionados
          </Button>
        </div>
      </Stack>

      <DataTableBase
        columns={customColumns}
        data={tableRows}
        selectableRows
        onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
        pagination
        highlightOnHover
        dense
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
      />
      <div>Sub Total: ${dataInvoice.total_net}</div>
      <div>Descuento: %{dataInvoice.discount || "0"}</div>
      <div>Total Neto: ${dataInvoice.total_net}</div>
    </Paper>
  );
}

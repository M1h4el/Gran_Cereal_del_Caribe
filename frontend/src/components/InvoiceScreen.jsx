"use client";

import React, { useEffect, useState } from "react";
import { fetchData } from "../../utils/api";
import "@/styles/InvoiceScreen.scss";
import DataTable from "./MUI/DataTable";
import { Autocomplete, TextField } from "@mui/material";

const formatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function InvoiceScreen({ data, products }) {
  const [invoiceDetails, setInvoiceDetails] = useState([]);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const invoiceId = data?.invoice_id;
        if (!invoiceId) return;

        const res = await fetchData(`invoices/${invoiceId}/details`, "GET");

        const formatted = res.map((item, index) => ({
          id: item?.idinvoice_detail ?? index, // necesario para DataGrid
          idinvoice_detail: item?.idinvoice_detail,
          product: `${item?.productCode} - ${item?.name}`,
          quantity: item?.quantity,
          unitPrice: item?.unitPrice,
          subTotal: item?.subTotal,
          created_at: formatter.format(new Date(item.created_at)),
          updated_at: formatter.format(new Date(item.updated_at)),
        }));

        setInvoiceDetails(formatted);
      } catch (error) {
        console.error("Error al obtener detalles de factura:", error);
      }
    };

    fetchInvoiceDetails();
  }, [data]);

  const productOptions = products.map((p) => ({
    ...p,
    label: `${p.productCode} - ${p.name}`,
  }));


  const columns = [
    {
      field: "product",
      headerName: "Producto",
      width: 400,
      editable: true,
      flex: 1,
      renderEditCell: (params) => {
        return (
          <Autocomplete
            options={productOptions}
            value={
              productOptions.find((opt) => opt.label === params.value) || null
            }
            onChange={(event, newValue) => {
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: newValue?.label || "",
              });
            }}
            renderInput={(paramsInput) => (
              <TextField
                {...paramsInput}
                variant="standard"
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    padding: "0 20px",
                    height: "100%",
                    fontSize: "1rem", // 👈 tamaño de fuente aquí
                  },
                  "& input": {
                    padding: "4px 8px",
                    fontSize: "0.85rem", // 👈 tamaño de fuente input
                  },
                }}
              />
            )}
            fullWidth
            disableClearable
            sx={{
              marginTop: "10px",
              width: "100%",
              height: "100%",
              fontSize: "1rem", // 👈 tamaño de fuente del dropdown
              "& .MuiAutocomplete-inputRoot": {
                padding: "0 10px !important",
              },
              "& .MuiAutocomplete-option": {
                fontSize: "1rem", // 👈 tamaño de fuente de cada opción del dropdown
              },
            }}
          />
        );
      },
    },
    {
      field: "quantity",
      headerName: "Cantidad",
      width: 200,
      editable: true,
      type: "number",
      editable: true,
    },
    {
      field: "unitPrice",
      headerName: "Precio Unitario",
      width: 200,
      editable: false,
      type: "number",
    },
    {
      field: "subTotal",
      headerName: "SubTotal",
      width: 300,
      editable: false,
      type: "number",
      valueGetter: (value, row) => {
        value = row.unitPrice * row.quantity;
        return value;
      },
    },
  ];

  return (
    <div className="table-container">
      {invoiceDetails.length > 0 ? (
        <DataTable rows={invoiceDetails} columns={columns} />
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
}

export default InvoiceScreen;

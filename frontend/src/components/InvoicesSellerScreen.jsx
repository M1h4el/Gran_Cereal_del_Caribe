"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import DataTable from "react-data-table-component";
import {
  TextField,
  Button,
  Stack,
  LinearProgress,
  Paper,
  MenuItem,
  FormControl,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { fetchData } from "../../utils/api";
import "@/styles/InvoicesSellerScreen.scss";
import Modal from "./Modal";
import CopyToClipboardField from "./MUI/CopyToClipboardInput";
import TablePayments from "./Modal/TablePayments";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";

function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().replace("T", " ").substring(0, 19);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().substring(0, 10);
}

const InvoicesSellerScreen = ({ collaboratorId, invoice, invoiceByCode }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [params, setParams] = useState({});
  const [modalSelected, setModalSelected] = useState("");
  const [dataInvoice, setDataInvoice] = useState({
    dateRegistered: "",
    email: "",
    state: "Pendiente",
    deliveryDate: "",
    details: "",
    collaboratorId: collaboratorId?.id,
  });

  console.log("collaboratorId", collaboratorId);

  const { data: session } = useSession();
  if (!session?.user || !collaboratorId?.id) return;

  useEffect(() => {
    if (invoiceByCode) {
      setGlobalFilter(invoiceByCode);
    }
    async function fetchInvoices() {
      if (!session?.user || !collaboratorId?.id) return;

      try {
        const res = await fetchData(
          `/users/${session.user.id}/collaborators/${collaboratorId.id}/invoices`,
          "GET",
          null
        );

        if (res.message) {
          console.log("mensaje del servidor:", res.message);
        }

        const formatted = res.map((el) => {
          let formattedDeliveryDate = "Por asignar";
          if (el.invoice?.delivery_date) {
            const deliveryDateObj = new Date(el.invoice.delivery_date);
            formattedDeliveryDate = deliveryDateObj.toISOString().split("T")[0];
          }

          let formattedCreatedAt = "";
          if (el.invoice?.created_at) {
            const createdAtObj = new Date(el.invoice.created_at);
            const isoString = createdAtObj.toISOString();
            formattedCreatedAt = isoString.replace("T", " ").substring(0, 19);
          }

          const net = Number(el.invoice.total_net) || 0;

          const formattedObject = {
            ...el,
            ...el.invoice,
            created_at: formattedCreatedAt,
            delivery_date: formattedDeliveryDate,
            total_net: new Intl.NumberFormat("es-CL", {
              style: "currency",
              currency: "CLP",
              minimumFractionDigits: 0,
            }).format(net),
          };

          delete formattedObject.invoice;

          return formattedObject;
        });

        setRows(formatted);
      } catch (error) {
        console.error("Error cargando las facturas:", error);
      }
    }

    const params = new URLSearchParams({
      searchById: collaboratorId.id,
      screen: "sellerInvoiceScreen",
    });

    const gettingParams = async () => {
      try {
        const data = await fetchData(
          `params?${params.toString()}`,
          "GET",
          null
        );

        console.log(22222222222, data);

        setParams(
          {
            estimatedProfit: data.stats.confirmed.total_utility,
            total_settlementsPaid: data.stats.confirmed.total_settlementsPaid,
            balance: Number(
              data.stats.confirmed.total_utility -
                data.stats.confirmed.total_settlementsPaid
            ),
          } || {}
        );
      } catch (error) {
        console.error("Error obteniendo los parámetros:", error);
      }
    };

    gettingParams();
    fetchInvoices();
  }, [session, collaboratorId, invoice]);

  const columnsConfig = [
    { name: "ID", field: "invoiceCode", editable: false },
    { name: "Nombre", field: "userClientName", editable: false },
    {
      name: "Fecha de entrega",
      field: "delivery_date",
      editable: true,
      type: "date",
    },
    { name: "Estado", field: "state", editable: false },
    { name: "Fecha de creación", field: "created_at", editable: false },
    { name: "Valor", field: "total_net", editable: false, type: "number" },
  ];

  const handleRowChange = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handlePaymentAdmin = () => {
    setIsOpenModal(true);
    setModalSelected("Payment");
  };

  const handleEdit = () => {
    if (!isEditing) {
      setOriginalRows(JSON.parse(JSON.stringify(rows)));
      setIsEditing(true);
      setSelectedRows([]);
    } else {
      setRows(originalRows);
      setIsEditing(false);
      setSelectedRows([]);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(rows);
    }
    setIsEditing(false);
    setSelectedRows([]);
  };

  const handleAdd = () => {
    setIsOpenModal(true);
    setModalSelected("Add");
  };

  const handleCreateInvoice = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetchData(`invoices`, "POST", data);

      if (!res) {
        console.error("No hay respuesta del servidor");
        setError("Error del servidor al crear la factura.");
        return;
      }

      setIsOpenModal(false);

      function normalizeInvoice(invoice) {
        return {
          invoice_id: invoice.invoice.invoice_id,
          invoiceCode: invoice.invoice.invoiceCode,
          user_seller_id: invoice.invoice.user_seller_id,
          user_buyer_id: invoice.invoice.user_buyer_id,
          details: invoice.invoice.details || "",
          sold_out: invoice.invoice.sold_out || "pending",
          state: invoice.invoice.state || "Pendiente",
          total_net: invoice.total_net || 0,
          created_at: formatDateTime(invoice.invoice.created_at),
          updated_at: invoice.invoice.updated_at,
          delivery_date: formatDate(invoice.invoice.delivery_date),
          userClientName: invoice.invoice.userClientName || "",
        };
      }

      const formattedInvoice = normalizeInvoice(res);

      invoice(formattedInvoice);
    } catch (err) {
      console.error("No se pudo crear la factura", err);
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Error desconocido al crear la factura."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) return;
    const idsToDelete = selectedRows.map((row) => row.id);
    const updatedRows = rows.filter((row) => !idsToDelete.includes(row.id));
    setRows(updatedRows);
    setSelectedRows([]);
    if (onDelete) {
      onDelete(idsToDelete);
    }
  };

  const filteredRows = useMemo(() => {
    if (!globalFilter) return rows;
    const lowerFilter = globalFilter.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowerFilter)
      )
    );
  }, [globalFilter, rows]);

  const customColumns = useMemo(() => {
    return columnsConfig.map((col) => ({
      name: col.name,
      selector: (row) => row[col.field],
      sortable: true,
      grow: 1,
      cell: (row) =>
        col.editable && isEditing ? (
          <TextField
            type={col.type === "number" ? "number" : "text"}
            value={row[col.field]}
            onChange={(e) => handleRowChange(row.id, col.field, e.target.value)}
            variant="outlined"
            size="small"
            sx={{ input: { padding: "4px", width: "100%" } }}
          />
        ) : (
          row[col.field]
        ),
    }));
  }, [columnsConfig, isEditing]);

  return (
    <>
      <section className="headSection">
        <div className="statsSeller">
          <h2>Estadísticas Generales</h2>
          <div className="statsContainer">
            <div className="statTitle">
              <h3>Balance Total</h3>
              <h3>Liquidación pagada</h3>
              <h3>Ganancias generadas</h3>
            </div>
            <div className="statValue">
              <h4>{`$ ${Number(params?.balance ?? 0).toLocaleString(
                "es-CO"
              )}`}</h4>
              <h4>{`$ ${Number(
                params?.total_settlementsPaid ?? 0
              ).toLocaleString("es-CO")}`}</h4>
              <h4>{`$ ${Number(params?.estimatedProfit ?? 0).toLocaleString(
                "es-CO"
              )}`}</h4>
            </div>
          </div>
        </div>
        <hr />
        <div className="actionsSeller">
          <h2>Acciones</h2>
          <CopyToClipboardField
            valueToCopy={
              session.user.role === "Vendedor"
                ? session.user.codeCollaborator
                : collaboratorId?.codeCollaborator
            }
          />
          <Button
            variant="contained"
            color="success"
            onClick={() => handlePaymentAdmin()}
            // disabled={session.user.role !== "Admin" || session.user.role !== "Sucursal"}
            sx={{ width: "200px", height: "40px" }}
          >
            Pagos Recibidos
          </Button>
        </div>
      </section>
      <section>
        <Paper sx={{ padding: 2, marginTop: 5, width: "100%" }} elevation={3}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            mb={2}
            sx={{ width: "100%", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "20px" }}>
              {(session.user.role !== "Vendedor" ||
                session.user.role !== "Cliente") && (
                <>
                  <TextField
                    placeholder="Buscar..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    size="small"
                  />

                  <Button
                    variant="contained"
                    color={isEditing ? "error" : "info"}
                    onClick={handleEdit}
                  >
                    {isEditing ? "Cancelar" : "Editar"}
                  </Button>
                </>
              )}
            </div>
            {(session.user.role !== "Vendedor" ||
              session.user.role !== "Cliente") && (
              <div style={{ display: "flex", gap: "20px" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAdd}
                  disabled={!isEditing}
                >
                  Agregar
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  disabled={!isEditing}
                >
                  Guardar
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
            )}
          </Stack>

          <DataTable
            columns={customColumns}
            data={filteredRows}
            progressPending={false}
            selectableRows
            onSelectedRowsChange={(state) =>
              setSelectedRows(state.selectedRows)
            }
            onRowClicked={(row) => {
              if (isEditing) return;
              invoice(row);
              console.log(129412934, row);
            }}
            pagination
            highlightOnHover
            dense
            noDataComponent={
              <h4 style={{ padding: "40px 0" }}>No hay datos para mostrar</h4>
            }
          />
        </Paper>
      </section>
      {isOpenModal && modalSelected === "Add" ? (
        <Modal
          open={isOpenModal}
          onClose={() => {
            setIsOpenModal(false);
            setModalSelected("");
          }}
        >
          <div className="modalContent">
            <h2>Registra una nueva factura</h2>
            <div className="fieldsContainer">
              <TextField
                label="Email del usuario"
                variant="outlined"
                error={
                  typeof error === "string" &&
                  error.includes("El usuario no existe")
                }
                helperText={
                  typeof error === "string" &&
                  error.includes("El usuario no existe") &&
                  "El usuario no se encuentra registrado."
                }
                fullWidth
                margin="normal"
                value={dataInvoice.email || ""}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setDataInvoice((prev) => ({ ...prev, email: newEmail }));

                  if (
                    typeof error === "string" &&
                    error.includes("El usuario no existe") &&
                    newEmail.trim() !== ""
                  ) {
                    setError("");
                  }
                }}
              />
              <TextField
                select
                label="Estado"
                variant="outlined"
                fullWidth
                margin="normal"
                value={dataInvoice.state || "Pendiente"}
                onChange={(e) =>
                  setDataInvoice((prev) => ({ ...prev, state: e.target.value }))
                }
              >
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Cancelado">Cancelado</MenuItem>
              </TextField>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FormControl fullWidth>
                  <DatePicker
                    label="Selecciona una fecha"
                    value={dataInvoice.dateRegistered || null}
                    onChange={(newValue) => setDataInvoice((prev) => ({
                      ...prev,
                      dateRegistered: newValue ? newValue.format("YYYY-MM-DD") : "",
                    }))}
                    format="YYYY-MM-DD"
                  />
                </FormControl>
              </LocalizationProvider>
              <TextField
                label="Fecha de entrega"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
                fullWidth
                margin="normal"
                value={dataInvoice.deliveryDate || ""}
                onChange={(e) =>
                  setDataInvoice((prev) => ({
                    ...prev,
                    deliveryDate: e.target.value,
                  }))
                }
              />
              <TextField
                label="Detalles"
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={dataInvoice.details || ""}
                onChange={(e) =>
                  setDataInvoice((prev) => ({
                    ...prev,
                    details: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleCreateInvoice(dataInvoice)}
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setIsOpenModal(false);
                  setDataInvoice({
                    email: "",
                    state: "Pendiente",
                    deliveryDate: "",
                    details: "",
                    collaboratorId: collaboratorId?.id,
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      ) : isOpenModal && modalSelected === "Payment" ? (
        <Modal
          open={isOpenModal}
          onClose={() => {
            setIsOpenModal(false);
            setModalSelected("");
          }}
        >
          <TablePayments
            type="settlementSeller"
            session={session}
            sellerId={
              session.user.role === "Vendedor"
                ? session?.user?.id
                : collaboratorId?.id
            }
            handleCloseModalF={() => {
              setIsOpenModal(false);
              setModalSelected("");
            }}
          />
        </Modal>
      ) : null}
    </>
  );
};

export default InvoicesSellerScreen;

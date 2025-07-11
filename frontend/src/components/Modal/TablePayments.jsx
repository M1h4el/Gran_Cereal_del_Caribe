import { Box, Button, Stack, Typography } from "@mui/material";
import DataTableBase from "react-data-table-component";
import React, { useEffect, useMemo, useState } from "react";
import { fetchData } from "../../../utils/api";
import ConfirmPayment from "../MUI/ConfirmPayment";
import Modal from "@/components/Modal";

function TablePayments({
  sucursal,
  type,
  adminId,
  sellerId,
  session,
  handleCloseModalF,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentConfirmedCount, setPaymentConfirmedCount] = useState(0);
  const [filterText, setFilterText] = useState("");

  console.log(2222222222222, data);

  const id = useMemo(() => {
    return type === "Sucursal"
      ? sucursal?.id
      : type === "Admin"
      ? adminId
      : type === "settlementSeller"
      ? sellerId
      : null;
  }, [type, sucursal, adminId]);

  const typePost = useMemo(() => {
    if (type === "Sucursal") {
      return "sucursalPayment";
    } else if (type === "Admin") {
      return "adminPayment";
    } else if (type === "settlementSeller") {
      return "settlementSellerPayment";
    }
    return "customerPayment";
  }, [type]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const confirmingPayment = async (data) => {
    try {
      const newData = {
        ...data,
        user_id: id,
        typePost,
      };

      console.log("New", newData);

      const paymentPosted = await fetchData(`payments`, "POST", newData);

      setPaymentConfirmedCount((prev) => prev + 1);

      setIsModalOpen(false);

      console.log("paymentPosted", paymentPosted);
    } catch (error) {
      console.error("Error Registrando Pago", error);
    }
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => row.paymentCode || "N/A",
      sortable: true,
    },
    {
      name: "Importe",
      selector: (row) => row.amount,
      sortable: true,
      right: true,
      format: (row) =>
        `$ ${Number(row.amount || 0).toLocaleString("es-CL", {
          minimumFractionDigits: 0,
        })}`,
    },
    {
      name: "Medio de Pago",
      selector: (row) => row.method_payment,
      sortable: true,
      width: "150px",
    },
    {
      name: "Estado",
      selector: (row) => (row.status === 0 ? "Confirmado" : "Pendiente"),
      sortable: true,
    },
    {
      name: "Fecha",
      selector: (row) => row.date_payment,
      sortable: true,
      right: true,
      format: (row) => {
        if (!row.date_payment) return "N/A";
        const formattedDate = new Date(row.date_payment).toLocaleDateString(
          "es-CL",
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        );
        return formattedDate;
      },
    },
    {
      name: "Detalles",
      selector: (row) => row.details,
      sortable: false,
      width: "200px",
      cell: (row) => (
        <Typography variant="body2" color="textSecondary">
          {row.details || "N/A"}
        </Typography>
      ),
    },
  ];

  useEffect(() => {
    setLoading(true);
    async function fetchPayments() {
      try {
        const params = new URLSearchParams({
          searchByUser: id,
          type: type,
        });
        const res = await fetchData(`payments?${params}`, "GET");
        setData(res);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [sucursal, type, adminId, id, paymentConfirmedCount]);

  // Filtrar la data
  const filteredData = data.filter((item) => {
    const search = filterText.toLowerCase();
    return (
      item.paymentCode?.toLowerCase().includes(search) ||
      item.method_payment?.toLowerCase().includes(search) ||
      item.details?.toLowerCase().includes(search) ||
      (item.status === 0 ? "confirmado" : "pendiente").includes(search)
    );
  });

  return (
    <Box
      sx={{
        width: "1000px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 3,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <Typography>Payments</Typography>
          <input
            type="text"
            placeholder="Filtrar..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div>
          {(session.user.role === "Admin" ||
            session.user.role === "Sucursal") && (
            <Button
              variant="contained"
              color="success"
              onClick={() => setIsModalOpen(true)}
              sx={{ width: "200px" }}
            >
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      <Stack
        direction="column"
        spacing={2}
        sx={{ width: "100%", height: "100%" }}
      >
        <DataTableBase
          columns={columns}
          data={filteredData}
          pagination
          highlightOnHover
          dense
          fixedHeader
          fixedHeaderScrollHeight="400px"
          progressPending={loading}
        />

        <div>
          <Button variant="contained" color="error" onClick={handleCloseModalF}>
            Cerrar
          </Button>
        </div>
      </Stack>

      <Modal open={isModalOpen} onClose={handleCloseModal} required>
        <ConfirmPayment
          onCancel={() => setIsModalOpen(false)}
          onConfirm={(data) => {
            confirmingPayment(data);
          }}
        />
      </Modal>
    </Box>
  );
}

export default TablePayments;

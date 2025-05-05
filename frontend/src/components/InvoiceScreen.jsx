"use client";

import React, { useEffect, useState } from "react";
import { fetchData } from "../../utils/api";
import "@/styles/InvoiceScreen.scss";
import DataTable from "./MUI/DataTable";
import Modal from "./Modal";
import { Button } from "@mui/material";
import { useSession } from "next-auth/react";

const formatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function InvoiceScreen({ data, products }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [infoCustomer, setInfoCustomer] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  console.log("data de InvoiceScreen",data);

  let handleTotalData = (newTot) => {
    data.total_net = newTot;
  };


  const handleOpenModal = (content, action) => {
    setModalContent(content);
    setOnConfirmAction(() => action);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setOnConfirmAction(() => () => {});
  };

  const handleConfirm = async () => {
    await onConfirmAction();
    handleCloseModal();
  };

  const invoiceId = data?.invoice_id;

  useEffect(() => {
    setIsLoading(true);
    const fetchInvoiceDetails = async () => {
      try {
        if (!invoiceId) return;

        const res = await fetchData(`invoices/${invoiceId}/details`, "GET");

        const formatted = res.map((item, index) => ({
          id: item?.idinvoice_detail ?? `temp-${Date.now()}-${index}`,
          idinvoice_detail: item?.idinvoice_detail,
          product: `${item?.productCode} - ${item?.name}`,
          quantity: item?.quantity,
          unitPrice: item?.price,
          total: item?.total,
          created_at: formatter.format(new Date(item.created_at)),
          updated_at: formatter.format(new Date(item.updated_at)),
        }));

        console.log("Productos desde InvoiceScreen:", products);

        setInvoiceDetails(formatted);
      } catch (error) {
        console.error("Error al obtener detalles de factura:", error);
      }
    };

    const fetchinfoCustomer = async () => {
      try {
        const userBuyerId = data?.user_buyer_id;
        if (!userBuyerId) return;

        const res = await fetchData(`users/${userBuyerId}`, "GET");

        const formatted = {
          ...res,
          id: res.user_id || "No disponible",
          code: res.codeCollaborator || "No disponible",
          name: res.userName || "No disponible",
          address: res.address || "No disponible",
          phone: res.phone || "No disponible",
        };
        setInfoCustomer(formatted);
      } catch (error) {
        console.error("Error al obtener detalles de factura:", error);
      }
    };

    fetchinfoCustomer();
    fetchInvoiceDetails();
    setIsLoading(false);
  }, [data]);

  const columns = [
    {
      field: "product",
      name: "Producto",
      editable: true,
      type: "autocomplete",
    },
    {
      field: "quantity",
      name: "Cantidad",
      editable: true,
      type: "number",
      right: true,
    },
    {
      field: "unitPrice",
      name: "Precio Unitario",
      editable: false,
      right: true,
      format: (value) =>
        `$${Number(value || 0).toLocaleString("es-CL", {
          minimumFractionDigits: 0,
        })}`,
    },
    {
      field: "total",
      name: "Total",
      editable: false,
      right: true,
      format: (value) =>
        `$${Number(value || 0).toLocaleString("es-CL", {
          minimumFractionDigits: 0,
        })}`,
    },
  ];

  const productOptions = products.map((p) => ({
    ...p,
    label: `${p.productCode} - ${p.name}`,
  }));

  /* let unitPriceProduct = (code) => {
    const productFound = products.find(product => product.productCode === code);
    return productFound?.price || 0;
  } */

  return (
    <div className="table-container">
      <div className="generalInfo">
        <div className="infoInvoice">
          <h1 className="TitleScreen">Factura de Ventas</h1>
          <h2>Código de Factura: {data?.invoiceCode}</h2>
        </div>
        <div className="infoCustomer">
          <div className="infoKey">
            <h3>A Nombre de: </h3>
            <h3>Dirección: </h3>
            <h3>Teléfono: </h3>
            <h3>Fecha: </h3>
          </div>
          <div className="infoValue">
            <h3>{data?.userClientName ?? infoCustomer?.userName ?? " "}</h3>
            <h3>{data?.userClientAddress ?? infoCustomer?.address ?? " "}</h3>
            <h3>{data?.userClientPhone ?? infoCustomer?.phone ?? " "}</h3>
            <h3>{data?.created_at ?? " "}</h3>
          </div>
        </div>
      </div>

      <DataTable
        roleUser={session.user.role}
        rows={invoiceDetails}
        columns={columns}
        options={productOptions}
        dataInvoice={data}
        openModal={handleOpenModal}
        closeModal={handleCloseModal}
        loadingDetails={isLoading}
        updating={handleTotalData}
      />

      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <div
          open={isModalOpen}
          onClose={handleCloseModal}
          className="childrenModal"
        >
          <h2 className="title">Confirmación</h2>
          <h4>{modalContent}</h4>
          <div className="modal-actions">
            <Button onClick={handleCloseModal} variant="text" color="error">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} variant="contained" color="primary">
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default InvoiceScreen;

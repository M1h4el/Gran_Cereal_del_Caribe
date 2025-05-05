"use client";

import React, { useEffect, useState } from "react";
import SucursalCards from "../../components/SucursalCards";
import "@/styles/SucursalCards.scss";
import SellersScreen from "@/components/SellersScreen";
import InvoicesSellerScreen from "@/components/InvoicesSellerScreen";
import InvoicesCustomerScreen from "@/components/InvoicesCustomerScreen";
import InvoiceScreen from "@/components/InvoiceScreen";
import Modal from "@/components/Modal";
import { useSession } from "next-auth/react";
import FormTabModal from "@/components/Modal/FormTabModal";

function SucursalContent() {
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [statusUser, setStatusUser] = useState(session?.user?.status);
  const [invoiceByCode, setInvoiceByCode] = useState("");
  const [selection, setSelection] = useState({
    sucursal: null,
    collaborator: null,
    invoices: null,
  });

  console.log("selection", selection);

  console.log("Cambiando ruta a:", routes);

  const handleStatusUser = async () => {
    setStatusUser("confirmed");
  };

  const confirmUser = () => {
    if (!statusUser && statusUser === "confirmed") return;

    if (statusUser === "unconfirmed") {
      handleOpenModal();
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      confirmUser();
    }
  }, [status, session]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRoute = (route) => {
    setRoutes((prevRoutes) => [...prevRoutes, route?.title]);

    setSelection((prev) => ({
      ...prev,
      sucursal: route,
    }));
    setTotalProducts(route.total_products);
  };

  const handleGetProducts = (products) => {
    setProducts(products);
  };

  const handleSearchByCodeInvoice = (code) => {
    setInvoiceByCode(code);
  }

  const handlecollaboratorSellected = (collaborator) => {
    if (!collaborator) {
      console.error("Error: props no válidas", collaborator, invoice);
      return;
    }
  
    let newIndex = "";
  
    if (collaborator.role === "Vendedor") {
      newIndex = "Tabla de Ventas";
    } else if (collaborator.role === "Cliente") {
      newIndex = "Tabla de Compras";
    } else {
      console.error("Rol no reconocido");
      return;
    }
  
    const newRoutes = [newIndex];
  
    setRoutes((prevRoutes) => [...prevRoutes, ...newRoutes]);
  
    setSelection((prev) => ({
      ...prev,
      collaborator: collaborator,
    }));
  };

  const handleInvoiceSelected = (invoice) => {
    if (!invoice) {
      console.error("Error: Invoice no válido", invoice);
    }
    setRoutes((prevRoutes) => [...prevRoutes, "Detalles de Venta"]);
    setSelection((prev) => ({
      ...prev,
      invoices: invoice,
    }));
  };

  const removeRoute = (index) => {
    setRoutes((prevRoutes) => prevRoutes.slice(0, index));

    setSelection((prev) => {
      const newSelection = { ...prev };

      // Dependiendo del nivel, limpiamos valores
      if (index === 0) {
        newSelection.sucursal = null;
        newSelection.collaborator = null;
        newSelection.invoices = null;
        setInvoiceByCode("");
      } else if (index === 1) {
        newSelection.collaborator = null;
        newSelection.invoices = null;
        setInvoiceByCode("");
      } else if (index === 2) {
        newSelection.invoices = null;
      }

      return newSelection;
    });
  };

  const renderComponent = () => {
    switch (routes.length) {
      case 0:
        return <SucursalCards handleRoute={handleRoute} />;
      case 1:
        return (
          <SellersScreen
            sucursal={selection.sucursal}
            collaborator={handlecollaboratorSellected}
            totalProducts={totalProducts}
            handleGetProducts={handleGetProducts}
            invoicehandle={handleInvoiceSelected}
            searchByCodeInvoice={handleSearchByCodeInvoice}

          />
        );
      case 2:
        if (!selection.collaborator) console.log("Colaborador no seleccionado");
        return selection.collaborator.role === "Vendedor" ? (
          <InvoicesSellerScreen
            invoiceByCode={invoiceByCode}
            collaboratorId={selection.collaborator}
            invoice={handleInvoiceSelected}
          />
        ) : selection.collaborator.role === "Cliente" ? (
          <InvoicesCustomerScreen
            collaboratorId={selection.collaborator}
            invoice={handleInvoiceSelected}
          />
        ) : (
          console.log("Rol no reconocido")
        );
      case 3:
        return <InvoiceScreen data={selection.invoices} products={products} />;
      default:
        return <div>🔍 Vista profunda en {routes[routes.length - 1]}</div>;
    }
  };

  return (
    <>
      <section>
        <div className="TitleSection">
          <div className="routeIndexContainer">
            <h1 className="index" onClick={() => setRoutes([])}>
              Sucursales <hr />
            </h1>
            {routes.map((route, index) => (
              <React.Fragment key={index}>
                {" > "}
                <h2 className="index" onClick={() => removeRoute(index + 1)}>
                  {route}
                  <hr />
                </h2>
              </React.Fragment>
            ))}
          </div>
          {routes.length == 0 && <h4>Crea las sucursales de tu Empresa</h4>}
          <hr />
        </div>
      </section>
      <section>{renderComponent()}</section>
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleCloseModal} required>
          <FormTabModal
            onClose={handleCloseModal}
            user={session.user}
            statusUser={statusUser}
            handleStatus={handleStatusUser}
          />
        </Modal>
      )}
    </>
  );
}

export default SucursalContent;

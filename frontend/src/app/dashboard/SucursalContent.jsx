"use client";

import React, { useEffect, useState, useCallback } from "react";
import SucursalCards from "../../components/SucursalCards";
import "@/styles/SucursalCards.scss";
import SellersScreen from "@/components/SellersScreen";
import InvoicesSellerScreen from "@/components/InvoicesSellerScreen";
import InvoicesCustomerScreen from "@/components/InvoicesCustomerScreen";
import InvoiceScreen from "@/components/InvoiceScreen";
import Modal from "@/components/Modal";
import { useSession } from "next-auth/react";
import FormTabModal from "@/components/Modal/FormTabModal";
import { fetchData } from "../../../utils/api";

function SucursalContent() {
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState([]);
  const [initialIndexRoute, setInitialIndexRoute] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [statusUser, setStatusUser] = useState(null);
  const [invoiceByCode, setInvoiceByCode] = useState("");
  const [updatedSession, setUpdatedSession] = useState(session);
  const [selection, setSelection] = useState({
    sucursal: null,
    collaborator: null,
    invoices: null,
  });

  console.log(
    "Routes UI",
    routes,
    "selection",
    selection,
    "initialIndex",
    initialIndexRoute,
    "updatedSession",
    updatedSession
  );

  // Memoized functions
  const handleStatusUser = useCallback(async () => {
    setStatusUser("confirmed");
  }, []);

  const confirmUser = useCallback(() => {
    if (statusUser === "unconfirmed") {
      setIsModalOpen(true);
    }
  }, [statusUser]);

  let roleIndexMap = {
    Admin: 0,
    Sucursal: 1,
    Vendedor: 2,
    Cliente: 3,
  };
  // Initialize session and routes
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    setStatusUser(session?.user?.status);
    setUpdatedSession(session || {});
    confirmUser();

    const userRole = session?.user?.role;
    const userName = session?.user?.userName;

    function loadSellerData() {
      const cardObject = {
        id: session?.user?.id,
        name: session?.user?.userName,
        role: session?.user?.role,
      };
      handleRoute(cardObject);
    }

    async function loadSucursalData() {
      try {
        const dataSucursal = await fetchData(
          `sucursales?searchByCode=${session?.user?.codeCollaborator}`,
          "GET"
        );

        if (!dataSucursal || dataSucursal.length === 0) {
          console.error("No se encontraron sucursales con ese código");
          return;
        }

        const cardObject = {
          id: dataSucursal[0]?.sucursal_id,
          title: dataSucursal[0]?.title,
          total_products: dataSucursal[0]?.total_products,
          codeCollaborator: dataSucursal[0]?.codeCollaborator,
        };

        console.log("Datos obtenidos:", dataSucursal);
        handleRoute(cardObject);
      } catch (error) {
        console.error("Error al cargar datos de sucursal:", error);
      }
    }

    // Set initial routes based on role
    if (userRole === "Admin") {
      setRoutes([]);
    } else if (userRole === "Sucursal") {
      setRoutes([userName]);
      loadSucursalData();
    } else if (userRole === "Vendedor") {
      setRoutes([userName]);
      loadSellerData();
    }

    setInitialIndexRoute(roleIndexMap[userRole] || 0);
  }, [status, session, confirmUser]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleRoute = (route) => {
    const role = session?.user?.role;
    if (role === "Admin") {
      setRoutes((prev) => [...prev, route?.title]);
    }
    if (role === "Sucursal") {
      setSelection((prev) => ({ ...prev, sucursal: route }));
      setTotalProducts(route?.total_products);
    }
    if ((role === "Vendedor")) {
      setSelection((prev) => ({ ...prev, collaborator: route }));
    }
  };

  const handleGetProducts = (products) => {
    setProducts(products);
  };

  const handleSearchByCodeInvoice = (code) => {
    setInvoiceByCode(code);
  };

  const handleCollaboratorSelected = (collaborator) => {
    if (!collaborator) {
      console.error("Error: colaborador no válido");
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

    setRoutes((prev) => [...prev, newIndex]);
    setSelection((prev) => ({ ...prev, collaborator }));
  };

  const handleInvoiceSelected = (invoice) => {
    if (!invoice) {
      console.error("Error: Factura no válida");
      return;
    }
    setRoutes((prev) => [...prev, "Detalles de Venta"]);
    setSelection((prev) => ({ ...prev, invoices: invoice }));
  };

  const removeRoute = (index) => {
    // Recorta el array de rutas hasta el índice deseado incluido

    setRoutes((prev) =>
      prev.slice(0, index + roleIndexMap[updatedSession?.user?.role])
    );

    // Actualiza el selection de acuerdo al índice
    setSelection((prev) => {
      const newSelection = { ...prev };

      if (index < 1) {
        newSelection.sucursal = prev.sucursal;
        newSelection.collaborator = null;
        newSelection.invoices = null;
      } else if (index < 2) {
        newSelection.collaborator = prev.collaborator;
        newSelection.invoices = null;
      }

      return newSelection;
    });

    setInvoiceByCode("");
  };

  let currentRouteIndex = routes.length;

  session?.user?.role === "Vendedor" && (currentRouteIndex = currentRouteIndex + 1);

  const renderComponent = () => {
    switch (currentRouteIndex) {
      case 0:
        return <SucursalCards handleRoute={handleRoute} />;
      case 1:
        if (!selection.sucursal) return <div>Selecciona una Sucursal</div>;
        return (
          <SellersScreen
            sucursal={selection.sucursal}
            collaborator={handleCollaboratorSelected}
            totalProducts={totalProducts}
            handleGetProducts={handleGetProducts}
            invoicehandle={handleInvoiceSelected}
            searchByCodeInvoice={handleSearchByCodeInvoice}
          />
        );
      case 2:
        if (!selection.collaborator)
          return <div>Selecciona un colaborador</div>;
        return selection.collaborator.role === "Vendedor" ? (
          <InvoicesSellerScreen
            invoiceByCode={invoiceByCode}
            collaboratorId={selection.collaborator}
            invoice={handleInvoiceSelected}
          />
        ) : (
          <InvoicesCustomerScreen
            collaboratorId={selection.collaborator}
            invoice={handleInvoiceSelected}
          />
        );
      case 3:
        if (!selection.invoices) return <div>Selecciona una factura</div>;
        return <InvoiceScreen data={selection.invoices} products={products} />;
      default:
        return <div>🔍 Vista profunda en {routes[routes.length - 1]}</div>;
    }
  };

  if (status === "loading") return <div>Cargando...</div>;
  if (status !== "authenticated" || !updatedSession?.user)
    return <div>No autenticado</div>;

  return (
    <>
      <section className="section1">
        <div className="TitleSection">
          <div className="routeIndexContainer">
            <h1 className="index" onClick={() => removeRoute(0)}>
              {updatedSession.user.role === "Admin"
                ? "Sucursales"
                : updatedSession.user.userName}{" "}
              <hr />
            </h1>
            {routes.map((route, index) => {
              return session.user.role !== "Admin" ? (
                index !== 0 && (
                  <React.Fragment key={index}>
                    {" > "}
                    <h2
                      className="index"
                      onClick={() => removeRoute(index + 1)}
                    >
                      {route}
                      <hr />
                    </h2>
                  </React.Fragment>
                )
              ) : (
                <React.Fragment key={index}>
                  {" > "}
                  <h2 className="index" onClick={() => removeRoute(index)}>
                    {route}
                    <hr />
                  </h2>
                </React.Fragment>
              );
            })}
          </div>
          {currentRouteIndex === 0 && (
            <h4>Crea las sucursales de tu Empresa</h4>
          )}
          <hr />
        </div>
      </section>

      {currentRouteIndex === 0 && (
        <section className="section2">
          <div>Contenido adicional</div>
        </section>
      )}

      <section>{renderComponent()}</section>

      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleCloseModal} required>
          <FormTabModal
            onClose={handleCloseModal}
            user={updatedSession.user}
            statusUser={statusUser}
            handleStatus={handleStatusUser}
          />
        </Modal>
      )}
    </>
  );
}

export default SucursalContent;

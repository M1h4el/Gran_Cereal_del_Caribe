"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import SucursalCards from "../../components/SucursalCards";
import "@/styles/SucursalCards.scss";
import SellersScreen from "@/components/SellersScreen";
import InvoicesSellerScreen from "@/components/InvoicesSellerScreen";
import InvoicesCustomerScreen from "@/components/InvoicesCustomerScreen";
import InvoiceScreen from "@/components/InvoiceScreen";
import Modal from "@/components/Modal";
import { useSession } from "next-auth/react";
import FormTabModal from "@/components/Modal/FormTabModal";
import CopyCode from "../../components/MUI/CopyToClipboardInput";
import { fetchData } from "../../../utils/api";
import { Button } from "@mui/material";
import TablePayments from "@/components/Modal/TablePayments";

function SucursalContent() {
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState([]);
  const [initialIndexRoute, setInitialIndexRoute] = useState(0);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [isModalOpen3, setIsModalOpen3] = useState(false);
  const [params, setParams] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [statusUser, setStatusUser] = useState(null);
  const [invoiceByCode, setInvoiceByCode] = useState("");
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
    session
  );

  console.log(111111111111, params);

  // Memoized functions
  const handleStatusUser = useCallback(async () => {
    setStatusUser("confirmed");
  }, []);

  const confirmUser = useCallback(() => {
    if (statusUser === "unconfirmed") {
      setIsModalOpen(true);
    }
  }, [statusUser]);

  const roleIndexMap = useMemo(
    () => ({
      Admin: 0,
      Sucursal: 1,
      Vendedor: 2,
      Cliente: 2,
    }),
    []
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const fetchUserStatus = async () => {
      const status = await fetchData(
        `confirmUser?userId=${session?.user?.id}`,
        "POST",
        session?.user?.id
      );

      setStatusUser(status || "confirmed");
    };

    fetchUserStatus();

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

    async function fetchParamsAdmin() {
      try {
        const data = await fetchData(
          `params?searchById=${session?.user?.id}`,
          "GET",
          {type}
        );

        if (!data || data.length === 0) {
          console.error("No se encontraron parámetros de administrador");
          return;
        }

        setParams({ ...data.params });
        return data;
      } catch (error) {
        console.error("Error al cargar datos de administrador:", error);
      }
    }

    // Set initial routes based on role
    if (userRole === "Admin") {
      setRoutes([]);
      fetchParamsAdmin();
    } else if (userRole === "Sucursal") {
      setRoutes([userName]);
      loadSucursalData();
    } else if (userRole === "Vendedor") {
      setRoutes([userName]);
      loadSellerData();
    }

    setInitialIndexRoute(roleIndexMap[userRole] || 0);
  }, [status, session]);

  function handleEntregas() {
    setIsModalOpen2(true);
  }

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleRoute = (route) => {
    const role = session?.user?.role;
    if (role === "Admin") {
      setRoutes((prev) => [...prev, route?.title]);
      setSelection((prev) => ({ ...prev, sucursal: route }));
    }
    if (role === "Sucursal") {
      setSelection((prev) => ({ ...prev, sucursal: route }));
    }
    if (role === "Vendedor") {
      setSelection((prev) => ({ ...prev, collaborator: route }));
    }
  };

  const handleGetProducts = (products) => {
    setProducts(products);
  };

  const handleSearchByCodeInvoice = (code) => {
    setInvoiceByCode(code);
  };

  const handleCloseModal3 = () => {
    setIsModalOpen3(false);
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

  const removeRoute = (clickedIndex) => {
    const role = session?.user?.role;
    const roleOffset = role === "Admin" ? 0 : 1; // Offset base para rutas

    // 1. Actualización de rutas
    setRoutes((prev) => {
      const newLength = clickedIndex + roleOffset;
      return prev.slice(0, newLength);
    });

    // 2. Actualización de selection según rol
    setSelection((prev) => {
      const newSelection = { ...prev };

      switch (role) {
        case "Vendedor":
          if (clickedIndex === 2) {
            // Click en nombre del vendedor (ruta inicial)
            newSelection.invoices = null;
          } else if (clickedIndex === 1) {
            // Click en "Tabla de Ventas"
            newSelection.invoices = null;
          }
          break;

        case "Cliente":
          if (clickedIndex === 2) {
            // Click en nombre del cliente (ruta inicial)
            newSelection.collaborator = null;
            newSelection.invoices = null;
          } else if (clickedIndex === 1) {
            // Click en "Tabla de Compras"
            newSelection.invoices = null;
          }
          break;

        case "Admin":
          if (clickedIndex < 1) {
            newSelection.sucursal = prev.sucursal;
            newSelection.collaborator = null;
            newSelection.invoices = null;
          } else if (clickedIndex < 2) {
            newSelection.collaborator = prev.collaborator;
            newSelection.invoices = null;
          }
          break;

        case "Sucursal":
          if (clickedIndex < 1) {
            newSelection.collaborator = null;
            newSelection.invoices = null;
          }
          break;

        default:
          break;
      }

      return newSelection;
    });

    setInvoiceByCode("");
  };

  let currentRouteIndex = routes.length;

  session?.user?.role === "Vendedor" &&
    (currentRouteIndex = currentRouteIndex + 1);

  const renderComponent = () => {
    switch (currentRouteIndex) {
      case 0:
        return <SucursalCards handleRoute={handleRoute} />;
      case 1:
        if (!selection.sucursal) return <div>Cargando...</div>;
        return (
          <SellersScreen
            sucursal={selection.sucursal}
            collaborator={handleCollaboratorSelected}
            handleGetProducts={handleGetProducts}
            invoicehandle={handleInvoiceSelected}
            searchByCodeInvoice={handleSearchByCodeInvoice}
          />
        );
      case 2:
        if (!selection.collaborator)
          return <div>Cargando...</div>;
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
        if (!selection.invoices) return <div>Cargando...</div>;
        return <InvoiceScreen data={selection.invoices} products={products} />;
      default:
        return <div>🔍 Vista profunda en {routes[routes.length - 1]}</div>;
    }
  };

  if (status === "loading") return <div>Cargando...</div>;
  if (status !== "authenticated" || !session?.user)
    return <div>No autenticado</div>;

  return (
    <>
      <section className="section1">
        <div className="TitleSection">
          <div className="routeIndexContainer">
            <h1 className="index" onClick={() => removeRoute(0)}>
              {session.user.role === "Admin"
                ? "Sucursales"
                : session.user.userName}{" "}
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
                  <h2 className="index" onClick={() => removeRoute(index + 1)}>
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
          <div className="generalStats">
            <h2>Estadísticas Generales</h2>
            <hr />
            <div className="statsParams">
              <div className="titleParams">
                <h4>Deuda Total</h4>
                <h4>Utilidad Total</h4>
                <h4>Saldo Sucursales</h4>
              </div>
              <div className="valueParams">
                <h4>{`$ ${Number(
                  params?.total_admin_factory_debt || 0
                ).toLocaleString("es-CO")}`}</h4>
                <h4>{`$ ${Number(
                  params?.total_admin_profit || 0
                ).toLocaleString("es-CO")}`}</h4>
                <h4>{`$ ${Number(
                  params?.total_sucursal_admin_debt || 0
                ).toLocaleString("es-CO")}`}</h4>
              </div>
            </div>
          </div>
          <div className="actions">
            <h2>Entregas</h2>
            <hr />
            <div className="actionButtons">
              <h5>Total Productos: {}</h5>
              <h5>Ultima Entrega</h5>
              <div className="boton-gestionar">
                <button onClick={() => handleEntregas()}>
                  Gestionar Productos
                </button>
              </div>
            </div>
          </div>
          <div>
            <CopyCode valueToCopy={session.user.codeCollaborator} />
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsModalOpen3(true)}
            >
              Gestionar Pagos
            </Button>
          </div>
        </section>
      )}

      <section>{renderComponent()}</section>

      {(isModalOpen || isModalOpen2 || isModalOpen3) && (
        <Modal
          open={isModalOpen || isModalOpen2 || isModalOpen3}
          onClose={handleCloseModal}
          required
        >
          {isModalOpen && (
            <FormTabModal
              onClose={handleCloseModal}
              user={session.user}
              statusUser={statusUser}
              handleStatus={handleStatusUser}
            />
          )}

          {
            isModalOpen2 &&
              null /* Aquí podrías poner otro modal si quisieras */
          }

          {isModalOpen3 && (
            <TablePayments
              adminId={session?.user.id}
              session={session}
              type="Admin"
              handleCloseModalF={handleCloseModal3}
            />
          )}
        </Modal>
      )}
    </>
  );
}

export default SucursalContent;

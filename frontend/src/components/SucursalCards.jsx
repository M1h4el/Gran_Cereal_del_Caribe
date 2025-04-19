"use client";

import "@/styles/SucursalCards.scss";
import React, { useState, useEffect } from "react";
import { fetchData } from "../../utils/api";
import ProjectCard from "@/components/ProjectCard";
import { useSession } from "next-auth/react";
import { showSwal } from "@/components/Swal/Swal";
import CreateSucursal from "@/components/Swal/CreateSucursal";

function SucursalCards({ handleRoute }) {
  const [cardData, setCardData] = useState([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const { data: session } = useSession();

  const handleReloadTrigger = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    async function fetchSucursales() {
      if (!session?.user) return;

      try {
        const res = await fetchData(
          `/sucursales?userId=${session.user.id}`,
          "GET",
          null
        );

        if (Array.isArray(res)) {
          setCardData(res);
        } else {
          console.error("Respuesta inesperada:", res);
        }
      } catch (error) {
        console.error("Error cargando las sucursales:", error);
      }
    }

    fetchSucursales();
  }, [session, reloadTrigger]);

  const handleCreateSucursal = async () => {
    if (!session?.user) return;
    showSwal(
      () => (
        <CreateSucursal
          sucursal={(nueva) => {
            setCardData((prev) => [...prev, nueva]);
          }}
          userId={session.user.id}
          reloadTrigger={handleReloadTrigger}
        />
      ),
      {}
    );

  };

  const rotatedData =
    cardData.length > 1 ? [...cardData.slice(1), cardData[0]] : cardData;

  function handleCardClick(card) {
    console.log(card, "clicked");
    if (handleRoute) {
      const cardObject = {
        id: card?.sucursal_id,
        title: card?.title,
        total_products: card?.total_products
      };
      handleRoute(cardObject);
    } else {
      console.error("handleRoute no está definido");
    }
  }
  return (
    <>
      <div className="MenuProjectSection">
        {/* <TbNewSection /> */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            padding: "16px",
          }}
        >
          {/* Primera tarjeta con formato especial */}
          <div
            style={{
              flex: "1 1 calc(33.33% - 16px)",
              maxWidth: "calc(33.33% - 16px)",
              minWidth: "250px",
              boxSizing: "border-box",
            }}
            onClick={() => handleCreateSucursal()}
          >
            <ProjectCard
              title="Nueva Surcursal"
              description="Crear una nueva sucursal"
              /* image={staticFirstCard.image}*/
              alt="nueva Sucursal"
              isFeatured
            />
          </div>

          {/* Renderizar el resto de las tarjetas */}
          {rotatedData.map((card, index) => (
            <div
              key={index}
              style={{
                flex: "1 1 calc(33.33% - 16px)",
                maxWidth: "calc(33.33% - 16px)",
                minWidth: "250px",
                boxSizing: "border-box",
              }}
              onClick={() => handleCardClick(card)}
            >
              <ProjectCard
                title={card?.title}
                description={card?.description}
                /* image={card.image}
                  alt={card.alt} */
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default SucursalCards;

"use client";

import React, { useEffect, useState } from "react";
import "@/styles/SellersScreen.scss";
import { useSession } from "next-auth/react";
import { fetchData } from "../../utils/api";

const SellersScreen = ({ sucursalId, collaborator }) => {
  const { data: session, status } = useSession();
  const [colaboradores, setColaboradores] = useState([]);

  /* const colaboradores = [
    { nombre: 'Juan Pérez', tipo: 'Vendedor', transacciones: '$5,000', ubicacion: 'Ciudad A', telefono: '123-456-7890' },
    { nombre: 'María López', tipo: 'Comprador', transacciones: '$3,200', ubicacion: 'Ciudad B', telefono: '987-654-3210' },
    { nombre: 'Carlos Gómez', tipo: 'Vendedor', transacciones: '$7,800', ubicacion: 'Ciudad C', telefono: '456-789-0123' },
  ]; */

  useEffect(() => {
    async function fetchCollaborators() {
      if (!session?.user) return;

      try {
        const res = await fetchData(
          `/users/${session.user.id}/sucursales/${sucursalId}/children`,
          "GET",
          null
        );

        if (res.length === 0) {
            console.log("No se encontraron colaboradores.");
        }
        if (res.error) console.error("Error:", res.error);
        
        setColaboradores(res);

      } catch (error) {
        console.error("Error cargando las sucursales:", error);
      }
    }
    

    fetchCollaborators();
  }, [session]);

  function handleRowClick(row) {
    console.log(row, "clicked");
    if (collaborator) {
      const cardObject = {
        id: row?.user_id,
        name: row?.userName,
        role: row?.role,
      }
      collaborator(cardObject)
    } else {
      console.error("handleRoute no está definido");
    }
  }

  return (
    <div className="table-container">
      <h2>Colaboradores</h2>
      <table className="collaborators-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Compras/Ventas ($)</th>
            <th>Ubicación</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {colaboradores.map((colaborador, index) => (
            <tr key={index} onClick={() => handleRowClick(colaborador)}>
              <td>{index + 1}</td>
              <td>{colaborador.userName}</td>
              <td>{colaborador.role}</td>
              <td>{colaborador.bought_sold}</td>
              <td><a href="#">Ver</a></td>
              <td>{colaborador.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellersScreen;

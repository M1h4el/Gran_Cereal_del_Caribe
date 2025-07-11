import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { Button, Stack, Typography } from "@mui/material";
import RecenterMap from "./RecenterMap";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";

export const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
export const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
export const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      onSelect(newPosition);
      console.log("Posición seleccionada:", newPosition);
    },
  });
  return null;
}

export default function MapWithSearch({
  countryParam,
  cityParam,
  neighborhoodParam,
  addressParam,
  onClose,
  markerPosition,
  onSelect,
}) {
  console.log("Render MapWithSearch - Props:", {
    countryParam,
    cityParam,
    neighborhoodParam,
    addressParam,
    markerPosition,
  });

  const [selectedPosition, setSelectedPosition] = useState(null);
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Efecto para geolocalización o búsqueda inicial
  useEffect(() => {
    if (!cityParam || !countryParam) {
      console.log("Faltan parámetros para búsqueda (ciudad o país)");
      return;
    }

    const fullQuery = [addressParam, neighborhoodParam, cityParam, countryParam]
      .filter(Boolean)
      .join(", ");

    const geocode = async () => {
      try {
        let res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            fullQuery
          )}`
        );
        
        if (!res.ok) {
          throw new Error(`Error en la búsqueda: ${res.statusText}`);
        }

        let data = await res.json();

        if (data.length === 0) {
          const fallbackQuery = [neighborhoodParam, cityParam, countryParam]
            .filter(Boolean)
            .join(", ");

          res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              fallbackQuery
            )}`
          );
          data = await res.json();
          console.log("Resultados búsqueda alternativa:", data);
        }

        if (data.length > 0) {
          const { lat, lon } = data[0];
          const coords = [parseFloat(lat), parseFloat(lon)];
          setMapCenter(coords);
          setSelectedPosition(coords);
        } else {
          console.warn("Ubicación no encontrada");
          alert("Ubicación no encontrada.");
        }
      } catch (error) {
        console.error("Error en geocoding:", error);
        alert("Error al buscar ubicación.");
      }
    };

    geocode();
  }, [addressParam, neighborhoodParam, cityParam, countryParam]);

  // Efecto para actualizar posición desde props
  useEffect(() => {
    if (map && markerPosition && markerPosition.length === 2) {
      map.setView(markerPosition, 16);
      setSelectedPosition(markerPosition);
    }
  }, [markerPosition, map]);

  const handleMapClick = (position) => {
    setSelectedPosition(position);
    onSelect?.({ lat: position[0], lon: position[1] });
  };

  const handleSave = async () => {
    console.log("Guardando - Posición seleccionada:", selectedPosition);

    if (!selectedPosition) {
      console.warn("Intento de guardar sin posición seleccionada");
      alert("Debes seleccionar una ubicación en el mapa.");
      return;
    }

    const [lat, lon] = selectedPosition;
    console.log("Coordenadas a guardar:", { lat, lon });

    onSelect?.({ lat, lon });
    onClose?.();
  };

  return (
    <Stack
      direction="column"
      alignItems="center"
      width="600px"
      spacing={2}
      sx={{ p: 2 }}
    >
      {mapCenter[0] !== 0 && L && markerIcon ? (
        <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <Typography variant="subtitle1">Ubicación Estimada</Typography>
            <Typography variant="caption">
              {selectedPosition
                ? `Posición seleccionada: ${selectedPosition[0]?.toFixed(
                    4
                  )}, ${selectedPosition[1]?.toFixed(4)}`
                : "No hay posición seleccionada"}
            </Typography>
          </div>
          <MapContainer
            center={mapCenter}
            zoom={16}
            style={{ height: "500px", width: "100%" }}
            whenCreated={(mapInstance) => {
              setMap(mapInstance);
            }}
          >
            <RecenterMap center={mapCenter} zoom={16} />
            <TileLayer
              attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationSelector onSelect={handleMapClick} />
            {selectedPosition && markerIcon && (
              <Marker position={selectedPosition} icon={markerIcon} />
            )}
          </MapContainer>
        </>
      ) : (
        <>
          <div>Cargando mapa...</div>
        </>
      )}

      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="error" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" color="success" onClick={handleSave}>
          Guardar
        </Button>
      </Stack>
    </Stack>
  );
}

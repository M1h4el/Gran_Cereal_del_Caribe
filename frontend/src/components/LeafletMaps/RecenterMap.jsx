import { useMap } from "react-leaflet";
import { useEffect } from "react";

function RecenterMap({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom); // Puedes ajustar el zoom aquí también
    }
  }, [center, map]);

  return null;
}

export default RecenterMap;

import { Box, Typography } from "@mui/material";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import dynamic from "next/dynamic";

// Evita que se renderice en el servidor
const MapComponent = dynamic(
  () =>
    import("@/components/LeafletMaps/Map").then((mod) => {
      // Envuelve el componente para pasarle props
      return function WrappedMap(props) {
        return <mod.default {...props} />;
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "100%", width: "100%" }}>Cargando mapa...</div>
    ),
  }
);

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
    placement="top"
    enterDelay={300}
    leaveDelay={200}
    enterTouchDelay={0}
    leaveTouchDelay={4000}
    disableInteractive={false}
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    height: "auto", // Cambiar a auto
    width: "400px", // Ancho fijo
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
    display: "flex",
    flexDirection: "column",
  },
}));

export default function ToolTipLocation({ value, locationParamObject }) {
  const handlePropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <HtmlTooltip
      onClick={handlePropagation}
      title={
        <>
          {/* <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "250px", // Usar height fijo en lugar de maxHeight
              overflow: "hidden",
              border: "1px solid #eee",
              position: "relative",
            }}
          >
            <MapComponent style={{ width: "100%", height: "100%" }} />
          </div> */}
          <Box
            sx={{
              p: 1,
              height: "180px", // Reducir altura para compensar
              display: "flex",
              gap: "10px",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflowY: "auto", // Permitir scroll si el contenido es muy largo
            }}
          >
            <Typography fontSize={13}>
              <strong>País:</strong> {locationParamObject?.country}
            </Typography>
            <Typography fontSize={13}>
              <strong>Región:</strong> {locationParamObject?.region}
            </Typography>
            <Typography fontSize={13}>
              <strong>Ciudad:</strong> {locationParamObject?.city}
            </Typography>
            <Typography fontSize={13}>
              <strong>Código Postal:</strong> {locationParamObject?.postalCode}
            </Typography>
            <Typography fontSize={13}>
              <strong>Dirección:</strong> {locationParamObject?.address}
            </Typography>
          </Box>
        </>
      }
      PopperProps={{
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
          {
            name: "preventOverflow",
            options: {
              padding: 8,
            },
          },
        ],
        sx: {
          "& .MuiTooltip-tooltip": {
            maxHeight: "none", // ❗ esto quita la limitación
          },
        },
      }}
    >
      <a
        style={{
          color: "#146C94",
          textDecoration: "underline",
          cursor: "pointer",
        }}
        onClick={handlePropagation}
      >
        {value}
      </a>
    </HtmlTooltip>
  );
}

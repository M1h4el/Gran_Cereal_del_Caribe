import { Box, Typography } from "@mui/material";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
    placement="top"
    enterDelay={300}
    leaveDelay={200}
    enterTouchDelay={0}
    leaveTouchDelay={4000}
    disableInteractive={false} // permite interacción con el tooltip
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
  },
}));

export default function ToolTipLocation({ value, locationParamObject }) {
  return (
    <HtmlTooltip
      title={
        <>
            <div style={{height: "250px", width: "280px", display: "flex", justifyContent: "center", alignItems: "center"}}>
                <h2>Mapa</h2>
            </div>
            <Box sx={{ p: 1, height: "200px", display: "flex", gap: "10px", flexDirection: "column", justifyContent: "flex-start" }}>
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
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
    </HtmlTooltip>
  );
}

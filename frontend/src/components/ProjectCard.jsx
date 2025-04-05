import React from "react";
import { Card, CardActionArea, CardMedia, CardContent, Typography, CardActions, Button } from "@mui/material";

const ProjectCard = ({ title, description}) => {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "150px",
      }}
    >
      <CardActionArea sx={{height: "100%"}}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size="small" color="primary">
          Share
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProjectCard
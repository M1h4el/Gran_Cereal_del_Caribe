"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  List,
  ListItem,
  Divider,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
} from "@mui/material";
import { fetchData } from "../../../utils/api";
import notificationType from "../../../utils/handleNotification.json";

function replacePlaceholders(template, data) {
  const placeholders = template.match(/{([^}]+)}/g) || [];
  const dataArray = data.split(";");

  return placeholders.reduce((result, placeholder, index) => {
    const key = placeholder.replace(/[{}]/g, "").trim();
    const value = dataArray[index] || `{${key}}`;
    return result.replace(placeholder, value);
  }, template);
}

function NotificationsContent({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const data = await fetchData(`/notifications?user_id=${userId}`, "GET");
        const notificationsData = data?.notifications || [];
        if (!Array.isArray(notificationsData)) {
          console.error("Error en el servidor o datos inválidos");
          if (isMounted) setNotifications([]);
          return;
        }

        const processedNotif = notificationsData.map((notification) => {
          const template = notificationType[notification.type];
          if (template) {
            const description = replacePlaceholders(
              template.description,
              notification.info || ""
            );
            return { ...notification, ...template, description };
          }
          return notification;
        });

        if (isMounted) setNotifications(processedNotif);
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
        if (isMounted) setNotifications([]);
      }
    };

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);
    };
  }, [userId]);

  return (
    <>
      <h1 className="index">
        Notificaciones
      <hr />
      </h1>

      <List sx={{ width: "100%", bgcolor: "#f5f5f5" }}>
        {notifications.length === 0 ? (
          <Typography sx={{ padding: 2, textAlign: "center" }}>
            No hay notificaciones por el momento.
          </Typography>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.idnotifications ?? index}>
              <ListItem alignItems="flex-start" sx={{ cursor: "pointer"}}>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {notification.description}
                    </Typography>
                  }
                />
              </ListItem>
              {index !== notifications.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))
        )}
      </List>
    </>
  );
}

export default NotificationsContent;

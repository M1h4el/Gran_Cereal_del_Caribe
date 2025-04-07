'use client'

import React, { useEffect, useState } from 'react'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { fetchData } from "../../../utils/api";
import handleNotification from '../../../utils/handleNotification';

function NotificationsContent({userId}) {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const jsonData = await fetchData(`/notifications?user_id=${userId}`);
        const formatted = handleNotification({ notifications: jsonData.notifications });
        setNotifications(formatted);
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <>
      <h1>Notificaciones</h1>
      <h4>Recibe las últimas actualizaciones de los proyectos en los que participas</h4>
      <hr />
      <List sx={{ width: "100%", bgcolor: "#f5f5f5" }}>
        {notifications.length === 0 ? (
          <Typography sx={{ padding: 2, textAlign: "center" }}>
            No hay notificaciones por el momento.
          </Typography>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.idnotifications || index}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "#1976d2" }}>
                    🛎️
                  </Avatar>
                </ListItemAvatar>
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

export default NotificationsContent
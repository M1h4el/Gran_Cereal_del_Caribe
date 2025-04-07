import React from 'react'

function handleNotification({notifications}) {

    const notificationType = {
        0: {
            title: "Nueva actividad",
            description: "Tienes una nueva actividad en tu proyecto.",
            icon: "🛎️"
        },
        1: {
            title: "Nuevo Colaborador",
            description: "El usuario {userName} con código {userCode} está solicitando unirse como colaborador.",
        },
        2: {
            title: "Nueva Sucursal",
            description: "Has creado la sucursal {branch}, ahora puedes agregar colaboradores y registrar tus productos.",
        },
        3: {
          title: "Nueva venta registrada",
          description: "Se ha creado una nueva venta asociada al cliente {userName}, registrado con code {userCode} con fecha de entrega {date}."
        },
        4: {
          title:"Venta Entregada",
          description: "Se ha registrado la entrega de la venta {Ventacode} al cliente"
        }
    }

    return notifications.map((element) => {
        const type = element.type;
    
        let base = notificationType[type] || {
          title: "Notificación",
          description: "Tienes una nueva notificación.",
          icon: "🔔"
        };
    
        // Reemplazar variables dinámicas en la descripción
        let description = base.description
          .replace("{userName}", element.user || "(user)")
          .replace("{userCode}", element.code || "(code)")
          .replace("{branch}", element.branch || "(branch)");
    
        return {
          id: element.idnotifications,
          title: base.title,
          description,
          icon: base.icon
        };
      });
}

export default handleNotification
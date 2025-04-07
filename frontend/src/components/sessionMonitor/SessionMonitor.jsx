"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SessionMonitor() {
  const { data: session, update } = useSession();
  const [showPrompt, setShowPrompt] = useState(false);
  const [logoutTimer, setLogoutTimer] = useState(null);

  useEffect(() => {
    if (!session?.expires) return;

    const expirationTime = new Date(session.expires).getTime();
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    const promptTime = timeUntilExpiration - 30 * 1000; // 30 segundos antes

    let warningTimer;
    let logoutTimerId;

    if (promptTime > 0) {
      warningTimer = setTimeout(() => {
        setShowPrompt(true);
      }, promptTime);

      logoutTimerId = setTimeout(() => {
        signOut();
      }, timeUntilExpiration);

      setLogoutTimer(logoutTimerId);
    } else {
      signOut({callbackUrl: "/"}); // Si ya pasó el tiempo de expiración, cerrar sesión inmediatamente
    }

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimerId);
    };
  }, [session]);

  const handleStayLoggedIn = async () => {
    setShowPrompt(false);
    if (logoutTimer) clearTimeout(logoutTimer);

    if (typeof update === "function") {
      await update();
    }
  };

  return (
    <>
      {showPrompt && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            backgroundColor: "#facc15",
            color: "#1f2937",
            padding: "1.5rem",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          <p style={{ marginBottom: "10px" }}>
            ⚠️ Tu sesión está por expirar. ¿Deseas continuar?
          </p>
          <button
            onClick={handleStayLoggedIn}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Continuar sesión
          </button>
        </div>
      )}
    </>
  );
}
import { useState, useEffect, useRef } from "react";
import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8180",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "portfolio",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "portfolio-app",
};

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const keycloakRef = useRef<Keycloak | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const kc = new Keycloak(keycloakConfig);
    keycloakRef.current = kc;

    kc.init({ onLoad: "login-required", checkLoginIframe: false })
      .then((auth) => {
        setAuthenticated(auth);
        setToken(kc.token || null);
        setLoading(false);

        // Refresh token periodically
        setInterval(() => {
          kc.updateToken(30)
            .then((refreshed) => {
              if (refreshed) {
                setToken(kc.token || null);
              }
            })
            .catch(() => {
              kc.login();
            });
        }, 30000);
      })
      .catch((err) => {
        console.error("Keycloak init failed:", err);
        setLoading(false);
      });
  }, []);

  const logout = () => {
    keycloakRef.current?.logout();
  };

  return { authenticated, token, loading, logout };
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  weaviate: {
    url: process.env.WEAVIATE_URL || "http://localhost:8080",
  },

  keycloak: {
    url: process.env.KEYCLOAK_URL || "http://localhost:8180",
    realm: process.env.KEYCLOAK_REALM || "portfolio",
    clientId: process.env.KEYCLOAK_CLIENT_ID || "portfolio-app",
  },

  get keycloakIssuer() {
    return `${this.keycloak.url}/realms/${this.keycloak.realm}`;
  },

  get keycloakJwksUri() {
    return `${this.keycloakIssuer}/protocol/openid-connect/certs`;
  },
};

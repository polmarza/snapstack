import { createFrontendApiProxyHandlers } from "@clerk/nextjs/server";

/**
 * Proxy de la Frontend API de Clerk (v7 / Core 3). En producción, clerk-js y
 * sus llamadas a la API se sirven a través de la propia app en `/__clerk/…` —
 * sin este handler, el navegador recibe 404, el script nunca carga y el botón
 * de entrar no hace nada. En desarrollo no se nota: las claves `pk_test` cargan
 * clerk-js directamente del dominio de Clerk.
 */
export const { GET, POST, PUT, DELETE, PATCH } = createFrontendApiProxyHandlers();

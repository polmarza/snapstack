import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk gestiona la sesión en todas las rutas; ninguna ruta exige login (el
 * feed es público). Las rutas protegidas llegarán con onboarding/settings.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo excepto estáticos e internals de Next.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // El proxy de la Frontend API de Clerk: sus peticiones (incluidos los .js
    // de clerk-js, que la exclusión de estáticos dejaría fuera) deben pasar por
    // clerkMiddleware o el handler de /__clerk falla con 500.
    "/__clerk/:path*",
  ],
};

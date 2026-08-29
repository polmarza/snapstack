import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

/**
 * `metadataBase` convierte en absolutas las URLs relativas de og:image (la ficha
 * de /api/og). Sin él, quien comparta un perfil no vería la portada: los
 * scrapers de redes no resuelven rutas relativas.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "snapstack",
  description:
    "A curated profile for your GitHub repos + a visual feed to discover what other devs are building.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
        <body className="font-sans antialiased">
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { getTenantName } from "@/lib/tenant";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const name = await getTenantName();
  return {
    title: {
      template: `%s — ${name}`,
      default: `${name} — Evangelio, discipulado y comunidad`,
    },
    description: `Plataforma digital evangelística: conoce el Plan de Salvación, crece en la fe con estudios bíblicos por niveles y conéctate con la comunidad de ${name}.`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

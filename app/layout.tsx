import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif elegante usada nos títulos do site público e do login (design importado do login_site).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * O favicon vem de `app/icon.png` e `app/apple-icon.png`, detectados por convenção do App Router —
 * os dois são gerados a partir de `public/logo/logotipo.png` (recorte quadrado da arte + redução).
 */
export const metadata: Metadata = {
  title: "Essencial Centro",
  description: "Estética, saúde e bem-estar com acompanhamento clínico digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${jakartaSans.variable} ${inter.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

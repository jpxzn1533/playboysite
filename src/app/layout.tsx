import type { Metadata } from "next";
import { Inter, Space_Grotesk, Rubik_Spray_Paint } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CartProvider } from "@/components/cart/CartProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Kept for numeric/data headings that must stay legible (stat cards, tables).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// Graffiti font used on brand + display titles.
const graffiti = Rubik_Spray_Paint({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PlayBoy Store — Produtos premium para o seu Discord",
    template: "%s · PlayBoy Store",
  },
  description:
    "Os melhores produtos para a sua experiência no Discord. Nitro, boosts, cargos VIP, bots e serviços com entrega rápida e segura.",
  keywords: ["Discord", "Nitro", "Boost", "VIP", "PlayBoy Store", "loja"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} ${graffiti.variable}`}
    >
      <body className="font-sans">
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrkUp — sua rede, seu tempo",
  description:
    "OrkUp é a rede social que traz de volta comunidades, timeline cronológica sem algoritmo e conversas de verdade entre amigos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

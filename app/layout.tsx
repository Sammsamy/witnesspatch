import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WitnessPatch",
    template: "%s · WitnessPatch",
  },
  description:
    "Bind authored fact reveal times and action deadlines, compile a synthetic failure into a red Node test, and separately verify a retained healthcare-agent repair.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

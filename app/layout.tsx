import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WitnessPatch",
    template: "%s · WitnessPatch",
  },
  description:
    "Turn a synthetic healthcare-agent failure into a replayable test, then check a human-gated repair against locked rules.",
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

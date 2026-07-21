import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WitnessPatch",
    template: "%s | WitnessPatch",
  },
  description:
    "Compare recorded agent runs under the same deadline rules, then turn a missed action into a Node test developers can keep in CI.",
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

import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sovereignmonad.xyz"),
  title: "Sovereign Monad",
  description:
    "An AI-native economic organism built on Monad. Live Revenue Router, EmergenceRecorder, Agent 0 genesis registration, and behavioral claim proof on Monad mainnet.",
  applicationName: "Sovereign Monad",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Sovereign Monad",
    description:
      "Anatomy of an AI-Native Economic Organism. Live on Monad mainnet.",
    url: "https://sovereignmonad.xyz",
    siteName: "Sovereign Monad",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Sovereign Monad",
    description:
      "An AI-native economic organism built exclusively on Monad."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

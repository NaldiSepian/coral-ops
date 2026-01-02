import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { ThemeProvider } from "next-themes";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CoralOps - Sistem Pelaporan Lapangan CV. Coral",
  description: "Sistem digital untuk pelaporan kegiatan teknisi, manajemen tenaga kerja, validasi dengan geolocation, dan monitoring progres proyek secara real-time pada CV. Coral.",
};

const quicksand = Quicksand({
  variable: "--font-quicksand",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

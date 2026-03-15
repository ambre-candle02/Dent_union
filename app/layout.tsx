import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DentUnion | Professional Dental Knowledge & Real-Time Research Hub",
  description: "The premium network for Dentists. Get real-time dental research updates, clinical cases, and global industry news curated from ADA, FDI, and PubMed.",
  keywords: ["dentistry", "dental news", "ADA", "FDI", "dental research", "oral health", "clinical cases", "dentunion"],
  openGraph: {
    title: "DentUnion - Professional Dental Knowledge Hub",
    description: "Real-time Dental News and Research for modern practitioners.",
    url: "https://dent-union.vercel.app",
    siteName: "DentUnion",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DentUnion | Professional Dental Hub",
    description: "LinkedIn for Dentists - Real-time Research & Community.",
  },
  robots: "index, follow",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

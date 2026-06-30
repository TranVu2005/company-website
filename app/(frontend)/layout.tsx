import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
// CSS tùy chỉnh của các component (navbar, hero, services... + biến --accent-primary).
// Import sau globals.css để ghi đè reset của Tailwind khi cần.
import "@/src/styles/index.css";

import { SearchProvider } from "@/components/SearchContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchOverlay from "@/components/SearchOverlay";
import ScrollAnimations from "@/components/ScrollAnimations";
import Analytics from "@/components/Analytics";
import OrganizationSchema from "@/components/OrganizationSchema";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Định Hình Tương Lai Số`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Định Hình Tương Lai Số`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Định Hình Tương Lai Số`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning>
        <OrganizationSchema />
        <SearchProvider>
          <div id="app">
            <Navbar />
            {children}
            <Footer />
          </div>
          <SearchOverlay />
          <ScrollAnimations />
        </SearchProvider>
        <Analytics />
      </body>
    </html>
  );
}

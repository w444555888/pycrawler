import type { Metadata } from "next";
import { Providers } from "./providers";
import { AppInitializer } from "@/components/AppInitializer";
import "@/app.scss";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export const metadata: Metadata = {
  title: "Travel App",
  description: "Travel booking and management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}

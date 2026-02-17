import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getWorkspaces } from "@/lib/api";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Stward Task",
  description: "Gestión de proyectos Kanban",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workspaces = await getWorkspaces();

  return (
    <html lang="es">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar initialWorkspaces={workspaces} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

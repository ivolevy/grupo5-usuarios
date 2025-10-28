import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { UsersProvider } from "@/contexts/users-context"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { PasswordReminderWrapper } from "@/components/users/password-reminder-wrapper"
import "./globals.css"

export const metadata: Metadata = {
  title: "SkyTrack",
  description: "Sistema de gestión de usuarios",
  generator: "v0.app",
        icons: {
          icon: "/images/skytrack-icon.png",
        },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <AuthProvider>
            <UsersProvider>
              {children}
              <PasswordReminderWrapper />
            </UsersProvider>
          </AuthProvider>
        </Suspense>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}

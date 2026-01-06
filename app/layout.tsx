import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { BottomNav } from "@/components/bottom-nav"

import { Toaster } from "@/components/ui/sonner"
import { SiteChatbot } from "@/components/site-chatbot"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Movie Lovers",
  description: "Your ultimate source for movie news and reviews",
  generator: "Next.js",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.ico",
    shortcut: "/icon.ico",
    apple: "/icon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Movie Lovers",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

import { GlobalNotificationListener } from "@/components/global-notification-listener"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <GlobalNotificationListener />
            {children}
          </AuthProvider>
          <BottomNav />
          <SiteChatbot />
          <Toaster position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

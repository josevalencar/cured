import type { Metadata } from "next"
import Image from "next/image"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CURED — Clark University Renewable Energy Dashboard",
  description:
    "Real-time monitoring dashboard for Clark University's on-campus microgrid: solar panels, wind turbines, and battery storage.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <header className="sticky top-0 z-50 border-b border-white/10 bg-clark-red text-white shadow-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Image
                src="/clark.png"
                alt="Clark University seal"
                width={36}
                height={36}
                className="rounded-full"
              />
              <div>
                <h1 className="text-lg font-semibold leading-tight tracking-tight">
                  CURED
                </h1>
                <p className="text-xs leading-tight text-white/75">
                  Clark University Renewable Energy Dashboard
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              PHYS 243/343
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t bg-white py-6 text-center text-xs text-muted-foreground">
          <p>
            Clark University &middot; Department of Physics &middot; Professor
            Agosta
          </p>
          <p className="mt-1">
            PHYS 243/343 - Technology of Renewable Energy
          </p>
        </footer>
      </body>
    </html>
  )
}

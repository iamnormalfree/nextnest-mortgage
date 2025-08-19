import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NextNest - Modern Mortgage Solutions',
  description: 'Get the best mortgage rates and expert advice for your Singapore property',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <span className="text-2xl font-gilda font-bold text-[#0D1B2A]">NextNest</span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#hero" className="text-gray-700 hover:text-[#4A90E2] transition">Home</a>
                <a href="#services" className="text-gray-700 hover:text-[#4A90E2] transition">Services</a>
                <a href="#contact" className="text-gray-700 hover:text-[#4A90E2] transition">Contact</a>
                <a href="/dashboard" className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-md transition">
                  Dashboard
                </a>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

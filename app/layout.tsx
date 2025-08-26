import type { Metadata } from 'next'
import Image from 'next/image'
import './globals.css'
import Logo from '@/assets/nn-logo-nobg-img.png'

export const metadata: Metadata = {
  title: 'NextNest - Singapore\'s Most Transparent Mortgage Advisor',
  description: 'Singapore\'s only mortgage advisor who shows you ALL your options - AI-powered analysis with complete transparency. See repricing, switching, or staying put options.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <a href="/" className="flex items-center">
                  <Image
                    src={Logo}
                    alt="NextNest Logo"
                    className="h-10 w-auto"
                    priority
                  />
                </a>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#hero" className="text-nn-grey-dark hover:text-nn-gold transition">Home</a>
                <a href="#services" className="text-nn-grey-dark hover:text-nn-gold transition">Services</a>
                <a href="#contact" className="text-nn-grey-dark hover:text-nn-gold transition">Contact</a>
                <a href="/dashboard" className="btn-primary rounded-md transition">
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


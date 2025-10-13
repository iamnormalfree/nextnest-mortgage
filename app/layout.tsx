import type { Metadata } from 'next'
import './globals.css'
import { ConditionalNav } from '@/components/ConditionalNav'

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
        <ConditionalNav />
        {children}
      </body>
    </html>
  )
}


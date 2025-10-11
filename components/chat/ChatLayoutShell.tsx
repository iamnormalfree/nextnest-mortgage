'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/assets/nn-logo-nobg-img.png'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

interface ChatLayoutShellProps {
  leftSidebar?: ReactNode
  mainContent?: ReactNode
  children?: ReactNode
}

export const ChatLayoutShell: React.FC<ChatLayoutShellProps> = ({
  leftSidebar,
  mainContent,
  children
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Single Clean Header - 48px */}
      <header className="h-12 bg-white border-b border-fog">
        <div className="h-full flex items-center justify-between px-6">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-4">
            <Image
              src={Logo}
              alt="NextNest"
              className="h-8 w-auto"
              priority
            />
            <div className="h-6 w-px bg-fog" />
            <span className="text-sm font-light text-ink">
              AI Mortgage Advisor
            </span>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="h-8 px-4 text-xs uppercase tracking-wider text-graphite hover:text-ink transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Form</span>
            </Link>
            <Link
              href="/dashboard"
              className="h-8 px-4 text-xs uppercase tracking-wider text-white bg-gold hover:bg-gold-dark transition-colors duration-200 flex items-center gap-2"
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout - Full Height */}
      <div className="flex h-[calc(100vh-48px)]">
        {/* Left Sidebar - Wider 280px */}
        {leftSidebar && (
          <aside className="w-72 bg-white border-r border-fog">
            {leftSidebar}
          </aside>
        )}

        {/* Main Chat Area - Takes Remaining Space */}
        <main className="flex-1 flex flex-col bg-white">
          {mainContent || children}
        </main>
      </div>
    </div>
  )
}

export default ChatLayoutShell
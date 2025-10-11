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
    <div className="min-h-screen bg-mist">
      {/* Sticky Header */}
      <header className="sticky top-12 z-40 h-12 bg-white border-b border-fog">
        <div className="h-full flex items-center justify-between px-4">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-3">
            <Image
              src={Logo}
              alt="NextNest"
              className="h-8 w-auto"
              priority
            />
            <span className="text-sm font-medium text-ink hidden sm:inline">
              AI Mortgage Advisor
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="h-8 px-3 text-xs font-medium text-charcoal hover:text-gold transition-colors duration-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Form</span>
            </Link>
            <Link
              href="/dashboard"
              className="h-8 px-3 text-xs font-medium text-charcoal hover:text-gold transition-colors duration-200 flex items-center gap-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex">
        {/* Left Sidebar - Hidden on mobile */}
        {leftSidebar && (
          <aside className="hidden lg:block w-60 bg-white border-r border-fog h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto">
            {leftSidebar}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 min-h-[calc(100vh-3rem)]">
          {mainContent || children}
        </main>
      </div>
    </div>
  )
}

export default ChatLayoutShell
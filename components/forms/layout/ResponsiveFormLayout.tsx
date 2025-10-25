// ABOUTME: Mobile-first responsive layout container with conditional sidebar rendering

'use client'

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import '@/styles/progressive-form-layout.css'

interface ResponsiveFormLayoutProps {
  children: React.ReactNode          // Main form content
  sidebar?: React.ReactNode          // Optional sidebar (instant analysis)
  showSidebar: boolean               // Control sidebar visibility
}

export function ResponsiveFormLayout({
  children,
  sidebar,
  showSidebar
}: ResponsiveFormLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  // Mobile (<768px): No sidebar, single column
  if (isMobile) {
    return (
      <div className="form-layout-container">
        <div className="form-content">
          {children}
        </div>
      </div>
    )
  }

  // Desktop (≥1024px): 2-column grid with sticky sidebar
  if (isDesktop && showSidebar && sidebar) {
    return (
      <div className="form-layout-container">
        <div className="form-content">
          {children}
        </div>
        <aside className="form-sidebar">
          {sidebar}
        </aside>
      </div>
    )
  }

  // Tablet or sidebar hidden: Single column
  return (
    <div className="form-layout-container">
      <div className="form-content">
        {children}
      </div>
    </div>
  )
}

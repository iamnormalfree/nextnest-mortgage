import { render, screen } from '@testing-library/react'
import { ResponsiveFormLayout } from '@/components/forms/layout/ResponsiveFormLayout'

// Mock useResponsiveLayout hook
jest.mock('@/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: jest.fn()
}))

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

describe('ResponsiveFormLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders inline layout on mobile (no sidebar)', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      width: 375
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument()
  })

  it('renders sidebar on desktop when showSidebar=true', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1440
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument()
  })

  it('hides sidebar when showSidebar=false even on desktop', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1440
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar={false}>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument()
  })

  it('renders single column on tablet', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      width: 900
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    // Tablet behavior: can decide to show/hide sidebar, for now hide
    expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument()
  })
})

// ABOUTME: Tests for ConditionalNav component - conditional rendering based on route
// ABOUTME: Validates FormNav integration for /apply route and navigation hiding for internal tools

import React from 'react'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { ConditionalNav } from '../ConditionalNav'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

// Mock FormNav component
jest.mock('../FormNav', () => ({
  FormNav: ({ showGetStarted }: any) => (
    <div data-testid="form-nav">
      <span>FormNav Component</span>
      {showGetStarted && <span>Get Started Button</span>}
    </div>
  ),
}))

// Mock feature flags
jest.mock('@/lib/features/feature-flags', () => ({
  FEATURE_FLAGS: {
    USE_SOPHISTICATED_FLOW: false,
  },
}))

// Mock Sheet components
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
}))

describe('ConditionalNav Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/apply Route - FormNav Integration', () => {
    it('should render FormNav component on /apply route', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/apply')

      render(<ConditionalNav />)

      const formNav = screen.getByTestId('form-nav')
      expect(formNav).toBeInTheDocument()
      expect(formNav).toHaveTextContent('FormNav Component')
    })

    it('should pass showGetStarted=true to FormNav on /apply route', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/apply')

      render(<ConditionalNav />)

      const formNav = screen.getByTestId('form-nav')
      expect(formNav).toHaveTextContent('Get Started Button')
    })

    it('should render FormNav for /apply with query params', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/apply?loanType=new_purchase')

      render(<ConditionalNav />)

      const formNav = screen.getByTestId('form-nav')
      expect(formNav).toBeInTheDocument()
    })
  })

  describe('Hidden Routes', () => {
    it('should hide navigation for /validation-dashboard', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/validation-dashboard')

      const { container } = render(<ConditionalNav />)

      expect(container.firstChild).toBeNull()
    })

    it('should hide navigation for /chat', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/chat')

      const { container } = render(<ConditionalNav />)

      expect(container.firstChild).toBeNull()
    })

    it('should hide navigation for /redesign/* pages', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/redesign/homepage')

      const { container } = render(<ConditionalNav />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Homepage Navigation', () => {
    it('should render standard navigation on homepage', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/')

      render(<ConditionalNav />)

      // Should render standard nav (not FormNav)
      const formNav = screen.queryByTestId('form-nav')
      expect(formNav).not.toBeInTheDocument()

      // Should have navigation links
      const homeLink = screen.getByText('Home')
      expect(homeLink).toBeInTheDocument()
    })
  })

  describe('Standard Navigation Routes', () => {
    it('should render standard navigation on other routes', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/calculator')

      render(<ConditionalNav />)

      // Should NOT render FormNav
      const formNav = screen.queryByTestId('form-nav')
      expect(formNav).not.toBeInTheDocument()

      // Should render standard navigation
      const logo = screen.getByAltText('NextNest Logo')
      expect(logo).toBeInTheDocument()
    })
  })
})

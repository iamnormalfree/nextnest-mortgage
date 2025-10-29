// ABOUTME: Tests for FormNav component - standardized navigation for form flow pages
// ABOUTME: Validates conditional rendering, click behavior, and design system compliance

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { FormNav } from '../FormNav'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

describe('FormNav Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Basic Rendering', () => {
    it('should render logo with link to homepage', () => {
      render(<FormNav />)

      const logo = screen.getByAltText('NextNest Logo')
      expect(logo).toBeInTheDocument()

      const logoLink = logo.closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('should render "Back to Home" link', () => {
      render(<FormNav />)

      const backLink = screen.getByText('Back to Home')
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/')
    })

    it('should not render "Get Started" button by default', () => {
      render(<FormNav />)

      const getStartedButton = screen.queryByText(/Get Started/)
      expect(getStartedButton).not.toBeInTheDocument()
    })
  })

  describe('Conditional Get Started Button', () => {
    it('should render "Get Started" button when showGetStarted=true', () => {
      render(<FormNav showGetStarted={true} />)

      const getStartedButton = screen.getByText(/Get Started/)
      expect(getStartedButton).toBeInTheDocument()
      expect(getStartedButton.tagName).toBe('BUTTON')
    })

    it('should not render "Get Started" button when showGetStarted=false', () => {
      render(<FormNav showGetStarted={false} />)

      const getStartedButton = screen.queryByText(/Get Started/)
      expect(getStartedButton).not.toBeInTheDocument()
    })
  })

  describe('Get Started Button Behavior', () => {
    it('should scroll to #loan-selector by default when clicked', () => {
      // Mock DOM element and scrollIntoView
      const mockLoanSelector = document.createElement('div')
      mockLoanSelector.id = 'loan-selector'
      mockLoanSelector.scrollIntoView = jest.fn()
      document.body.appendChild(mockLoanSelector)

      render(<FormNav showGetStarted={true} />)

      const getStartedButton = screen.getByText(/Get Started/)
      fireEvent.click(getStartedButton)

      expect(mockLoanSelector.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

      document.body.removeChild(mockLoanSelector)
    })

    it('should call custom onGetStartedClick when provided', () => {
      const mockOnClick = jest.fn()
      render(<FormNav showGetStarted={true} onGetStartedClick={mockOnClick} />)

      const getStartedButton = screen.getByText(/Get Started/)
      fireEvent.click(getStartedButton)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should not scroll when custom onGetStartedClick is provided', () => {
      const mockLoanSelector = document.createElement('div')
      mockLoanSelector.id = 'loan-selector'
      mockLoanSelector.scrollIntoView = jest.fn()
      document.body.appendChild(mockLoanSelector)

      const mockOnClick = jest.fn()
      render(<FormNav showGetStarted={true} onGetStartedClick={mockOnClick} />)

      const getStartedButton = screen.getByText(/Get Started/)
      fireEvent.click(getStartedButton)

      expect(mockLoanSelector.scrollIntoView).not.toHaveBeenCalled()
      expect(mockOnClick).toHaveBeenCalledTimes(1)

      document.body.removeChild(mockLoanSelector)
    })
  })

  describe('Design System Compliance', () => {
    it('should have fixed positioning at top', () => {
      const { container } = render(<FormNav />)

      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('fixed', 'top-0', 'z-50')
    })

    it('should have correct height classes', () => {
      const { container } = render(<FormNav />)

      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('h-14', 'sm:h-16')
    })

    it('should have white background and border', () => {
      const { container } = render(<FormNav />)

      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('bg-white', 'border-b')
    })

    it('"Back to Home" link should have correct styling', () => {
      render(<FormNav />)

      const backLink = screen.getByText('Back to Home')
      expect(backLink).toHaveClass('text-sm', 'transition-colors')
    })

    it('"Get Started" button should have yellow background', () => {
      render(<FormNav showGetStarted={true} />)

      const button = screen.getByText(/Get Started/)
      expect(button).toHaveClass('bg-[#FCD34D]', 'hover:bg-[#FBB614]')
    })

    it('"Get Started" button should NOT have rounded corners', () => {
      render(<FormNav showGetStarted={true} />)

      const button = screen.getByText(/Get Started/)
      const classNames = button.className

      // Verify NO rounded classes (Swiss spa sharp rectangles)
      expect(classNames).not.toMatch(/rounded/)
    })
  })

  describe('Props Handling', () => {
    it('should accept currentStep prop for analytics', () => {
      // Should not error with currentStep prop
      expect(() => {
        render(<FormNav currentStep={2} />)
      }).not.toThrow()
    })

    it('should render correctly with all props', () => {
      const mockOnClick = jest.fn()
      render(
        <FormNav
          showGetStarted={true}
          onGetStartedClick={mockOnClick}
          currentStep={3}
        />
      )

      expect(screen.getByText('Back to Home')).toBeInTheDocument()
      expect(screen.getByText(/Get Started/)).toBeInTheDocument()
    })
  })
})

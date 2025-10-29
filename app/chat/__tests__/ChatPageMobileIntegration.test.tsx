// File: app/chat/__tests__/ChatPageMobileIntegration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import ChatContent from '../page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn()
  }))
}))

// Mock ResponsiveBrokerShell (we'll verify it gets called)
jest.mock('@/components/ai-broker/ResponsiveBrokerShell', () => ({
  ResponsiveBrokerShell: jest.fn(({ conversationId }) => (
    <div data-testid="responsive-broker-shell">
      ConversationId: {conversationId}
    </div>
  ))
}))

// Mock feature flags
jest.mock('@/lib/features/feature-flags', () => ({
  FEATURE_FLAGS: {
    MOBILE_AI_BROKER_UI: true
  }
}))

describe('ChatPage Mobile Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock sessionStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'form_data') {
        return JSON.stringify({
          name: 'Test User',
          email: 'test@example.com'
        })
      }
      return null
    })
  })

  it('renders ResponsiveBrokerShell when conversationId exists', async () => {
    // Arrange
    const mockSearchParams = new URLSearchParams('conversation=12345')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    // Act
    render(<ChatContent />)

    // Assert
    await waitFor(() => {
      const shell = screen.getByTestId('responsive-broker-shell')
      expect(shell).toBeInTheDocument()
      expect(shell).toHaveTextContent('ConversationId: 12345')
    })
  })

  it('passes user data from sessionStorage to ResponsiveBrokerShell', async () => {
    // Arrange
    const mockSearchParams = new URLSearchParams('conversation=12345')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    // Act
    render(<ChatContent />)

    // Assert
    await waitFor(() => {
      const { ResponsiveBrokerShell } = require('@/components/ai-broker/ResponsiveBrokerShell')
      expect(ResponsiveBrokerShell).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 12345,
          formData: expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com'
          })
        }),
        expect.anything()
      )
    })
  })

  it('renders empty state card when no conversationId', async () => {
    // Arrange
    const mockSearchParams = new URLSearchParams('')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    // Act
    render(<ChatContent />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Analysis not ready yet')).toBeInTheDocument()
      expect(screen.getByText('Start Your Analysis')).toBeInTheDocument()
    })
  })
})

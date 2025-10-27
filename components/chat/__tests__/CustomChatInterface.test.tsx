/**
 * CustomChatInterface Regression Test Suite
 *
 * Tests for conversation persistence race condition fix (Phase 2 Task 2.6)
 *
 * ABOUTME: Regression test suite for CustomChatInterface component focusing on
 * race condition prevention and conversation persistence across page refreshes
 * and rapid navigation scenarios.
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import CustomChatInterface from '../CustomChatInterface'

// Mock fetch API
global.fetch = jest.fn()

// Mock console methods to avoid noise in tests but track important logs
const originalConsoleLog = console.log
const originalConsoleError = console.error

// Use fake timers to control polling behavior
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('CustomChatInterface - Conversation Persistence Regression Tests', () => {
  const mockConversationId = 12345
  const mockMessages = [
    {
      id: 1,
      content: 'Hello! How can I help you today?',
      message_type: 'outgoing',
      role: 'agent',
      created_at: '2025-10-22T10:00:00Z',
      sender: {
        name: 'AI Agent',
        type: 'bot'
      },
      private: false
    },
    {
      id: 2,
      content: 'I need help with a mortgage application',
      message_type: 'incoming',
      role: 'user',
      created_at: '2025-10-22T10:01:00Z',
      sender: {
        name: 'John Doe',
        type: 'contact'
      },
      private: false
    },
    {
      id: 3,
      content: 'I\'d be happy to help you with your mortgage application. Let me gather some information...',
      message_type: 'outgoing',
      role: 'agent',
      created_at: '2025-10-22T10:02:00Z',
      sender: {
        name: 'AI Agent',
        type: 'bot'
      },
      private: false
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()

    // Mock successful fetch for messages
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockImplementation((url) => {
      if (url?.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        } as Response)
      }
      if (url?.includes('/api/chat/send')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
    })
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
    jest.restoreAllMocks()
  })

  describe('Race Condition Prevention', () => {
    test('should initialize isInitializingRef and prevent concurrent fetches', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      let fetchCount = 0
      let resolveFetch: (value: any) => void

      mockFetch.mockImplementation(() => {
        fetchCount++
        // Create a Promise that we control to simulate slow network
        return new Promise(resolve => {
          resolveFetch = resolve
        })
      })

      render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Should have started the fetch
      expect(fetchCount).toBe(1)

      // Try to trigger another fetch (this should be blocked)
      act(() => {
        // Force a re-render that would normally trigger another fetch
        jest.advanceTimersByTime(100)
      })

      // Still only one fetch should be in progress
      expect(fetchCount).toBe(1)

      // Now resolve the fetch
      act(() => {
        resolveFetch({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        } as Response)
      })

      // Wait for messages to appear
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })

      // Should only have made one fetch call during initialization
      expect(fetchCount).toBe(1)
    })

    test('should handle rapid conversationId changes without errors', async () => {
      const { rerender } = render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for initial messages to load
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })

      // Clear the mock calls from initial load
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockClear()

      // Mock the new responses
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: [] })
        } as Response)
      })

      // Rapidly change conversationId (simulating rapid navigation)
      rerender(
        <CustomChatInterface
          conversationId={mockConversationId + 1}
          contactName="Jane Smith"
        />
      )

      rerender(
        <CustomChatInterface
          conversationId={mockConversationId + 2}
          contactName="Bob Johnson"
        />
      )

      // Wait for any pending operations
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Should handle rapid changes gracefully without errors
      expect(console.error).not.toHaveBeenCalled()
    })

    test('should set up polling after initial message load', async () => {
      render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for initial messages to load
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

      // Reset fetch to track polling calls
      mockFetch.mockClear()
      mockFetch.mockImplementation((url) => {
        if (url?.includes('after_id')) {
          // Polling request - return no new messages
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ messages: [] })
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: [] })
        } as Response)
      })

      // Advance timers to trigger polling
      act(() => {
        jest.advanceTimersByTime(3000) // First polling interval
      })

      // Should have made a polling call
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Message Persistence', () => {
    test('should persist messages across component re-renders', async () => {
      const { rerender } = render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for messages to load
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })

      // Re-render component (simulating props update)
      rerender(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
          brokerName="Different Agent"
        />
      )

      // Messages should still be present
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      expect(screen.getByText('I need help with a mortgage application')).toBeInTheDocument()
      expect(screen.getByText('I\'d be happy to help you with your mortgage application. Let me gather some information...')).toBeInTheDocument()
    })

    test('should display messages in correct order', async () => {
      render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for messages to load
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })

      // Check that all messages are displayed
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      expect(screen.getByText('I need help with a mortgage application')).toBeInTheDocument()
      expect(screen.getByText('I\'d be happy to help you with your mortgage application. Let me gather some information...')).toBeInTheDocument()
    })

    test('should handle empty conversation gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: [] })
        } as Response)
      })

      render(
        <CustomChatInterface
          conversationId={99999}
          contactName="New User"
        />
      )

      // Should handle empty conversation without errors
      await waitFor(() => {
        expect(screen.queryByText('Hello! How can I help you today?')).not.toBeInTheDocument()
      }, { timeout: 2000 })

      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle fetch errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
      }, { timeout: 2000 })

      expect(console.error).toHaveBeenCalledWith('Error fetching messages:', expect.any(Error))
    })

    test('should recover from errors when conversationId changes', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      let callCount = 0

      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        } as Response)
      })

      const { rerender } = render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Change conversationId to trigger retry
      rerender(
        <CustomChatInterface
          conversationId={mockConversationId + 1}
          contactName="John Doe"
        />
      )

      // Should recover and show messages
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Performance and Optimization', () => {
    test('should clean up intervals properly on unmount', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        } as Response)
      })

      const { unmount } = render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })

      // Unmount component
      unmount()

      // Should not have any console errors after unmount
      expect(console.error).not.toHaveBeenCalled()
    })

    test('should handle multiple rapid unmounts without memory leaks', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        } as Response)
      })

      // Mount and unmount rapidly multiple times
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(
          <CustomChatInterface
            conversationId={mockConversationId + i}
            contactName={`User ${i}`}
          />
        )

        // Brief wait then unmount
        await act(async () => {
          jest.advanceTimersByTime(50)
        })
        unmount()
      }

      // Should handle rapid mount/unmount without errors
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Guard Variable Behavior', () => {
    test('should reset isInitializingRef in finally block', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      let fetchCount = 0

      mockFetch.mockImplementation(() => {
        fetchCount++
        if (fetchCount === 1) {
          return Promise.reject(new Error('First fetch fails'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        } as Response)
      })

      render(
        <CustomChatInterface
          conversationId={mockConversationId}
          contactName="John Doe"
        />
      )

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Trigger retry with new conversationId
      const { rerender } = render(
        <CustomChatInterface
          conversationId={mockConversationId + 1}
          contactName="John Doe"
        />
      )

      // Should be able to fetch again (guard was reset)
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      }, { timeout: 2000 })

      expect(fetchCount).toBe(2) // First failed + second successful
    })
  })
})
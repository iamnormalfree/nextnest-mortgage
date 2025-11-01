// ABOUTME: Validates chat interface initializes polling only after initial fetch resolves.
// ABOUTME: Prevents regressions where polling starts before messages hydrate.

import { render, waitFor } from '@testing-library/react'
import React from 'react'
import CustomChatInterface from '../CustomChatInterface'

describe('CustomChatInterface initialization', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn()
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('starts polling only after the initial fetch completes', async () => {
    jest.useFakeTimers()

    let resolveFetch: (value: Response) => void = () => {}
    const fetchPromise = new Promise<Response>(resolve => {
      resolveFetch = resolve
    })

    const originalFetch = globalThis.fetch
    const fetchMock = jest.fn(() => fetchPromise)
    ;(globalThis as any).fetch = fetchMock
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval')

    render(
      <CustomChatInterface
        conversationId={123}
        contactName="Test User"
        brokerName="AI Specialist"
      />
    )

    expect(setIntervalSpy).not.toHaveBeenCalled()

    resolveFetch({
      ok: true,
      json: async () => ({ messages: [] })
    } as unknown as Response)

    await waitFor(() => expect(setIntervalSpy).toHaveBeenCalled())

    globalThis.fetch = originalFetch
  })
})

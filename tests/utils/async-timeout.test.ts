// ABOUTME: Exercises async timeout helper to ensure success and failure paths behave.
// ABOUTME: Guards against regressions where operations hang without throwing.

import { describe, expect, it } from '@jest/globals'

describe('withTimeout helper', () => {
  it('resolves when operation finishes before timeout', async () => {
    const { withTimeout } = await import('@/lib/utils/async-timeout')

    const result = await withTimeout(
      async () => {
        return 'ok'
      },
      50,
      'test-operation'
    )

    expect(result).toBe('ok')
  })

  it('rejects when operation exceeds timeout', async () => {
    const { withTimeout, TimeoutError } = await import('@/lib/utils/async-timeout')

    await expect(
      withTimeout(
        () => new Promise(resolve => setTimeout(() => resolve('slow'), 100)),
        20,
        'slow-op'
      )
    ).rejects.toBeInstanceOf(TimeoutError)
  })
})

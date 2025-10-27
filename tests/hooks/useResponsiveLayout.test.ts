import { renderHook, act } from '@testing-library/react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

// Mock window.matchMedia
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes(`${width}px`),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  })

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width
  })
}

describe('useResponsiveLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('detects mobile viewport (<768px)', () => {
    mockMatchMedia(375)

    const { result } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.width).toBe(375)
  })

  it('detects tablet viewport (768-1023px)', () => {
    mockMatchMedia(900)

    const { result } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.width).toBe(900)
  })

  it('detects desktop viewport (≥1024px)', () => {
    mockMatchMedia(1440)

    const { result } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.width).toBe(1440)
  })

  it('updates on window resize', () => {
    mockMatchMedia(375)

    const { result, rerender } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(true)

    // Simulate resize to desktop
    act(() => {
      mockMatchMedia(1440)
      window.dispatchEvent(new Event('resize'))
    })

    rerender()

    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceSession } from '@/hooks/useVoiceSession'

// ─── Browser API mocks ────────────────────────────────────────────────────────

function makeDataChannel() {
  const listeners: Record<string, ((e: MessageEvent | Event) => void)[]> = {}
  return {
    readyState: 'open' as RTCDataChannelState,
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: (type: string, fn: (e: MessageEvent | Event) => void) => {
      listeners[type] = listeners[type] ?? []
      listeners[type].push(fn)
    },
    removeEventListener: vi.fn(),
    dispatchMessage: (data: unknown) => {
      listeners['message']?.forEach(fn =>
        fn(new MessageEvent('message', { data: JSON.stringify(data) }))
      )
    },
    dispatchError: () => {
      listeners['error']?.forEach(fn => fn(new Event('error')))
    },
  }
}

type FakeDC = ReturnType<typeof makeDataChannel>

let fakeDC: FakeDC

const mockCreateOffer = vi.fn().mockResolvedValue({ sdp: 'offer-sdp', type: 'offer' })
const mockSetLocalDescription = vi.fn().mockResolvedValue(undefined)
const mockSetRemoteDescription = vi.fn().mockResolvedValue(undefined)
const mockAddTrack = vi.fn()
const mockPCClose = vi.fn()

vi.stubGlobal('RTCPeerConnection', vi.fn().mockImplementation(() => {
  fakeDC = makeDataChannel()
  return {
    createOffer: mockCreateOffer,
    setLocalDescription: mockSetLocalDescription,
    setRemoteDescription: mockSetRemoteDescription,
    addTrack: mockAddTrack,
    close: mockPCClose,
    createDataChannel: vi.fn().mockReturnValue(fakeDC),
    ontrack: null,
  }
}))

const mockGetUserMedia = vi.fn()
vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: mockGetUserMedia,
  },
})

const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}
const mockAudioSource = {
  connect: vi.fn(),
}
const mockAudioCtxClose = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => ({
  createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
  createMediaStreamSource: vi.fn().mockReturnValue(mockAudioSource),
  close: mockAudioCtxClose,
})))

vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1))
vi.stubGlobal('cancelAnimationFrame', vi.fn())

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeMicStream() {
  return {
    getAudioTracks: () => [{ stop: vi.fn() }],
    getTracks: () => [{ stop: vi.fn() }],
  }
}

function setupFetchMocks(ephemeralToken = 'eph_test') {
  mockFetch.mockImplementation((url: string) => {
    if ((url as string).includes('/api/conversation/realtime/token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ephemeralToken }),
      })
    }
    if ((url as string).includes('api.openai.com')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('answer-sdp'),
      })
    }
    if ((url as string).includes('/api/conversation/realtime/persist')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    }
    return Promise.resolve({ ok: false, status: 404 })
  })
}

describe('useVoiceSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupFetchMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state with zero levels', () => {
    const onTurnComplete = vi.fn()
    const { result } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-id', onTurnComplete })
    )
    expect(result.current.voiceState).toBe('idle')
    expect(result.current.levels).toHaveLength(5)
    expect(result.current.levels.every(l => l === 0)).toBe(true)
  })

  it('calls token endpoint on startVoice', async () => {
    mockGetUserMedia.mockResolvedValue(makeMicStream())
    const onTurnComplete = vi.fn()
    const { result } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-opaque', onTurnComplete })
    )

    await act(async () => {
      await result.current.startVoice()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/conversation/realtime/token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ opaqueId: 'test-opaque' }),
      })
    )
  })

  it('sets voiceState to error when mic permission is denied', async () => {
    mockGetUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
    const onTurnComplete = vi.fn()
    const { result } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-id', onTurnComplete })
    )

    await act(async () => {
      await result.current.startVoice()
    })

    expect(result.current.voiceState).toBe('error')
  })

  it('transitions through states on response.done and calls onTurnComplete', async () => {
    mockGetUserMedia.mockResolvedValue(makeMicStream())
    const onTurnComplete = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-id', onTurnComplete })
    )

    await act(async () => {
      await result.current.startVoice()
    })

    // Simulate assistant transcript arriving
    act(() => {
      fakeDC.dispatchMessage({ type: 'response.audio_transcript.done', transcript: 'Here is my response' })
    })

    // Simulate turn completion
    act(() => {
      fakeDC.dispatchMessage({ type: 'response.done' })
    })

    await waitFor(() => {
      expect(result.current.voiceState).toBe('idle')
    })

    expect(onTurnComplete).toHaveBeenCalledWith('', 'Here is my response')
  })

  it('sets voiceState to idle and closes connection on interrupt', async () => {
    mockGetUserMedia.mockResolvedValue(makeMicStream())
    const onTurnComplete = vi.fn()
    const { result } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-id', onTurnComplete })
    )

    await act(async () => {
      await result.current.startVoice()
    })

    act(() => {
      result.current.interrupt()
    })

    expect(result.current.voiceState).toBe('idle')
    expect(fakeDC.send).toHaveBeenCalledWith(JSON.stringify({ type: 'response.cancel' }))
    expect(mockPCClose).toHaveBeenCalled()
  })

  it('sets voiceState to speaking on response.audio.started', async () => {
    mockGetUserMedia.mockResolvedValue(makeMicStream())
    const onTurnComplete = vi.fn()
    const { result } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-id', onTurnComplete })
    )

    await act(async () => {
      await result.current.startVoice()
    })

    act(() => {
      fakeDC.dispatchMessage({ type: 'response.audio.started' })
    })

    expect(result.current.voiceState).toBe('speaking')
  })

  it('closes peer connection and stops tracks on unmount', async () => {
    const micTrackStop = vi.fn()
    const mockStream = {
      getAudioTracks: () => [{ stop: micTrackStop }],
      getTracks: () => [{ stop: micTrackStop }],
    }
    mockGetUserMedia.mockResolvedValue(mockStream)
    const onTurnComplete = vi.fn()
    const { result, unmount } = renderHook(() =>
      useVoiceSession({ opaqueId: 'test-id', onTurnComplete })
    )

    await act(async () => {
      await result.current.startVoice()
    })

    unmount()

    expect(mockPCClose).toHaveBeenCalled()
    expect(micTrackStop).toHaveBeenCalled()
  })
})

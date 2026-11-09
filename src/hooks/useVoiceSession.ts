'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { VoiceState } from '@/components/buyer/VoiceDock'

const REALTIME_URL = 'https://api.openai.com/v1/realtime'
const REALTIME_MODEL = 'gpt-4o-realtime-preview'
const NUM_BARS = 5

type RealtimeServerEvent =
  | { type: 'input_audio_buffer.speech_started' }
  | { type: 'input_audio_buffer.speech_stopped' }
  | { type: 'conversation.item.created'; item: { role?: string; content?: Array<{ type: string; transcript?: string }> } }
  | { type: 'response.audio.started' }
  | { type: 'response.audio_transcript.done'; transcript: string }
  | { type: 'response.done' }
  | { type: string }

interface UseVoiceSessionOptions {
  opaqueId: string
  onTurnComplete: (userText: string, assistantText: string) => Promise<void>
}

interface UseVoiceSessionResult {
  voiceState: VoiceState
  levels: number[]
  startVoice: () => Promise<void>
  stopVoice: () => void
  interrupt: () => void
}

export function useVoiceSession({
  opaqueId,
  onTurnComplete,
}: UseVoiceSessionOptions): UseVoiceSessionResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [levels, setLevels] = useState<number[]>(Array(NUM_BARS).fill(0))

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // Transcript accumulators for the current turn
  const userTextRef = useRef<string>('')
  const assistantTextRef = useRef<string>('')

  const stopAnimLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setLevels(Array(NUM_BARS).fill(0))
  }, [])

  const startAnimLoop = useCallback((analyser: AnalyserNode) => {
    const buf = new Uint8Array(analyser.frequencyBinCount)
    const INTERVAL_MS = 100 // ~10fps
    let lastTick = 0
    function tick(now: number) {
      animFrameRef.current = requestAnimationFrame(tick)
      if (now - lastTick < INTERVAL_MS) return
      lastTick = now
      analyser.getByteFrequencyData(buf)
      // Sample 5 evenly-spaced frequency bins and normalise to 0–1
      const step = Math.floor(buf.length / NUM_BARS)
      const newLevels = Array.from({ length: NUM_BARS }, (_, i) =>
        (buf[i * step] ?? 0) / 255
      )
      setLevels(newLevels)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const cleanupConnection = useCallback(() => {
    stopAnimLoop()

    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
    }
  }, [stopAnimLoop])

  const stopVoice = useCallback(() => {
    cleanupConnection()
    setVoiceState('idle')
  }, [cleanupConnection])

  const interrupt = useCallback(() => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify({ type: 'response.cancel' }))
    }
    cleanupConnection()
    setVoiceState('idle')
  }, [cleanupConnection])

  const startVoice = useCallback(async () => {
    // Acquire mic first so we can set error state if denied
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setVoiceState('error')
      return
    }

    streamRef.current = stream
    setVoiceState('listening')

    // Fetch ephemeral token
    let ephemeralToken: string
    try {
      const res = await fetch('/api/conversation/realtime/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opaqueId }),
        signal: AbortSignal.timeout(5_000),
      })
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const data = await res.json() as { ephemeralToken: string }
      ephemeralToken = data.ephemeralToken
    } catch {
      cleanupConnection()
      setVoiceState('error')
      return
    }

    // Reset transcript accumulators
    userTextRef.current = ''
    assistantTextRef.current = ''

    // Set up AudioContext + AnalyserNode for waveform
    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser
    startAnimLoop(analyser)

    // Set up RTCPeerConnection
    const pc = new RTCPeerConnection()
    pcRef.current = pc

    // Add mic track
    stream.getAudioTracks().forEach(track => pc.addTrack(track, stream))

    // Remote audio playback element
    if (!audioElRef.current) {
      audioElRef.current = document.createElement('audio')
      audioElRef.current.autoplay = true
    }
    pc.ontrack = (e) => {
      if (audioElRef.current) {
        audioElRef.current.srcObject = e.streams[0]
      }
    }

    // Data channel for OpenAI Realtime events
    const dc = pc.createDataChannel('oai-events')
    dcRef.current = dc

    dc.addEventListener('message', (e: MessageEvent) => {
      let event: RealtimeServerEvent
      try {
        event = JSON.parse(e.data as string) as RealtimeServerEvent
      } catch {
        return
      }

      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          setVoiceState('listening')
          break

        case 'input_audio_buffer.speech_stopped':
          setVoiceState('thinking')
          break

        case 'conversation.item.created': {
          const raw = event as Record<string, unknown>
          const item = raw['item'] as { role?: string; content?: Array<{ type: string; transcript?: string }> } | undefined
          if (item?.role === 'user' && Array.isArray(item.content)) {
            const transcript = item.content
              .filter(c => c.type === 'input_audio')
              .map(c => c.transcript ?? '')
              .join('')
            if (transcript) userTextRef.current = transcript
          }
          break
        }

        case 'response.audio.started':
          setVoiceState('speaking')
          break

        case 'response.audio_transcript.done': {
          const raw = event as Record<string, unknown>
          const transcript = raw['transcript'] as string | undefined
          if (transcript) assistantTextRef.current = transcript
          break
        }

        case 'response.done': {
          const uText = userTextRef.current
          const aText = assistantTextRef.current
          userTextRef.current = ''
          assistantTextRef.current = ''
          setVoiceState('idle')
          if (uText || aText) {
            onTurnComplete(uText, aText).catch(err =>
              console.error('[voice] onTurnComplete failed:', err)
            )
          }
          break
        }
      }
    })

    dc.addEventListener('error', () => {
      cleanupConnection()
      setVoiceState('error')
    })

    // SDP negotiation
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(`${REALTIME_URL}?model=${REALTIME_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
        signal: AbortSignal.timeout(10_000),
      })

      if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`)

      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch {
      cleanupConnection()
      setVoiceState('error')
    }
  }, [opaqueId, cleanupConnection, startAnimLoop, onTurnComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnection()
    }
  }, [cleanupConnection])

  return { voiceState, levels, startVoice, stopVoice, interrupt }
}

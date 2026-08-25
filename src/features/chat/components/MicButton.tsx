import { useEffect, useRef, useState, type JSX } from 'react'
import { MicIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { apiFetch } from '@/lib/api/client'

interface MicButtonProps {
  onTranscript?: (text: string) => void
}

export function MicButton({ onTranscript }: MicButtonProps): JSX.Element {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  async function startRecording(): Promise<void> {
    try {
      audioChunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await handleAudioUpload(audioBlob)

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please check your permissions.')
    }
  }

  function stopRecording(): void {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  async function handleAudioUpload(blob: Blob): Promise<void> {
    setProcessing(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
      })

      const base64 = await base64Promise

      const result = await apiFetch<{ transcript: string }>(
        '/api/v1/transcribe',
        {
          method: 'POST',
          body: { audioBase64: base64 },
          auth: true,
        },
        (data) => {
          if (typeof data === 'object' && data !== null && 'transcript' in data) {
            return data as { transcript: string }
          }
          return { transcript: '' }
        },
      )

      if (result.transcript && onTranscript) {
        onTranscript(result.transcript)
      }
    } catch (err) {
      console.error('Transcription error:', err)
      alert('Failed to transcribe speech. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  function handleClick(): void {
    if (processing) return
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={processing}
      data-state={recording ? 'recording' : processing ? 'processing' : 'idle'}
      title={
        processing
          ? 'Transcribing voice input...'
          : recording
            ? 'Sarvam Voice Mode Active (Click to stop and transcribe)'
            : 'Sarvam Multilingual Voice Dictation'
      }
      aria-label={
        processing
          ? 'Transcribing'
          : recording
            ? 'Stop recording'
            : 'Use Sarvam voice input'
      }
      className={cn(
        'chat-mic relative grid h-9.5 w-9.5 flex-none place-items-center rounded-full transition-colors duration-short ease-out hover:-translate-y-px',
        recording
          ? 'bg-danger text-accent-ink ring-4 ring-danger/30 animate-pulse'
          : 'bg-accent-soft text-accent-text hover:bg-accent-deep hover:text-accent-ink',
        processing && 'opacity-60 cursor-not-allowed bg-paper-3 text-muted',
      )}
    >
      {processing ? (
        <svg
          className="animate-spin h-4.25 w-4.25"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <MicIcon className="h-4.25 w-4.25" />
      )}
    </button>
  )
}

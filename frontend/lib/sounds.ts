let audioContext: AudioContext | null = null
let rainSource: AudioBufferSourceNode | null = null
let rainBuffer: AudioBuffer | null = null

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('bsd_sounds') === 'true'
}

export function toggleSound(): boolean {
  if (typeof window === 'undefined') return false

  const next = !isSoundEnabled()
  localStorage.setItem('bsd_sounds', String(next))

  if (!next) {
    stopRain()
  }

  return next
}

export async function playSound(name: 'typewriter' | 'stamp'): Promise<void> {
  if (!isSoundEnabled()) return

  try {
    const ctx = getContext()
    const response = await fetch(`/sounds/${name}.mp3`)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start()
  } catch {}
}

export async function startRain(): Promise<void> {
  if (!isSoundEnabled()) return

  try {
    const ctx = getContext()

    if (!rainBuffer) {
      const response = await fetch('/sounds/rain.mp3')
      const arrayBuffer = await response.arrayBuffer()
      rainBuffer = await ctx.decodeAudioData(arrayBuffer)
    }

    stopRain()

    rainSource = ctx.createBufferSource()
    rainSource.buffer = rainBuffer
    rainSource.loop = true

    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.3

    rainSource.connect(gainNode)
    gainNode.connect(ctx.destination)
    rainSource.start()
  } catch {}
}

export function stopRain(): void {
  try {
    rainSource?.stop()
    rainSource = null
  } catch {}
}

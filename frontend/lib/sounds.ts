let audioContext: AudioContext | null = null
let rainSource: AudioBufferSourceNode | null = null
let rainBuffer: AudioBuffer | null = null
let windSource: AudioBufferSourceNode | null = null
let windBuffer: AudioBuffer | null = null
let agencySource: AudioBufferSourceNode | null = null
let agencyBuffer: AudioBuffer | null = null

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
    stopWind()
    stopAgency()
  }

  return next
}

export async function playSound(name: 'typewriter' | 'stamp'): Promise<void> {
  if (!isSoundEnabled()) return

  try {
    const ctx = getContext()
    let response: Response | null = null
    try {
      response = await fetch(`/sounds/${name}.mp3`)
      if (!response.ok) throw new Error('mp3 not found')
    } catch {
      response = await fetch(`/sounds/${name}.wav`)
    }
    if (!response.ok) return
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
      let response: Response | null = null
      try {
        response = await fetch('/sounds/rain.mp3')
        if (!response.ok) throw new Error('mp3 not found')
      } catch {
        response = await fetch('/sounds/rain.wav')
      }
      if (!response.ok) return
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

export async function startWind(): Promise<void> {
  if (!isSoundEnabled()) return

  try {
    const ctx = getContext()

    if (!windBuffer) {
      let response: Response | null = null
      try {
        response = await fetch('/sounds/wind.mp3')
        if (!response.ok) throw new Error('mp3 not found')
      } catch {
        response = await fetch('/sounds/wind.wav')
      }
      if (!response.ok) return
      const arrayBuffer = await response.arrayBuffer()
      windBuffer = await ctx.decodeAudioData(arrayBuffer)
    }

    stopWind()

    windSource = ctx.createBufferSource()
    windSource.buffer = windBuffer
    windSource.loop = true

    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.25

    windSource.connect(gainNode)
    gainNode.connect(ctx.destination)
    windSource.start()
  } catch {}
}

export async function startAgency(): Promise<void> {
  // Agency sounds (agency.mp3/wav) are currently unavailable. 
  // Disabling to prevent 404 errors in console.
  return
}

export function stopRain(): void {
  try {
    rainSource?.stop()
    rainSource = null
  } catch {}
}

export function stopWind(): void {
  try {
    windSource?.stop()
    windSource = null
  } catch {}
}

export function stopAgency(): void {
  try {
    agencySource?.stop()
    agencySource = null
  } catch {}
}
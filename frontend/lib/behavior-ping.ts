'use client'

type BehaviorPingOptions = {
  storageKey: string
  storageArea?: 'local' | 'session'
  delayMs: number
  body: Record<string, unknown>
}

function getStorage(area: 'local' | 'session') {
  return area === 'local' ? window.localStorage : window.sessionStorage
}

export function scheduleBehaviorPing({
  storageKey,
  storageArea = 'local',
  delayMs,
  body,
}: BehaviorPingOptions) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const storage = getStorage(storageArea)
  let timer: number | null = null
  let cancelled = false

  const stop = () => {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
  }

  const send = () => {
    if (cancelled || document.hidden || storage.getItem(storageKey) === '1') {
      return
    }

    storage.setItem(storageKey, '1')

    void fetch('/api/behavior/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      try {
        storage.removeItem(storageKey)
      } catch {}
    })
  }

  const start = () => {
    if (cancelled || document.hidden || storage.getItem(storageKey) === '1' || timer !== null) {
      return
    }

    timer = window.setTimeout(() => {
      timer = null
      send()
    }, delayMs)
  }

  const onVisibilityChange = () => {
    if (document.hidden) {
      stop()
      return
    }

    start()
  }

  start()
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    cancelled = true
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}

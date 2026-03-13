export async function fetchWithRetry(input: RequestInfo, init?: RequestInit, attempts = 3, backoffMs = 300) {
  let lastErr: any = null
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(input, init as any)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        const err = new Error(`HTTP ${res.status} ${res.statusText} - ${body}`)
        throw err
      }
      return res
    } catch (err) {
      lastErr = err
      const wait = backoffMs * Math.pow(2, i)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, wait))
    }
  }

  throw lastErr
}

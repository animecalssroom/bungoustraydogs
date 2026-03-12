const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

function normalizeBase(value: string) {
  return value.normalize('NFKC').replace(CONTROL_CHARS, '')
}

export function sanitizePlainText(value: string) {
  return normalizeBase(value)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sanitizeMultilineText(value: string) {
  return normalizeBase(value)
    .replace(/[<>]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function sanitizeSlug(value: string) {
  return normalizeBase(value)
    .toLowerCase()
    .replace(/[<>]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function sanitizeTagList(tags: string[] | undefined | null) {
  return (tags ?? [])
    .map((tag) => sanitizePlainText(tag).toLowerCase())
    .filter(Boolean)
    .slice(0, 5)
}

export function sanitizeRelativePath(value: string) {
  const nextValue = normalizeBase(value).trim()

  if (!nextValue.startsWith('/')) {
    return '/'
  }

  if (nextValue.startsWith('//') || /^(javascript:|https?:)/i.test(nextValue)) {
    return '/'
  }

  return nextValue.replace(/\s/g, '')
}

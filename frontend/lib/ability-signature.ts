export function generateAbilitySignature(
  username: string,
  characterSlug: string,
  factionColor: string,
) {
  const seed = `${username}:${characterSlug}`
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0)

  const pseudo = (index: number) => {
    const value = Math.sin(seed + index * 19.31) * 10000
    return value - Math.floor(value)
  }

  const width = 200
  const height = 40
  const center = height / 2
  const points = 28
  const step = width / points

  let path = `M 0 ${center.toFixed(2)}`

  for (let index = 1; index <= points; index += 1) {
    const x = index * step
    const amplitude = 6 + pseudo(index) * 12
    const frequency = 0.45 + pseudo(index + 50) * 0.65
    const phase = pseudo(index + 100) * Math.PI * 2
    const y = center + Math.sin(index * frequency + phase) * amplitude

    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
  }

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ability signature">
  <path d="${path}" fill="none" stroke="${factionColor}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="0.88" />
</svg>`
}

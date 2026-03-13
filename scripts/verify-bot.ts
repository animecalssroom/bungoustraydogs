export {}
/**
 * Simple script to call the bot verify endpoint to ensure BOT_SECRET is correct.
 * Usage: set NEXT_PUBLIC_BASE_URL and BOT_SECRET, then `node scripts/verify-bot.ts`
 */

async function main() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL
  if (!base) {
    console.error('Set NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_VERCEL_URL')
    process.exit(1)
  }

  const res = await fetch(`${base}/api/bots/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bot-secret': process.env.BOT_SECRET ?? '' },
    body: JSON.stringify({ botUsername: process.env.BOT_USERNAME ?? 'tachihara' }),
  })
  console.log('verify response', await res.json())
}

void main()

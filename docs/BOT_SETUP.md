# Bot Setup and Deployment

This file lists the minimal steps to get the bot system and duel migration running.

1) Fill `.env.local`
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_BASE_URL (e.g. https://your-deploy-url)
- BOT_SECRET
- BOT_DUEL_SECRET
- GEMINI_API_KEY
- QSTASH_TOKEN

2) Apply DB migration
- Open Supabase SQL editor and run: `supabase/migrations/20260313_add_duel_round_is_sudden_death.sql`
- Or with Supabase CLI:

```bash
# from repo root
supabase db query < supabase/migrations/20260313_add_duel_round_is_sudden_death.sql
```

3) Deploy/update Supabase Edge Function
- Update and deploy `supabase/functions/resolve-duel-round` using the Supabase dashboard or CLI.

4) Deploy app backend/frontend
- Push to your main branch and deploy to Vercel (or run `next build` / `next start` for local testing).

5) Register scheduled jobs (QStash)
- Ensure `QSTASH_TOKEN` and `BOT_SECRET` are set in shell or CI.
- Run:

```bash
export QSTASH_TOKEN="..."
export NEXT_PUBLIC_BASE_URL="https://your-deploy-url"
export BOT_SECRET="..."
node scripts/register-bot-schedules.ts
```

6) Verify bot endpoints

```bash
export NEXT_PUBLIC_BASE_URL="https://your-deploy-url"
export BOT_SECRET="..."
export BOT_USERNAME="tachihara_m"
node scripts/verify-bot.ts
```

7) Quick local checks
- Run unit tests: `npm run test:unit`
- Start dev: `npm run dev`

Notes
- Do not commit real secret values. Keep `.env.local` out of VCS.
- If you want I can: add retries/logging (done), run the QStash registration here (requires secrets), or help deploy the Supabase function.

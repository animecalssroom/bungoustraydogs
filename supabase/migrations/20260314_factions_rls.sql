-- Enable RLS on the factions table
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow ANYONE to read faction data (required for the UI to render)
-- This allows anyone (authenticated or not) to SELECT and read faction data.
CREATE POLICY "Enable read access for all users"
ON public.factions
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- No INSERT, UPDATE, or DELETE policies are created.
-- This means any client-side inserts/updates will be explicitly DENIED.
-- Server API routes (using service_role key) bypass this automatically.

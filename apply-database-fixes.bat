@echo off
echo Applying database schema fixes...

echo 1. Applying complete database fix...
npx supabase link --project-ref nwpuurgwnnuejqinkvrh
npx supabase db reset

echo 2. Applying migration files...
npx supabase migration up

echo 3. Applying seed data...
npx supabase db seed

echo 4. Restarting Supabase services...
npx supabase stop
npx supabase start

echo Database fixes applied successfully!
pause
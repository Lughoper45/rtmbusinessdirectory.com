-- Daily cron: fire ops-dispatcher at 9am UTC.
-- Requires pg_cron + pg_net (both available on Supabase Pro/Team).
-- If pg_cron is not yet enabled: Dashboard → Database → Extensions → pg_cron → Enable.

create extension if not exists pg_net  with schema extensions;
create extension if not exists pg_cron with schema pg_cron;

-- Remove any pre-existing schedule so this migration is idempotent.
select cron.unschedule('ops-dispatcher-daily') where exists (
  select 1 from cron.job where jobname = 'ops-dispatcher-daily'
);

-- The secret is read from a database-level app setting so it is never
-- stored in the migration SQL itself.  Set it once via:
--   ALTER DATABASE postgres SET app.ops_cron_secret = '<your-secret>';
-- or via the Supabase SQL editor before running this migration.
select cron.schedule(
  'ops-dispatcher-daily',
  '0 9 * * *',
  $cron_body$
  select net.http_post(
    url     := 'https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/ops-dispatcher',
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-ops-cron-secret', current_setting('app.ops_cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $cron_body$
);

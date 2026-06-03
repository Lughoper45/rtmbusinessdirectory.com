-- Reschedule ops-dispatcher cron to read the shared secret from Supabase Vault.
-- Hosted Supabase does not allow: ALTER DATABASE postgres SET app.ops_cron_secret = '...';
--
-- One-time setup (SQL editor, as postgres / service role):
--   select vault.create_secret('<same value as Edge secret OPS_CRON_SECRET>', 'ops_cron_secret', 'Cron auth for ops-dispatcher');
--
-- Edge Functions → Secrets must still define OPS_CRON_SECRET with the identical value.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_cron;

do $migration$
begin
  if exists (select 1 from cron.job where jobname = 'ops-dispatcher-daily') then
    perform cron.unschedule('ops-dispatcher-daily');
  end if;
end;
$migration$;

select cron.schedule(
  'ops-dispatcher-daily',
  '0 9 * * *',
  $cron_body$
  select net.http_post(
    url     := 'https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/ops-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-ops-cron-secret', coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'ops_cron_secret' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb
  );
  $cron_body$
);

comment on extension pg_cron is
  'ops-dispatcher-daily reads ops_cron_secret from vault.decrypted_secrets (name = ops_cron_secret).';

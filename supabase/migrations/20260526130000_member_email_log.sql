create table if not exists public.member_email_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  template text not null,
  subject text not null,
  resend_message_id text,
  sent_by text not null default 'system',
  sent_at timestamptz not null default now()
);

create index if not exists member_email_log_profile_id_idx on public.member_email_log (profile_id);
create index if not exists member_email_log_sent_at_idx on public.member_email_log (sent_at desc);

alter table public.member_email_log enable row level security;

drop policy if exists "Admins manage email log" on public.member_email_log;
create policy "Admins manage email log"
on public.member_email_log for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

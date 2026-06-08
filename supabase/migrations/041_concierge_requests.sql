-- Concierge requests: customers who want help planning their event
-- rather than browsing the marketplace themselves.

create table if not exists concierge_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  event_type    text not null,
  event_date    date,
  location      text,
  guest_count   int,
  budget        text,
  notes         text,
  status        text not null default 'new'
                  check (status in ('new', 'in_progress', 'matched', 'completed', 'closed')),
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists concierge_requests_status_idx on concierge_requests (status);
create index if not exists concierge_requests_created_idx on concierge_requests (created_at desc);

-- Auto-update updated_at
create or replace function update_concierge_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_concierge_updated_at on concierge_requests;
create trigger set_concierge_updated_at
  before update on concierge_requests
  for each row execute procedure update_concierge_updated_at();

-- Allow anonymous inserts (form submissions from unauthenticated customers)
alter table concierge_requests enable row level security;

create policy "Anyone can submit a concierge request"
  on concierge_requests for insert
  with check (true);

create policy "Admins can read all concierge requests"
  on concierge_requests for select
  using (auth.role() = 'service_role');

create policy "Admins can update concierge requests"
  on concierge_requests for update
  using (auth.role() = 'service_role');

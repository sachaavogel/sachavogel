-- Due Today: free Supabase data model
-- Paste this into Supabase Dashboard > SQL Editor, then click Run.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Student',
  email text not null default '',
  reminder_time time not null default '17:00',
  reminder_mode text not null default 'daily' check (reminder_mode in ('daily', 'once')),
  timezone text not null default 'America/New_York',
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text not null default '#7d9cff',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  class_name text not null check (char_length(trim(class_name)) between 1 and 80),
  description text not null check (char_length(trim(description)) between 1 and 300),
  due_date date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One entry for every message the free Gmail scheduler sends.
create table public.reminder_log (
  id bigint generated always as identity primary key,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  sent_for date not null,
  kind text not null check (kind in ('initial', 'reminder')),
  created_at timestamptz not null default now(),
  unique (assignment_id, sent_for, kind)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Student'),
    coalesce(new.email, '')
  ) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.reminder_log enable row level security;

create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage their own classes" on public.classes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own assignments" on public.assignments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read their own reminder records" on public.reminder_log for select using (
  exists (select 1 from public.assignments where assignments.id = reminder_log.assignment_id and assignments.user_id = auth.uid())
);

create index assignments_for_reminders on public.assignments (completed_at, due_date);
create index reminder_log_lookup on public.reminder_log (assignment_id, sent_for, kind);

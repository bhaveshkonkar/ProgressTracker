-- RESTART: Clean up previous tables to ensure valid design
DROP TRIGGER IF EXISTS on_auth_user_created on auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.phases CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  streak int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  git_repo_url text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mode text,
  skill_level text,
  streak int default 0
);

-- 3. Create Project Members Table
create table public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

-- 4. Create Phases Table
create table public.phases (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Tasks Table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  phase_id uuid references public.phases(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'Pending',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  proof_image_url text,
  notes text,
  submission_description text,
  backlogs text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Invites Table
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  invitee_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending', -- pending, accepted, declined
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.phases enable row level security;
alter table public.tasks enable row level security;
alter table public.invites enable row level security;

-- 8. Policies
-- Allow authenticated users to do everything (CRUD) for development speed.
create policy "Public profiles access" on public.profiles for select using (true);
create policy "Self update profiles" on public.profiles for update using (auth.uid() = id);
create policy "Insert profiles" on public.profiles for insert with check (auth.uid() = id);

-- Projects policies (Using both USING and WITH CHECK to avoid syntax errors)
create policy "Enable all for authenticated projects" on public.projects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for authenticated members" on public.project_members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for authenticated phases" on public.phases for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for authenticated tasks" on public.tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for authenticated invites" on public.invites for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 9. Storage for Proofs
insert into storage.buckets (id, name, public) 
values ('task-proofs', 'task-proofs', true)
on conflict (id) do nothing;

-- Clean up existing policies on storage to avoid errors
drop policy if exists "Public Access Proofs" on storage.objects;
drop policy if exists "Auth Upload Proofs" on storage.objects;

create policy "Public Access Proofs" on storage.objects for select using ( bucket_id = 'task-proofs' );
-- Fixed: FOR INSERT requires WITH CHECK, not USING
create policy "Auth Upload Proofs" on storage.objects for insert with check ( bucket_id = 'task-proofs' and auth.role() = 'authenticated' );

-- 10. Helper to generate a username from name/email and ensure uniqueness
create or replace function public.generate_username(base text)
returns text as $$
declare
  cleaned text;
  candidate text;
  suffix int;
begin
  cleaned := lower(regexp_replace(coalesce(base, ''), '[^a-zA-Z0-9]+', '', 'g'));
  if cleaned = '' then
    cleaned := 'user';
  end if;

  candidate := cleaned;

  while exists(select 1 from public.profiles where username = candidate) loop
    suffix := floor(random() * 9000 + 1000);
    candidate := cleaned || suffix::text;
  end loop;

  return candidate;
end;
$$ language plpgsql;

-- 11. Trigger for Automatic Profile Creation (Google/email signups)
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  full_name text;
  base_username text;
  final_username text;
begin
  -- Prefer a human-readable name from OAuth provider or email
  full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- Base username: explicit username if provided, otherwise use name/email part
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    full_name,
    split_part(new.email, '@', 1)
  );

  -- Generate a slug/unique username
  final_username := public.generate_username(base_username);

  insert into public.profiles (id, username, full_name, avatar_url, streak)
  values (
    new.id,
    final_username,
    full_name,
    'https://ui-avatars.com/api/?name=' || coalesce(replace(full_name, ' ', '+'), final_username) || '&background=random',
    0
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 12. Backfill profiles for existing auth users (safe to run multiple times)
insert into public.profiles (id, username, full_name, avatar_url, streak)
select
  u.id,
  public.generate_username(
    coalesce(
      u.raw_user_meta_data->>'username',
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )
  ) as username,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as full_name,
  'https://ui-avatars.com/api/?name=' ||
    coalesce(
      replace(u.raw_user_meta_data->>'full_name', ' ', '+'),
      split_part(u.email, '@', 1)
    ) || '&background=random' as avatar_url,
  0 as streak
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

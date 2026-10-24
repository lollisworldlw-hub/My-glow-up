-- Group challenges: friends join a challenge; each day you hit it shows as a check.
-- Only "hit / not hit" is shared, never your actual numbers.
create table if not exists public.glowup_challenges (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 80),
  metric text not null check (metric in ('steps','protein','water','workout','logging','checkin')),
  goal numeric,
  start_date date not null,
  end_date date not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_date >= start_date and end_date - start_date <= 92)
);
create table if not exists public.glowup_challenge_members (
  challenge_id bigint not null references public.glowup_challenges(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create table if not exists public.glowup_challenge_days (
  challenge_id bigint not null,
  user_id uuid not null,
  day date not null,
  primary key (challenge_id, user_id, day),
  foreign key (challenge_id, user_id) references public.glowup_challenge_members(challenge_id, user_id) on delete cascade
);
alter table public.glowup_challenges enable row level security;
alter table public.glowup_challenge_members enable row level security;
alter table public.glowup_challenge_days enable row level security;

create policy "members see challenges" on public.glowup_challenges for select using (public.glowup_is_member((select auth.uid())));
create policy "members start challenges" on public.glowup_challenges for insert with check (created_by = (select auth.uid()) and public.glowup_is_member((select auth.uid())));
create policy "creator ends challenge" on public.glowup_challenges for delete using (created_by = (select auth.uid()));

create policy "members see who joined" on public.glowup_challenge_members for select using (public.glowup_is_member((select auth.uid())));
create policy "join a challenge" on public.glowup_challenge_members for insert with check (user_id = (select auth.uid()) and public.glowup_is_member((select auth.uid())));
create policy "leave a challenge" on public.glowup_challenge_members for delete using (user_id = (select auth.uid()));

create policy "members see check-ins" on public.glowup_challenge_days for select using (public.glowup_is_member((select auth.uid())));
create policy "add own check-ins" on public.glowup_challenge_days for insert with check (user_id = (select auth.uid()));
create policy "remove own check-ins" on public.glowup_challenge_days for delete using (user_id = (select auth.uid()));


-- Create a table to store user statistics
create table user_stats (
  email text primary key,
  wins int default 0,
  losses int default 0,
  pawns_captured int default 0,
  pawns_lost int default 0,
  games_played int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Turn on Row Level Security (Recommended for production, but optional for initial testing)
alter table user_stats enable row level security;

-- Create a policy that allows anyone to read/write for now (We can tighten this later with Auth)
create policy "Enable access for all users" on user_stats for all using (true) with check (true);

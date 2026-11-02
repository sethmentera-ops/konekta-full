-- Konekta shared database. Paste this whole file into Supabase -> SQL Editor -> Run.

create table if not exists konekta_users (
  id              text primary key,
  identifier      text not null unique,      -- normalized email (lowercase) or 63XXXXXXXXXX
  email_or_phone  text not null,             -- as typed by the user (for display)
  first_name      text not null,
  last_name       text not null,
  password_hash   text not null,
  gender          text default 'iba',
  avatar          text default '',
  cover_photo     text default '',
  bio             text default '',
  birthday        text,
  location        text default '',
  work            text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists konekta_users_updated_idx on konekta_users (updated_at);

create table if not exists konekta_friend_requests (
  from_id     text not null,
  to_id       text not null,
  created_at  timestamptz not null default now(),
  primary key (from_id, to_id)
);
create index if not exists konekta_fr_to_idx on konekta_friend_requests (to_id);

create table if not exists konekta_friends (
  user_id     text not null,
  friend_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- The app talks to the database only through its own server (service_role key),
-- so lock the tables against direct public access.
alter table konekta_users           enable row level security;
alter table konekta_friend_requests enable row level security;
alter table konekta_friends         enable row level security;

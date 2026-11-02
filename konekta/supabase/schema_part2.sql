-- Konekta part 2: posts, comments, reactions, stories, chat, notifications.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- (Part 1, schema.sql, must already be done.)

create table if not exists konekta_posts (
  id               text primary key,
  user_id          text not null,
  content          text not null default '',
  image_url        text,
  background_color text,
  feeling          text,
  location         text,
  privacy          text not null default 'public',
  shares_count     integer not null default 0,
  deleted          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists konekta_posts_updated_idx on konekta_posts (updated_at);
create index if not exists konekta_posts_created_idx on konekta_posts (created_at desc);

create table if not exists konekta_post_reactions (
  post_id    text not null,
  user_id    text not null,
  type       text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists konekta_comments (
  id         text primary key,
  post_id    text not null,
  user_id    text not null,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists konekta_comments_post_idx on konekta_comments (post_id);

create table if not exists konekta_stories (
  id         text primary key,
  user_id    text not null,
  media_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);
create index if not exists konekta_stories_created_idx on konekta_stories (created_at desc);

create table if not exists konekta_messages (
  id           text primary key,
  sender_id    text not null,
  recipient_id text not null,
  text         text not null default '',
  image_url    text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists konekta_messages_sender_idx    on konekta_messages (sender_id, updated_at);
create index if not exists konekta_messages_recipient_idx on konekta_messages (recipient_id, updated_at);

create table if not exists konekta_notifications (
  id         text primary key,
  user_id    text not null,
  actor_id   text,
  type       text not null,
  target_id  text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists konekta_notifications_user_idx on konekta_notifications (user_id, created_at desc);

alter table konekta_posts          enable row level security;
alter table konekta_post_reactions enable row level security;
alter table konekta_comments       enable row level security;
alter table konekta_stories        enable row level security;
alter table konekta_messages       enable row level security;
alter table konekta_notifications  enable row level security;

grant usage on schema public to service_role;
grant all on konekta_users, konekta_friend_requests, konekta_friends,
             konekta_posts, konekta_post_reactions, konekta_comments,
             konekta_stories, konekta_messages, konekta_notifications
  to service_role;

  -- InsightOS Supabase Schema
  -- Run this in your Supabase SQL Editor before using the Upload feature.

  -- ─── reviews ────────────────────────────────────────────────────────────────
  create table if not exists public.reviews (
    id                bigint          generated always as identity primary key,
    date              date            not null,
    platform          text            not null,
    branch_name       text            not null,
    review_text       text            not null,
    author_name       text,
    rating            numeric(2,1),
    sentiment         text            not null check (sentiment in ('positive', 'negative', 'neutral')),
    sentiment_score   numeric(4,2),
    categories        text[]          default '{}',
    keywords_found    text[]          default '{}',
    processed_at      timestamptz     not null default now(),
    created_at        timestamptz     not null default now()
  );

  -- Unique constraint to avoid duplicate upserts
  create unique index if not exists reviews_natural_key
    on public.reviews (branch_name, date, review_text);

  -- ─── branch_metrics ─────────────────────────────────────────────────────────
  create table if not exists public.branch_metrics (
    id                   bigint      generated always as identity primary key,
    branch_name          text        not null unique,
    total_reviews        integer     not null default 0,
    avg_rating           numeric(2,1),
    positive_count       integer     not null default 0,
    negative_count       integer     not null default 0,
    neutral_count        integer     not null default 0,
    positive_percentage  integer     not null default 0,
    negative_percentage  integer     not null default 0,
    health_score         integer     not null default 0,
    critical_issues      text[]      default '{}',
    updated_at           timestamptz not null default now()
  );

  -- ─── Migrations for existing deployments (idempotent) ────────────────────────
  -- Patches tables created from an older schema. Safe to re-run.
  alter table public.branch_metrics add column if not exists neutral_count integer not null default 0;

  -- ─── Row-Level Security ──────────────────────────────────────────────────────
  -- For development: disable RLS so the anon key can read/write freely.
  -- For production: enable RLS and add appropriate policies.

  alter table public.reviews        disable row level security;
  alter table public.branch_metrics disable row level security;

  -- ─── Production hardening (run instead of the two `disable` lines above) ──────
  -- Reads stay open to the anon key (dashboard). Writes are blocked for anon and go
  -- through /api/persist, which uses the service-role key (bypasses RLS). Set
  -- SUPABASE_SERVICE_ROLE_KEY in the server environment before enabling this.
  --
  -- alter table public.reviews        enable row level security;
  -- alter table public.branch_metrics enable row level security;
  -- create policy "anon read reviews" on public.reviews        for select using (true);
  -- create policy "anon read metrics" on public.branch_metrics for select using (true);

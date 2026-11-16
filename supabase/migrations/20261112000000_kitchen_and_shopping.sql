-- Milestone 2: the kitchen and the shopping list.
--
-- Every row belongs to a household. Row-level security (RLS) makes the database
-- itself check each row, so a signed-in person can read and change only the rows of
-- their own household, even if the app has a bug. A request that is not signed in
-- gets an error, never an empty list.
--
-- Parts:
--   1. Households, and who belongs to them
--   2. Foods and purchases
--   3. The shopping list
--   4. Row-level security and privileges
--   5. apply_changes: save and remove several rows together
--   6. A household for every account


-- 1. Households, and who belongs to them --------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- One household per person for now. Family sharing later means several people with
-- the same household_id.
create table public.household_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index household_members_household_id_idx on public.household_members (household_id);

-- Helper functions live in a schema that the Data API does not expose, so nobody
-- can call them from outside the database.
create schema private;

-- The household of the signed-in person. The tables below use it to fill in
-- household_id, and the RLS policies use it to decide which rows a person may touch.
-- "security definer" lets it read household_members whatever the caller's own rights.
create function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.household_members
  where user_id = (select auth.uid());
$$;


-- 2. Foods and purchases ------------------------------------------------------------

-- One row per food the household knows, whether or not any is in the kitchen now.
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.current_household_id()
    references public.households (id) on delete cascade,
  -- Kept as the person typed it, in any language.
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  -- How the food is counted: by weight (grams), by volume (ml), by count, or as a
  -- staple that only has a level.
  tracking text not null check (tracking in ('weight', 'volume', 'count', 'level')),
  -- Staples only: have, low, or out.
  status text check (status in ('have', 'low', 'out')),
  -- What a usual purchase of this food looks like, copied from the last one. It is
  -- used when the food is bought again without an amount.
  usual_amount double precision check (usual_amount > 0),
  usual_unit text check (char_length(usual_unit) between 1 and 12),
  usual_label text check (char_length(usual_label) between 1 and 20),
  usual_storage text check (usual_storage in ('fridge', 'freezer', 'pantry')),
  created_at timestamptz not null default now(),
  constraint staples_have_a_status check ((tracking = 'level') = (status is not null))
);

create index ingredients_household_id_idx on public.ingredients (household_id);

-- One row per purchase that still has something left. A food with nothing left has
-- no rows here.
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.current_household_id()
    references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  -- What is left: grams for weight, ml for volume, and a plain number for counted foods.
  amount double precision not null check (amount > 0),
  -- How the amount is shown: 'lb', 'oz', 'fl oz', 'cup', 'gal', or 'count'. The app
  -- keeps the list of units, so a new unit needs no change here.
  unit text not null check (char_length(unit) between 1 and 12),
  -- The word for a counted food, such as "block" or "bunch". Display text only.
  label text check (char_length(label) between 1 and 20),
  -- True when the amount is a guess. The app shows it with "~".
  is_estimate boolean not null default false,
  storage text not null check (storage in ('fridge', 'freezer', 'pantry')),
  use_by date not null,
  -- Where the date came from. 'estimated' is the app's own guess, shown as "about".
  date_source text not null default 'estimated'
    check (date_source in ('estimated', 'use_by', 'sell_by', 'best_by')),
  price_cents integer check (price_cents >= 0),
  created_at timestamptz not null default now()
);

create index batches_household_id_idx on public.batches (household_id);
create index batches_ingredient_id_idx on public.batches (ingredient_id);


-- 3. The shopping list --------------------------------------------------------------

-- One row per thing still to buy. Checking it off moves it to the kitchen and
-- removes the row.
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.current_household_id()
    references public.households (id) on delete cascade,
  -- The food this is, when the app already knows it.
  ingredient_id uuid references public.ingredients (id) on delete set null,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  -- How much to buy, when the person said so. Same meaning as in batches.
  amount double precision check (amount > 0),
  unit text check (char_length(unit) between 1 and 12),
  label text check (char_length(label) between 1 and 20),
  created_at timestamptz not null default now(),
  constraint amounts_have_a_unit check ((amount is null) = (unit is null))
);

create index shopping_items_household_id_idx on public.shopping_items (household_id);
create index shopping_items_ingredient_id_idx on public.shopping_items (ingredient_id);


-- 4. Row-level security and privileges ----------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.ingredients enable row level security;
alter table public.batches enable row level security;
alter table public.shopping_items enable row level security;

-- Households and memberships are made by the database (part 6), so people can only
-- read their own.
create policy "People see their own household"
  on public.households for select to authenticated
  using (id = (select private.current_household_id()));

create policy "People see their own membership"
  on public.household_members for select to authenticated
  using (user_id = (select auth.uid()));

-- Foods, purchases, and shopping items: a person can read, add, change, and remove
-- rows of their own household, and no others. "using" checks the rows that are
-- already there, and "with check" checks the rows being written.
create policy "People manage their household's foods"
  on public.ingredients for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "People manage their household's purchases"
  on public.batches for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy "People manage their household's shopping list"
  on public.shopping_items for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

-- Supabase gives new tables to every role by default. Take that back, then give
-- signed-in people ("authenticated") exactly what they need. Requests that are not
-- signed in ("anon") get nothing.
revoke all on table
  public.households,
  public.household_members,
  public.ingredients,
  public.batches,
  public.shopping_items
from anon, authenticated;

grant select on table public.households, public.household_members to authenticated;

grant select, insert, update, delete on table
  public.ingredients,
  public.batches,
  public.shopping_items
to authenticated;

grant usage on schema private to authenticated;
revoke all on function private.current_household_id() from public;
grant execute on function private.current_household_id() to authenticated;


-- 5. apply_changes: save and remove several rows together ---------------------------

-- The app sends each action as one call: the rows to save and the ids to remove.
-- Checking off a shopping item, for example, saves a purchase and removes the item.
-- The whole call runs in one transaction, so it all happens or none of it does.
--
-- Saving a row whose id already exists replaces it, so sending the same call twice
-- ends in the same state. That matters for changes made offline and sent later.
--
-- "security invoker" runs it with the caller's own rights, so the RLS policies above
-- apply to every row it touches.
create function public.apply_changes(
  save_ingredients jsonb default '[]',
  save_batches jsonb default '[]',
  save_shopping_items jsonb default '[]',
  remove_shopping_items uuid[] default '{}',
  remove_batches uuid[] default '{}',
  remove_ingredients uuid[] default '{}'
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.ingredients
    (id, name, tracking, status, usual_amount, usual_unit, usual_label, usual_storage)
  select id, name, tracking, status, usual_amount, usual_unit, usual_label, usual_storage
  from jsonb_to_recordset(save_ingredients) as new_row (
    id uuid,
    name text,
    tracking text,
    status text,
    usual_amount double precision,
    usual_unit text,
    usual_label text,
    usual_storage text
  )
  on conflict (id) do update set
    name = excluded.name,
    tracking = excluded.tracking,
    status = excluded.status,
    usual_amount = excluded.usual_amount,
    usual_unit = excluded.usual_unit,
    usual_label = excluded.usual_label,
    usual_storage = excluded.usual_storage;

  insert into public.batches
    (id, ingredient_id, amount, unit, label, is_estimate, storage, use_by, date_source, price_cents)
  select id, ingredient_id, amount, unit, label, is_estimate, storage, use_by, date_source, price_cents
  from jsonb_to_recordset(save_batches) as new_row (
    id uuid,
    ingredient_id uuid,
    amount double precision,
    unit text,
    label text,
    is_estimate boolean,
    storage text,
    use_by date,
    date_source text,
    price_cents integer
  )
  on conflict (id) do update set
    ingredient_id = excluded.ingredient_id,
    amount = excluded.amount,
    unit = excluded.unit,
    label = excluded.label,
    is_estimate = excluded.is_estimate,
    storage = excluded.storage,
    use_by = excluded.use_by,
    date_source = excluded.date_source,
    price_cents = excluded.price_cents;

  -- The app sets created_at itself, so an item added offline keeps its place in the list.
  insert into public.shopping_items
    (id, ingredient_id, name, amount, unit, label, created_at)
  select id, ingredient_id, name, amount, unit, label, coalesce(created_at, now())
  from jsonb_to_recordset(save_shopping_items) as new_row (
    id uuid,
    ingredient_id uuid,
    name text,
    amount double precision,
    unit text,
    label text,
    created_at timestamptz
  )
  on conflict (id) do update set
    ingredient_id = excluded.ingredient_id,
    name = excluded.name,
    amount = excluded.amount,
    unit = excluded.unit,
    label = excluded.label;

  delete from public.shopping_items where id = any (remove_shopping_items);
  delete from public.batches where id = any (remove_batches);
  -- Removing a food also removes its purchases (on delete cascade, in part 2).
  delete from public.ingredients where id = any (remove_ingredients);
$$;

revoke all on function public.apply_changes from public, anon;
grant execute on function public.apply_changes to authenticated;


-- 6. A household for every account --------------------------------------------------

-- Makes a household for one account and puts the starter staples in it. Staples are
-- assumed to be in the kitchen, so a new person only has to add their fresh food.
-- Does nothing for an account that already has a household.
create function private.create_household(for_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  if exists (select 1 from public.household_members where user_id = for_user_id) then
    return;
  end if;

  insert into public.households default values
  returning id into new_household_id;

  insert into public.household_members (user_id, household_id)
  values (for_user_id, new_household_id);

  insert into public.ingredients (household_id, name, tracking, status)
  select new_household_id, staple.name, 'level', 'have'
  from unnest(array[
    'Salt',
    'Sugar',
    'Cooking oil',
    'Soy sauce',
    'Rice',
    'Cornstarch',
    'Sesame oil',
    'Rice vinegar',
    'White pepper',
    'Oyster sauce'
  ]) as staple (name);
end;
$$;

-- Supabase keeps accounts in auth.users. A trigger is a function the database runs
-- by itself when something happens: here, each time an account is created. If this
-- function failed, signing up would fail too, so supabase/tests/two_accounts.sql
-- checks it.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.create_household(new.id);
  return new;
end;
$$;

revoke all on function private.create_household(uuid) from public;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accounts that signed in before this migration get their household now.
do $$
begin
  perform private.create_household(id) from auth.users;
end;
$$;

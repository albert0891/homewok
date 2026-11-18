-- Proves that one account cannot see or change another account's kitchen.
--
-- How to run it: paste it into the SQL editor of the Supabase dashboard and press
-- Run, or run it through the Supabase connector. It makes two throwaway accounts
-- inside a transaction and rolls everything back at the end, so it leaves nothing
-- behind and can be run at any time. When a check fails, the run stops with an error
-- that names the check. When all pass, the result is "All checks passed".

begin;

-- Two throwaway accounts, A and B. Creating them fires the new-user trigger, which
-- gives each one a household with the starter staples.
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'check-a@homewok.invalid'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'check-b@homewok.invalid');

do $$
begin
  assert (
    select count(*) from public.household_members
    where user_id in (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )
  ) = 2, 'The new-user trigger did not give each account a household';

  -- Asking again for an account that already has a household must change nothing.
  perform private.create_household('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  assert (
    select count(*) from public.household_members
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) = 1, 'create_household made a second household for the same account';
end;
$$;

-- Remember A's household, to try writing into it as B further down.
select set_config(
  'check.household_a',
  (
    select household_id::text from public.household_members
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  true
);

-- From here on, act the way the Data API does for a signed-in request: as the
-- "authenticated" role, with the account's id in the request's token.
set local role authenticated;


-- Account A: starts with its own staples and adds some rows -------------------------

select set_config(
  'request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}',
  true
);

do $$
begin
  assert (select count(*) from public.households) = 1, 'A sees a household that is not its own';
  assert (select count(*) from public.household_members) = 1, 'A sees a membership that is not its own';
  assert (select count(*) from public.ingredients) = 10, 'A does not start with exactly the 10 staples';
end;
$$;

-- A adds a food with one purchase, and one shopping item, the way the app does. The
-- call is sent twice, as it would be after a lost connection, and must end in the
-- same state.
do $$
begin
  for attempt in 1..2 loop
    perform public.apply_changes(
      save_ingredients => '[{
        "id": "a1111111-1111-4111-8111-111111111111", "name": "Tofu", "tracking": "count",
        "status": null, "usual_amount": 2, "usual_unit": "count", "usual_label": "block",
        "usual_storage": "fridge"
      }]',
      save_batches => '[{
        "id": "a2222222-2222-4222-8222-222222222222",
        "ingredient_id": "a1111111-1111-4111-8111-111111111111",
        "amount": 2, "unit": "count", "label": "block", "is_estimate": false,
        "storage": "fridge", "use_by": "2030-01-01", "date_source": "estimated", "price_cents": null
      }]',
      save_shopping_items => '[{
        "id": "a3333333-3333-4333-8333-333333333333", "ingredient_id": null, "name": "Milk",
        "amount": null, "unit": null, "label": null, "created_at": "2030-01-01T00:00:00Z"
      }]'
    );
  end loop;

  assert (select count(*) from public.ingredients) = 11, 'A cannot see the food it added';
  assert (select count(*) from public.batches) = 1, 'A cannot see the purchase it added';
  assert (select count(*) from public.shopping_items) = 1, 'A cannot see the shopping item it added';
end;
$$;

-- The database refuses a unit the app does not know, in every table that keeps one,
-- and a second food whose name differs only in capitals (HW-60).
do $$
begin
  begin
    perform public.apply_changes(
      save_batches => '[{
        "id": "a4444444-4444-4444-8444-444444444444",
        "ingredient_id": "a1111111-1111-4111-8111-111111111111",
        "amount": 2, "unit": "lbs", "label": null, "is_estimate": false,
        "storage": "fridge", "use_by": "2030-01-01", "date_source": "estimated", "price_cents": null
      }]'
    );
    raise exception 'A purchase with the unknown unit lbs was saved';
  exception when check_violation then
    null; -- Expected: the unit check refuses it.
  end;

  begin
    perform public.apply_changes(
      save_ingredients => '[{
        "id": "a5555555-5555-4555-8555-555555555555", "name": "Pork", "tracking": "weight",
        "status": null, "usual_amount": 454, "usual_unit": "lbs", "usual_label": null,
        "usual_storage": "fridge"
      }]'
    );
    raise exception 'A food with the unknown usual unit lbs was saved';
  exception when check_violation then
    null;
  end;

  begin
    perform public.apply_changes(
      save_shopping_items => '[{
        "id": "a6666666-6666-4666-8666-666666666666", "ingredient_id": null, "name": "Pork",
        "amount": 454, "unit": "lbs", "label": null, "created_at": "2030-01-01T00:00:00Z"
      }]'
    );
    raise exception 'A shopping item with the unknown unit lbs was saved';
  exception when check_violation then
    null;
  end;

  begin
    perform public.apply_changes(
      save_ingredients => '[{
        "id": "a7777777-7777-4777-8777-777777777777", "name": "tofu", "tracking": "count",
        "status": null, "usual_amount": null, "usual_unit": null, "usual_label": null,
        "usual_storage": null
      }]'
    );
    raise exception 'A second food named tofu was saved next to Tofu';
  exception when unique_violation then
    null; -- Expected: the household already has this name.
  end;

  begin
    update public.ingredients set name = 'TOFU' where name = 'Salt';
    raise exception 'Salt was renamed to TOFU next to Tofu';
  exception when unique_violation then
    null;
  end;

  assert (select count(*) from public.ingredients) = 11, 'A refused change still added a food';
  assert (select count(*) from public.batches) = 1, 'A refused change still added a purchase';
  assert (select count(*) from public.shopping_items) = 1, 'A refused change still added a shopping item';
end;
$$;


-- Account B: sees none of it, and cannot change any of it --------------------------

select set_config(
  'request.jwt.claims',
  '{"sub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "role": "authenticated"}',
  true
);

do $$
begin
  assert (select count(*) from public.households) = 1, 'B sees A''s household';
  assert (select count(*) from public.household_members) = 1, 'B sees A''s membership';
  assert (select count(*) from public.ingredients) = 10, 'B sees A''s foods';
  assert not exists (select 1 from public.ingredients where name = 'Tofu'), 'B sees A''s tofu';
  assert (select count(*) from public.batches) = 0, 'B sees A''s purchases';
  assert (select count(*) from public.shopping_items) = 0, 'B sees A''s shopping list';
end;
$$;

-- B tries to change and remove A's rows. RLS hides them from B, so these find
-- nothing to touch. A's rows are checked again further down.
update public.batches set amount = 99 where id = 'a2222222-2222-4222-8222-222222222222';
delete from public.batches where id = 'a2222222-2222-4222-8222-222222222222';
delete from public.ingredients where id = 'a1111111-1111-4111-8111-111111111111';
delete from public.shopping_items where id = 'a3333333-3333-4333-8333-333333333333';
select public.apply_changes(
  remove_shopping_items => array['a3333333-3333-4333-8333-333333333333']::uuid[],
  remove_batches => array['a2222222-2222-4222-8222-222222222222']::uuid[],
  remove_ingredients => array['a1111111-1111-4111-8111-111111111111']::uuid[]
);

-- B tries to write into A's household. Each attempt must be refused with an error.
do $$
declare
  household_a uuid := current_setting('check.household_a')::uuid;
begin
  begin
    insert into public.ingredients (household_id, name, tracking)
    values (household_a, 'Sneaky', 'count');
    raise exception 'B added a food to A''s household';
  exception when insufficient_privilege then
    null; -- Expected: the row breaks the RLS policy.
  end;

  begin
    update public.ingredients set household_id = household_a where name = 'Salt';
    raise exception 'B moved one of its foods into A''s household';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.apply_changes(
      save_batches => '[{
        "id": "a2222222-2222-4222-8222-222222222222",
        "ingredient_id": "a1111111-1111-4111-8111-111111111111",
        "amount": 99, "unit": "count", "label": "block", "is_estimate": false,
        "storage": "fridge", "use_by": "2030-01-01", "date_source": "estimated", "price_cents": null
      }]'
    );
    raise exception 'B overwrote A''s purchase through apply_changes';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

-- A food name is unique within a household only: B can have its own Tofu (HW-60).
do $$
begin
  perform public.apply_changes(
    save_ingredients => '[{
      "id": "b1111111-1111-4111-8111-111111111111", "name": "Tofu", "tracking": "count",
      "status": null, "usual_amount": null, "usual_unit": null, "usual_label": null,
      "usual_storage": null
    }]'
  );
  assert (select count(*) from public.ingredients) = 11, 'B could not add a Tofu of its own';
end;
$$;


-- Account A again: everything is still there, unchanged -----------------------------

select set_config(
  'request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}',
  true
);

do $$
begin
  assert (select count(*) from public.ingredients) = 11, 'A lost a food';
  assert (
    select amount from public.batches where id = 'a2222222-2222-4222-8222-222222222222'
  ) = 2, 'A''s purchase was changed or removed';
  assert (select count(*) from public.shopping_items) = 1, 'A lost a shopping item';
end;
$$;


-- A request that is not signed in: refused, not answered with an empty list ---------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'households', 'household_members', 'ingredients', 'batches', 'shopping_items'
  ] loop
    begin
      execute format('select 1 from public.%I', table_name);
      raise exception 'A request that is not signed in could read %', table_name;
    exception when insufficient_privilege then
      null; -- Expected: permission denied.
    end;
  end loop;

  begin
    perform public.apply_changes();
    raise exception 'A request that is not signed in could call apply_changes';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

select 'All checks passed. Nothing was saved.' as result;

rollback;

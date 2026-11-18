-- Two checks the database makes itself, so a wrong row is refused when it is written
-- instead of breaking the Kitchen when the app reads it (HW-60).
--
--   1. Only the units the app knows.
--   2. Each food name once per household.
--
-- The first migration is applied and is never edited, so the changes are here.


-- 1. Only the units the app knows ---------------------------------------------------

-- The first migration took any unit of 1 to 12 characters. A wrong one, such as
-- 'lbs', was only caught when the app read the household, and then the whole
-- Kitchen failed to load. These checks replace the length checks.
--
-- The list must equal UNITS in src/data/units.ts, and src/data/units.test.ts fails
-- when the two differ. A new unit is a new line there and a small migration like
-- this one: drop these three checks and add them again with the longer list.
--
-- A unit can be empty where the column allows it: "in" lets null through.
alter table public.batches
  drop constraint batches_unit_check,
  add constraint batches_unit_known
    check (unit in ('lb', 'oz', 'fl oz', 'cup', 'gal', 'count'));

alter table public.ingredients
  drop constraint ingredients_usual_unit_check,
  add constraint ingredients_usual_unit_known
    check (usual_unit in ('lb', 'oz', 'fl oz', 'cup', 'gal', 'count'));

alter table public.shopping_items
  drop constraint shopping_items_unit_check,
  add constraint shopping_items_unit_known
    check (unit in ('lb', 'oz', 'fl oz', 'cup', 'gal', 'count'));


-- 2. Each food name once per household ----------------------------------------------

-- The app looks for a food by name before it adds one, and capitals do not count
-- ("Ground pork" and "ground pork" are the same food). Two phones offline, or a
-- server that writes foods, could still get past that, and the purchases would be
-- split between two foods. This index refuses the second one.
--
-- The app saves every name cleaned (no spaces at the ends, single spaces inside), so
-- lower(name) here matches its rule. Two households can each have a food of the same
-- name.
create unique index ingredients_household_id_name_idx
  on public.ingredients (household_id, lower(name));

# Homewok v1 Spec

Last updated: 2026-11-11. Status: approved by the user on 2026-11-10.

This is the scope of the first version: what we build, in what order, and how we know each step is done. The reasons and the detailed rules live in `docs/decisions.md`. The visual rules live in the Homewok design system: https://claude.ai/artifact/WCfXhKPjTHYSUJrDqFKe7k

## Goal

A personal iOS app for one household that keeps track of the kitchen and suggests tonight's dinner from it.

v1 is done when all six milestones below pass their "done when" checks. Using it at home afterwards shows what to fix next; it is not a gate for finishing.

## In v1

- Sign in with Google.
- Kitchen: foods grouped by storage, batches, use-soon pills, staples, the edit sheet, and Used some.
- Adding food: the quick-add line, Recent chips, the manual edit sheet, receipt photos, and voice.
- Shopping list: one tap moves a food to the Kitchen, and Add to list works the other way.
- Tonight: 3 ideas from current stock, Not tonight, Cook with, Cooked it with leftovers, a planned dinner, and a rough cost per serving.
- Recipes: its own tab with the recipes you saved or cooked.
- Setup: how many people, foods to avoid, and cuisines, then the reminder time after the first recipe.
- One daily notification.

## Not in v1

- Android, Sign in with Apple, a web app, and any Chinese UI.
- Online order screenshots, package label scans, and barcodes.
- Outside recipes, nutrition, memories, badges, and the monthly recap.
- Family sharing. Every row still carries a `household_id` from the start.
- Self-hosted models and a demo mode.

## Screens

| Screen | What it does |
| ------ | ------------ |
| Login | The wok doodle on a drawn shelf line, the name, the tagline "All wok, no work.", and Continue with Google |
| Setup | Three one-tap questions, skippable |
| Tonight | Today's idea, Cook this, Not tonight, Cook with, and a planned dinner |
| Recipe | Ingredients marked have or missing, steps, cost per serving, and Cooked it |
| Recipes | Its own tab: the recipes you saved or cooked, with an empty state until the first one |
| Kitchen | Inset grouped list by Fridge, Freezer, Pantry, and Staples, with the add button |
| Add sheet | Quick-add line, voice, receipt photo, Recent chips, and the rows to confirm |
| Edit sheet | Amount, unit, storage, date, and optional price, all on the phone |
| Shopping list | Items with one-tap checks, and Add to list |
| Settings | A sheet opened with the gear on every tab: people, foods to avoid, cuisines, reminder time and days, and sign out |

Tabs: Tonight, Kitchen, Shopping, and Recipes. Recipes gets its tab from the start so the layout never changes. It fills up as recipes are saved or cooked, and outside recipes join it later.

## Milestones

Each milestone ends with something usable on the iOS Simulator or the user's phone. Hours are rough guesses at 15 hours a week, including learning time.

| # | Milestone | Main work | Rough time |
| - | --------- | --------- | ---------- |
| 1 | Login | Expo project, Supabase project, Google sign-in, stay signed in, sign out, empty tabs | 1 to 2 weeks |
| 2 | Kitchen by hand | Tables and row-level security, Kitchen list, edit sheet, Used some, staples, shopping list, sample data button | 2 to 3 weeks |
| 3 | Quick add | Edge Function with Gemini that turns a typed list into rows, Recent chips, rate limits | 1 to 2 weeks |
| 4 | Tonight | Ideas from stock, recipe page, Cooked it with leftovers, Not tonight, Cook with, planned dinner, cost per serving | 3 weeks |
| 5 | Setup and notification | Setup flow, settings, the daily notification and its back-off rules | 1 to 2 weeks |
| 6 | Receipts and voice | Receipt photo to rows with a review screen, aliases, voice through Gemini audio | 2 weeks |

### Done when

1. **Login:** you can sign in with Google on the Simulator, close and reopen the app and still be signed in, and sign out. Lint, type check, and tests pass.
2. **Kitchen by hand:** you can add, edit, use, and delete foods without any AI, a second account cannot see them, checking a shopping item moves it to the Kitchen with Undo, and the amount and date rules have tests.
3. **Quick add:** "ground pork 1 lb, 10 eggs" becomes two rows in about 3 seconds, unreadable input fails with a clear message, and the text is kept when it fails.
4. **Tonight:** an idea uses at least one use-soon food when there is one, never includes a food to avoid (checked by code, with tests), and Cooked it updates the Kitchen.
5. **Setup and notification:** one message arrives at the chosen time with the content in the agreed order, and none arrives after Cooked it or Not cooking tonight. This step needs the Apple Developer Program.
6. **Receipts and voice:** a typical receipt needs only a few fixes, nothing is saved before the review screen, and model choices are compared on 10 real receipts first, with the user's go-ahead for the API calls.

## Every milestone

- Check on the Simulator at the smallest and largest iPhone sizes, in light and dark mode, with large text.
- Run lint, type check, and tests for pure logic.
- Update `docs/dev-log.md`, and list what to push and what to leave out.
- Explain the new code in a walkthrough.

## Data (v1)

Tables: `households`, `household_members`, `ingredients`, `batches`, `events`, `recipes`, `shopping_items`, and `settings`. Fields and rules are in `docs/decisions.md` under Data Model. Row-level security limits every table to the signed-in user's household.

## Design files

`design/` holds the design system's sources: `tokens.json`, the brand book `README.md`, one guideline file per component, and the doodles. The app's theme file is built from `design/tokens.json`. After a change in `design/`, the design system artifact is republished so its previews match.

## Doodles (v1)

The four doodles in `design/doodles/` cover the login shelf and two empty screens. v1 needs about eight more in the same style, drawn by Claude as SVG when each screen is built: the empty shopping list, the empty Recipes screen, the three setup questions, an error state, a finished dish for Cooked it, and the receipt review.

## Open questions

- Offline: which library keeps lists readable offline and queues edits. Decide during milestone 2.
- When to join the Apple Developer Program: at milestone 5 at the latest.

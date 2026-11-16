# Homewok Decisions

Last updated: 2026-11-12. This records what has been decided and what is still open. The v1 scope is in `docs/spec.md`, and building started with milestone 1.

## Build Order

**The project starts with the login page.** The v1 milestones, their order, and when each one is done are in `docs/spec.md`.

## Product

- **Name:** Homewok (home + wok, and it sounds like homework). Kept on 2026-11-10 after considering Wokday, Chifanle, Wokwise, Homewokly, and Homewokit.
- **Tagline:** "All wok, no work." It turns the homework sound of the name into a joke instead of pressure.
- **Who it is for:** Chinese families in the US. The app is English only, and its recipes and ingredients lean toward Chinese home cooking. Other cuisines such as Thai and Italian are available.
- **Stage:** personal project, one developer, about 15 hours a week. Focus on features.
- **Core:** keep both inventory and the daily dinner decision. Inventory is the input and dinner is the output.
- **Platform:** iOS only for now. Android may come later. Old data is not migrated.
- **Language:** English only. No Chinese UI and no multi-language layer.
- **Data in any language:** users may type food names in Chinese or any other language. Names are stored as typed, matched to existing foods through aliases, and recipes are still written in English. The Chinese unit jin is ambiguous (600 g in Taiwan, 500 g in mainland China), so ask once and remember.
- **Style:** warm, approachable, efficient, organic. No purple gradients, glass effects, or cold dashboards.

## Technical

| Area | Decision | Notes |
| ---- | -------- | ----- |
| App | Expo (React Native) + TypeScript | Google sign-in needs a development build, not Expo Go |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions, scheduling | Replaces Neon and Cognito. No separate API server, Vercel, or Prisma for now |
| Project setup | Expo SDK 58 from the blank TypeScript template, plus Expo Router | Only the libraries milestone 1 needs. The development build is made on the Mac with Xcode (`npm run ios`), so there is no Expo account and no EAS |
| Bundle ID | `com.albert.homewok` | The iOS OAuth client in Google Cloud is tied to it, so changing it means making a new client. Chosen 2026-11-10 |
| Login | Google only for now | Works on the iOS Simulator without a paid Apple account. Add Sign in with Apple before any App Review (App Store guideline 4.8) |
| Google sign-in | The free `@react-native-google-signin/google-signin` library shows Google's native account sheet and returns an ID token, and Supabase checks it with `signInWithIdToken` | No browser redirect. Only `src/features/auth/google.ts` uses the library, so replacing it stays a one-file change |
| Nonce check | "Skip nonce checks" is on for the Google provider in Supabase | The free library cannot pass a nonce on iOS, so Supabase would reject every sign-in. The cost: someone who steals a still-valid ID token issued to this app (about an hour) could replay it. Accepted for a personal app on 2026-11-10. Revisit together with Sign in with Apple before any App Review; the paid Universal version of the library supports nonces |
| Session storage | `localStorage` from `expo-sqlite`, as in Supabase's Expo guide | The session stays in the app's own sandbox. The Keychain (`expo-secure-store`) is stricter, but a session is larger than its 2 KB guideline and would need an extra encryption layer |
| Sign out | In Settings, a native sheet opened with the gear at the top right of every tab. It signs out this phone only | The saved session is removed first, so it works offline. Milestone 1's Settings holds only the account and Sign out. The gear was only on Tonight until 2026-11-11, when the user looked for it on the other tabs |
| App settings | Four public values in `.env.local`, which is not in git: the Supabase URL and publishable key, and the Google web and iOS client IDs | `src/lib/env.ts` stops the app with a clear message when one is missing, wrong, or a secret key. `docs/setup.md` has every step |
| Text size | All text grows with the iOS text size setting. Serif titles stop at the sizes iOS itself uses | React Native grows every text by one factor, which made a 34px title three times larger. The `Title` component caps large-title at 60/34, title-1 at 58/28, and title-2 at 56/22 of the default size, from Apple's Dynamic Type table. Chosen 2026-11-11 |
| Demo mode | None | If the app ever goes public, use Supabase anonymous sign-in instead of a shared demo account |
| Sample data | A "Load sample kitchen" button that only exists in development builds (`__DEV__`) | Dates are relative to today, so there is always something expiring. Uses the hosted Supabase project, so no Docker is needed |
| Offline | TanStack Query v5 keeps a copy of the kitchen and shopping lists on the phone, and edits wait in a queue until the phone is online | Chosen 2026-11-12. It is free, needs no account, and the data stays in Supabase. Passed over: PowerSync (a separate service, $49 a month beyond its free plan, and the access rules must be written a second time there), Legend-State v3 (still a beta), TanStack DB (1.0 is a release candidate), and a hand-written SQLite copy (a small sync engine to maintain). It is a cache and a queue, not sync between devices: with family sharing, two phones changing the same row means the last one wins, so look again then |
| Saving changes | Every action is one call to the database function `apply_changes`: the rows to save and the ids to remove, in one transaction | Checking off a shopping item saves a purchase and removes the item, and both happen or neither does. Sending a call twice ends in the same state, so a queued edit can be sent again safely. Undo sends the reverse changes. Chosen 2026-11-12 |
| Row ids | Made on the phone with `expo-crypto` | A food added offline can be edited before it has reached the database. Ids made by the database would need temporary ids that are swapped later |
| Households | A database trigger on `auth.users` gives each new account a household, a membership, and ten starter staples | The app never sees someone who is signed in but has no household. One household per person for now: `household_members.user_id` is the primary key. The staples are salt, sugar, cooking oil, soy sauce, rice, cornstarch, sesame oil, rice vinegar, white pepper, and oyster sauce |
| Row-level security | Every table compares `household_id` with the signed-in person's household. A request that is not signed in has no privileges at all | Such a request gets an error and never an empty list, which could otherwise replace the copy on the phone with an empty kitchen. `supabase/tests/two_accounts.sql` proves it with two throwaway accounts and leaves nothing behind |
| Migrations | SQL files in `supabase/migrations/`, applied to the hosted project through the Supabase connector after the user has read them | No Supabase CLI, no Docker, and no database password in a chat. Chosen 2026-11-12 |
| Outside data | Checked with `zod` before use: rows from Supabase and the copy saved on the phone | A row in an unexpected shape is a clear failure and never a wrong amount. A test keeps the checks equal to the columns in the migration |
| Date picker | `@react-native-community/datetimepicker`, the native iOS calendar | Expo's `@expo/ui` has a compatible component, so changing later is one import |
| Code hosting | A private GitHub repo. The user publishes and pushes from VS Code | Chosen 2026-11-11, replacing local git only. Every verified task becomes a commit, so any step can be restored. Claude still gets no GitHub connector or GitHub CLI, and commits never carry an AI co-author line, so Claude does not show up as a contributor |
| Design | Design system first, built on Apple's iOS defaults (Human Interface Guidelines) plus the Homewok personality | Direction A, Persimmon kitchen (chosen 2026-11-09). Linen background (#F4EDE3), serif titles (`ui-serif`) with system body text, warm charcoal dark mode. Components: capsule buttons, inset grouped lists, use-soon pills, the native iOS tab bar, and SF Symbols. Published as the Homewok design system: https://claude.ai/artifact/WCfXhKPjTHYSUJrDqFKe7k |
| Google button | Follows Google's branding guidelines | Full-color G logo, white fill with a #747775 outline in light mode, Google's dark style in dark mode. The one control that does not use Homewok tokens |
| Login screen | Shelf layout with one doodle: the wok stands on a short drawn shelf line, then the name and the tagline "All wok, no work.", all centered a little above the middle, with a 32px page margin | Shelf layout chosen 2026-11-10. Changed from four doodles to the wok alone on 2026-11-11: four in a row were crowded at phone width, and the page looked empty yet tight at the sides. On 2026-11-12 the user kept the steaming wok as it is, over the same wok with the app icon's roof and over the icon itself |
| Tabs | Tonight, Kitchen, Shopping, Recipes | Recipes has its own tab from the start so the layout never changes. Chosen 2026-11-10 |
| Design files | `design/` in the project is the source; the artifact is the viewer | Edit `design/`, then republish the artifact |
| Illustrations | Ink doodles of food, in Homewok's own style. Every empty screen has one of its own | Loose hand-drawn lines. Only on login, empty screens, setup, and badges, never on lists. Not copied from any brand. The four tabs show eggs, scallions, a grocery bag, and a rice bowl. The grocery bag was drawn on 2026-11-12, after the user saw that Shopping was the one tab without a doodle: a set of screens either all have one or none do, and `EmptyState` now requires one |
| App icon | A roof over a wok on a linen tile: the name, drawn. The roof is ink and the wok is persimmon. Kept as an Icon Composer file, `design/icon/AppIcon.icon`, that `app.config.ts` points at | Chosen 2026-11-11 over a steaming wok and a wok whose lid is the roof part of the Chinese character for home. Among 69 food apps on the App Store the usual icon was a white bowl on an orange-red tile, none had a roof, and a linen tile stood out. Persimmon is on the wok, not the roof, so the icon is not taken for Apple's Home app. The colors are the `canvas`, `ink`, and `accent` tokens with their dark values, and a test keeps them equal. The layers are flat, with no glass. The file sets each layer's color for every mode, because iOS left to itself kept the ink color on the dark tile, where it disappears. The icon does not appear inside the app (2026-11-12): Apple's guidelines advise against repeating a logo on working screens and against a logo on the launch screen, so the launch screen is a plain canvas color and the login page keeps its steaming wok. The system already shows the icon on the Home Screen, in notifications, in search, and in the app switcher |
| AI | Gemini API (paid LLM API), called through one small `ai` module | No self-hosted model. Start on a $5 prepaid balance, which stops at $0 instead of overcharging |
| Receipts | Send the photo straight to the vision model, ask for structured JSON | Compare Flash-Lite models on real receipts before settling on one |
| Push | Expo push service over APNs | Needs the paid Apple Developer Program |
| Units | Store grams and ml, display lb, oz, and fl oz | Adding metric later only changes the display |

## iOS Cost Path

- **$0:** iOS Simulator on the Mac mini, and installing on your own iPhone through Xcode with a free Apple ID (the app stops working after 7 days and must be reinstalled).
- **$99 a year (Apple Developer Program):** required for TestFlight, remote push notifications, and Sign in with Apple. Pay when the daily notification step needs it.

## Data Model (Draft)

- `ingredients`: one per household. Name, aliases, category, tracking type (`weight`, `volume`, `count`, or `level`), and status (`have`, `low`, `out`) for `level` items. Created automatically the first time a food is added.
- `batches`: one purchase. Remaining amount, optional display label ("block", "stalk"), storage, date, date source (sell-by, use-by, best-by, estimated), and whether the amount is an estimate.
- `events`: every stock change. Amount and reason (added, cooked, used, threw away, moved), with an optional recipe link.
- `recipes`: structured ingredient lines with an optional link to an ingredient, steps, and a source link.
- `shopping_items`: its own list.
- Every row belongs to a `household_id`, so family sharing can come later.

There is no global food catalog, no units table, and no separate condiments table.

### What milestone 2 built

The tables are in `supabase/migrations/`. They follow the draft above, with these differences (2026-11-12):

- **`households` and `household_members`** are new tables behind `household_id`.
- **A purchase keeps its unit.** `batches.unit` is the unit the amount was typed in (`lb`, `oz`, `fl oz`, `cup`, `gal`, or `count`), so 8 oz is shown as 8 oz and not as ½ lb. The amount itself is still stored in grams, ml, or pieces.
- **A food remembers its usual purchase:** `usual_amount`, `usual_unit`, `usual_label`, and `usual_storage` on `ingredients`, copied from the last purchase the person entered. It is what "the last amount bought" needs after a food is used up, and milestone 3 can put the AI's guess at a typical pack size in the same place.
- **A purchase with nothing left is removed,** and so is a shopping item that was checked off. The two tables only hold what is in the kitchen and what is still to buy.
- **`aliases` and `category` are not there yet.** They arrive with the milestones that fill them: 6 (receipts) and 3 (the AI's first guess).
- **`events` waits for milestone 4,** when Cooked it first needs the history. Nothing in milestones 2 and 3 reads it, and writing it now would make every action two writes that must succeed together. The cost: history starts at milestone 4.
- **`recipes` and `settings`** wait for milestones 4 and 5.

### Amounts

- Code only knows three amount kinds: weight, volume, and count. A label such as "stalk" is display text, and no logic depends on it.
- Deduction rule: same kind and same label means subtract. Anything else means ask None, Some, or All. "Some" takes half of what is left and marks the amount as an estimate.
- A deduction takes from the purchase with the soonest date first. Amounts that cannot be added, such as 1 bunch and 3 stalks, are shown side by side and halved separately by "Some" (2026-11-12).
- Each unit is one line of data in `src/data/units.ts`: its size in the base unit, its word, its stepper step, and its one-tap amounts. A total across purchases uses the largest of their units.
- Using a food up keeps the food, with its usual purchase, and offers Add to list. Removing a food's last purchase removes the food too, so a food added by mistake leaves nothing behind (2026-11-12).

## Where Logic Lives

| In code (pure functions with tests) | In the LLM (output validated by code) |
| ----------------------------------- | ------------------------------------- |
| Which foods are use-soon, soonest-date-first deduction | Writing recipes in a chosen cuisine |
| Allergen filter and checks on generated recipes | Reading receipts and pages into structured data |
| Safe-date rules, including caps for raw meat, poultry, and seafood | Expanding "ORG BNLS CHKN" to chicken breast |
| Notification timing and back-off, rate limits | Parsing "half a cabbage" into an amount |
| Unit display, cuisine rotation | First guess at a new food's category and shelf life |

## Feature Design (Draft)

### Setup

- One full-screen flow, one question per page, tap to answer, skippable, about 30 seconds. No pop-ups.
- Questions: how many people, allergies and foods to avoid, favorite cuisines, reminder time.
- Ask the reminder time after the first recipe, because iOS only shows its permission dialog once.

### Tonight and Wrong Suggestions

- Prepare 3 ideas up front, and generate the full recipe when one is opened.
- "Not tonight" offers: Another idea, Too much work, Cook with, and Not cooking tonight.
- It also lists the dish's main ingredients, each with "Don't have it" (fixes stock) and "Skip tonight" (excluded for today only). Code checks that new ideas leave out skipped foods. After the same food is skipped 3 times, offer once to add it to foods to avoid.
- When AI fails, show a clear error and list saved recipes that can be made from current stock.

### Cook With X

- Two entry points: "Cook with" on Tonight, and "Cook with this" on an ingredient.
- A bottom sheet sorted by use-soon. Pick 1 to 3, get 3 ideas (name, time, what is missing), and generate the full recipe when one is opened.
- A "Leave out" row in the same sheet excludes foods for this request.

### Shopping List

- Like pantry-ai's To Buy list: one tap on an item's check marks it bought and moves it into the Kitchen, with a toast and Undo. Nothing else is asked.
- The new batch takes the item's amount (or the last amount bought, or the typical pack size), and its use-by date is estimated. Staples go back to Have.
- The reverse is one tap too: a food marked used up, or a staple marked Out, offers "Add to list".

### Planned Dinner

- For people who decide on a dish at work and shop on the way home. "I already know what I want" on Tonight takes a dish name or a saved recipe.
- The app shows what is already in the kitchen and what to buy. The shopping list is used at the store, and checking an item off adds it to the kitchen.
- Tonight then shows the planned dish. The daily message only reminds about items still missing.

### Cooked It

- One button. The sheet is pre-filled with recipe amounts, so with no differences you just confirm.
- Adjust servings, and set each ingredient to None, Some, the recipe amount, or All. Undo is available.
- Cooking without a recipe uses "Used some" on the ingredient. Staples are not deducted.
- The sheet also asks how many servings are left, plus an optional rating and photo.

### Leftovers

- Leftovers are a batch of the dish with the label "serving", stored in the fridge. No new concept is needed.
- Eat-by date is the cooked date plus 3 days, a code rule based on USDA's 3 to 4 days. Freezing changes it to a quality date about 3 months out.
- Actions: Ate some, Freeze, and Pack for lunch.
- Restaurant and takeout leftovers work the same way: a quick add with a name and servings. Recording them is optional.
- When there are enough servings, Tonight suggests leftovers plus a quick side dish instead of a new recipe.

### Condiments

- One staples list, stored as `level` ingredients, seeded from a short default list. Staples are assumed available.
- A recipe lists "Check you have" for staples. Anything not on the list is marked optional with a substitute, and answering "Have it?" once remembers it.
- A new user only needs to enter 3 to 5 foods on day one.

### Adding Stock

- Receipt photo, online order screenshot, and text or voice with several items at once. Package label photo and barcode come later.
- Receipts always get a review screen, and only flagged lines need fixing. Fixing a line saves it as an alias for next time.
- Manual entry: one quick-add line takes several foods at once ("ground pork 1 lb, 10 eggs"), and each becomes a row with the category and date filled in. A "Recent" row adds a past purchase again with one tap.
- Tapping a row opens the edit sheet: amount stepper, unit toggle (lb, oz, count), quick amount chips, storage (Fridge, Freezer, Pantry), and an estimated date that can be changed. The same sheet is the manual form when AI is unavailable.
- The quick-add line is read only after the user taps the arrow, never while typing, and takes about 1 to 3 seconds. The same box can add more rows before confirming.
- The edit sheet runs entirely on the phone with no AI call, so it opens and saves instantly. The screen updates first and the save happens in the background, and a failed save reverts and says so.
- Dates: estimated by default, typed in the sentence ("chicken thighs expire Friday"), or set in the edit sheet with chips (Tomorrow, In 3 days, In a week) or a calendar. Package label scanning comes later.
- Until milestone 3 guesses a shelf life for each food, the estimate depends only on the storage place: 7 days in the fridge, 90 in the freezer, and 180 in the pantry, kept as data in `src/data/storages.ts`. Moving a purchase to another place estimates the date again (2026-11-12).
- Voice (proposed): record with `expo-audio` and send the audio to Gemini with the item schema in one call. Gemini counts 32 tokens per second of audio, so a 10-second list costs a small fraction of a cent. No on-device Whisper: splitting speech into foods needs the LLM, which is online anyway. A free on-device option is Apple's SpeechAnalyzer (iOS 26) through a community module, if testing shows it is good enough.
- Amounts are never required. A food added without one takes the last amount bought, or the typical pack size the AI guessed in the same call, shown with "~". Receipts and shopping list items carry their own amounts.
- The edit sheet shows only the units for the food's kind, from one constant list in code: weight shows lb and oz, volume shows fl oz, cup, and gal, counted foods show their own label with no unit control, and staples show Have, Low, and Out.
- Offline: the kitchen and shopping lists stay readable without a connection, and check-offs and edits wait in a queue until the phone is online. Typed or spoken lists are kept and read once online. The approach was chosen on 2026-11-12: see Offline and Saving changes under Technical.

### Outside Recipes

- First version: paste a link, paste text, or add a photo or screenshot.
- Link flow: read the page's schema.org Recipe data, use the LLM on the page text if there is none, and ask for a screenshot if the site blocks the request.
- Later: the iOS share sheet, then video.
- Everything becomes the same structure, keeps its source link, and is for personal use only.
- Saved recipes also feed Tonight when current stock can make them.

### Nutrition

- First version: calories and protein per serving, labeled as estimated.
- Later: calculate from grams using USDA FoodData Central, and add light weekly notes. No medical or weight-loss advice.

### Notifications

- At most one a day by default, at a chosen time (default 4:30 PM), combining the recipe and use-soon foods, with "Cook this" and "Another idea".
- The one message is built in this order: leftovers first, then the use-soon foods tonight's dish uses, then up to 2 other use-soon foods ("Also use soon: milk"). With nothing urgent, it is just the recipe.
- Skip it if the user already chose "Cooked it" or "Not cooking tonight" today. Users choose which days.
- After 3 ignored days, send every other day. After 7 ignored messages, stop and show a note in the app.
- No "we miss you" messages or streaks. Past-date raw meat never appears in a suggested recipe.
- Optional and off by default: a morning thaw reminder, and a weekly summary before shopping.

### Memories and Rewards

- Every "Cooked it" can save a rating and a photo, which builds a family cookbook over time.
- A monthly recap shows dinners at home, new dishes, foods rescued, the value of food used before its date, and the value thrown away. Values come from receipt prices, and foods without a price only count as items.
- Nothing is called "money saved", because what would have happened without the app cannot be known.
- Show a rough cost per serving on home-cooked dinners ("about $2 per serving"), rounded to the nearest $0.50, so people feel what cooking at home is worth.
- Price sources, in order: the receipt price, the user's last price for that food, then a rough typical price the AI guesses in the same call when the food is first added (marked as a guess). The edit sheet has an optional price field. Staples are ignored.
- Later and optional: a comparison with the user's own usual takeout price, never other people's spending, and nothing shown on nights they eat out.
- About 10 badges, each with bronze, silver, and gold tiers, defined as data. They count totals instead of streaks, so tiers only go up and nothing scolds.

## Still Discussing

- **The real competition:** old habits such as opening the fridge, cooking the same few dishes, or searching for a recipe. Working test: every feature must be less effort than opening the fridge, or do something the fridge cannot.
- **Biggest pain, working guess:** "what's for dinner" at the end of the day (frequent), plus forgetting food until it goes bad (strong feeling). The daily message aims at both. To be checked against real family routines.
- When to add Sign in with Apple and pay for the Apple Developer Program.
- The Google button's font: Google's guidelines name Google Sans Medium at 14/20. The app uses the iOS system font at that size and weight, so no font file is bundled. Decide before any App Review.
- Where a tab's own action goes, such as the Kitchen's add button, now that the gear holds the top right of every tab. Decide when the Kitchen screen is built in milestone 2.
- Standing out: the linen, serif, and persimmon palette is common in AI-generated designs. Identity has to come from Homewok's own doodles, the drawn shelf line, the copy (for example the tagline "All wok, no work."), and one food-specific detail to pick later. The app icon's roof over a wok is the first mark of its own (2026-11-11). Avoid copy that frames dinner as homework or a task.

## Dropped

- **Daily draw (2026-11-09):** a game that reveals tonight's pick. Too complex and not rewarding enough. The reward lives in memories and badges instead.

# Homewok Decisions

Last updated: 2026-11-21. This records what has been decided and what is still open. The v1 scope is in `docs/spec.md`, and building started with milestone 1.

## Build Order

**The project starts with the login page.** The v1 milestones, their order, and when each one is done are in `docs/spec.md`.

## Milestone Sign-off

Chosen 2026-11-16, for the rest of milestone 2 and every milestone after it. Until then Claude wrote the code, the "done when" line, the check, and the report, so nothing outside Claude confirmed that a milestone was done.

- **Acceptance checks:** before a milestone's code starts, Claude turns its "done when" line into stories, each with acceptance checks: short Given / When / Then steps that the user can try on the Simulator or the phone. For example: given Eggs is on the shopping list, when I tap its check, then it leaves the list and Eggs appear under Fridge with a date 7 days out. The user edits and approves them before any code is written.
- **Jira:** the work lives in one Jira space (Jira's name for a project since 2025) on the free plan: team-managed, Kanban, key `HW`. Each milestone is an epic with estimated start and due dates, so the Timeline shows the plan and the real dates can be compared later. Under it, a story is something the user can see and try, with its checks in the description; a task is technical work, such as CI; and a bug is a bug. The board's columns are To Do, In Progress, In Review, and Done, with a backlog for drafts. In the current Jira the backlog is added from the space's navigation (Add to navigation), not under Features.
- **Who moves what:** Claude adds drafts to the backlog, ordered so the top card is the next one, and comments when asked. The user approves a card by dragging it from the backlog list onto the board, where it lands in To Do; in a team-managed space a status change does not move a card between the two. When the user says "do the next card", Claude takes the top card in To Do, moves it to In Progress, and to In Review when its pull request is open, with a comment on how to try it. A request in chat for work without a card approves it: Claude creates the card and the user drags it onto the board. Anything out of scope found during the work becomes a backlog card for the user to decide on. Only the user moves work to Done, after trying it. Claude never deletes anything there, and asks before changing checks the user approved.
- **Size of a request (2026-11-16):** one card per request and one pull request per card, in a fresh session named after the card, such as "HW-21 Add CI", started from the sidebar. The card, `CLAUDE.md`, and `docs/dev-log.md` carry the context, so a short session costs far less than a long one, and a small pull request is easier to review. Planning and questions go in sessions of their own, where a cheaper model is enough. This replaces one long session per milestone, the way milestone 2 began: Jira now holds the split into pieces and the progress.
- **Whole screens first (2026-11-21):** a screen is designed whole before its cards are cut, so each session stays small and the screen still has one design. The edit sheet showed why: six cards build parts of it (`HW-12`, `HW-13`, `HW-14`, `HW-63`, `HW-64`, `HW-66`), and nobody had drawn the whole sheet. Its first design, from 2026-11-11, had the AI guess a new food's kind in the add sheet. When the + began opening the edit sheet empty on 2026-11-18, nothing asked a new food's kind any more, so a new liquid could not be added by hand (`HW-64`), and typing a staple's name turned it into a weighed food (`HW-66`). Now one design task per screen draws every row for every kind of food it handles (weighed, liquid, counted with its own word, and staple, both new and known). The user approves it, the cards that build the screen are linked in Jira as blocked by it, and each builds a part of it. A story's checks name at least one food of each kind its screen handles. Before a card's code starts, Claude lists the cases its screen will meet that neither the card nor the docs settle, and asks about them: `HW-12` decided a new food's units itself and only recorded it afterwards, which is what this replaces. The edit sheet's design task is `HW-67`.
- **Code:** each piece of work is a branch and a pull request whose title starts with its key, such as `HW-12`. If the GitHub for Jira app is installed later, it shows those branches, commits, and pull requests on the card. No automation moves a card: Claude moves cards to In Progress and In Review through the connector, and only the user moves them to Done, because merging code is not the same as trying it in the app (see Code hosting under Technical).
- **CI:** GitHub Actions runs `npm run check` on every pull request and every merge into `main` (see CI under Technical), so a pass comes from GitHub's machine and not from Claude's report.
- **Done:** a milestone is done when everything in its epic is Done, CI passes on the last merged commit, and the "Every milestone" list in `docs/spec.md` holds. Then it gets a git tag and a Jira release of the same name.
- **Why Jira (2026-11-16):** the user wants hands-on experience with the tool where product managers and engineers meet, and most software teams run their engineering work in Jira. Its free plan has what this flow needs: epics, a backlog, a board with an In Review column, and links to GitHub, for up to 10 people, with 2 GB of storage and 100 automation runs a month. Its interface is busier than Asana's, so the setup stays small: no sprints, story points, or components until they earn their place. Passed over: Asana, recommended to the user for its simpler interface, but its free plan has no status between not done and done, and business teams use it more than engineers do; a checklist file in the repo, which teaches no tool; and GitHub Issues, which only engineers use.
- **Where things live:** scope and each milestone's done-when summary stay in `docs/spec.md`, rules and their reasons in `docs/decisions.md`, and what was done and verified, by date, in `docs/dev-log.md`. Jira holds each piece of work, its acceptance checks, its order, and its status, which replaces the "Next" lists and the known-bug notes that used to live only in the dev-log. The cards are drawn from those docs, and keeping both in step is Claude's job (`CLAUDE.md` rule 8). If a card and the docs disagree, or neither settles a case the work meets, Claude asks before building.
- **First version:** Claude builds the space's first version through Atlassian's official connector: an epic per milestone, the rest of milestone 2 as stories, tasks, and bugs, and story titles for later milestones, which are refined before each one starts. The user creates the Atlassian account, the free site, and the empty space, adds the In Review column, and connects the connector, because those steps need their own sign-in.

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
| Backend | Supabase: Postgres, Auth, Storage, and scheduling. The app reads and writes the kitchen data directly | Replaces Neon and Cognito. No Vercel or Prisma. Row-level security in the database decides who sees what, so normal reads and writes need no server of our own. Every AI call goes to the AI server instead (2026-11-16) |
| AI server | Python and FastAPI in `server/`, in this repo. Every AI call goes through it. Pydantic, the Python counterpart of `zod`, checks each request and what the model sends back, and pytest tests the server | Chosen 2026-11-16 over Edge Functions, before any AI code existed, so nothing is rewritten. The user is aiming at AI engineering work, where Python and FastAPI are the usual tools. The server checks the person's Supabase sign-in, bounds the input, applies the rate limit, and calls Gemini with a time limit and an output token cap. It returns suggested rows or recipes, and the app saves them through `apply_changes`, so the kitchen still works when the server is down. If it later needs to read the database, it uses the person's own sign-in, so row-level security still applies |
| Edge Functions | Only small database jobs that need a schedule or admin rights | Candidates: sending the daily notification (milestone 5), and deleting an account, which App Review requires. Written in TypeScript and run by Supabase |
| Hosting the AI server | On the Mac until the deploy step between milestones 4 and 5, then on AWS as a Docker image, deployed by CI/CD when the checks pass | The Simulator reaches the Mac at `localhost`, and a phone on the home Wi-Fi reaches it at the Mac's local address. The deploy step is needed once the phone is used away from home, or once the daily notification needs a server that is always on. The AWS service is chosen at that step |
| Project setup | Expo SDK 58 from the blank TypeScript template, plus Expo Router | Only the libraries milestone 1 needs. The development build is made on the Mac with Xcode (`npm run ios`), so there is no Expo account and no EAS |
| Bundle ID | `com.albert.homewok` | The iOS OAuth client in Google Cloud is tied to it, so changing it means making a new client. Chosen 2026-11-10 |
| Login | Google only for now | Works on the iOS Simulator without a paid Apple account. Add Sign in with Apple before any App Review (App Store guideline 4.8) |
| Google sign-in | The free `@react-native-google-signin/google-signin` library shows Google's native account sheet and returns an ID token, and Supabase checks it with `signInWithIdToken` | No browser redirect. Only `src/features/auth/google.ts` uses the library, so replacing it stays a one-file change |
| Nonce check | "Skip nonce checks" is on for the Google provider in Supabase | The free library cannot pass a nonce on iOS, so Supabase would reject every sign-in. The cost: someone who steals a still-valid ID token issued to this app (about an hour) could replay it. Accepted for a personal app on 2026-11-10. Revisit together with Sign in with Apple before any App Review; the paid Universal version of the library supports nonces |
| Session storage | `localStorage` from `expo-sqlite`, as in Supabase's Expo guide | The session stays in the app's own sandbox. The Keychain (`expo-secure-store`) is stricter, but a session is larger than its 2 KB guideline and would need an extra encryption layer |
| Sign out | In Settings, a native sheet opened with the gear at the top right of every tab. It signs out this phone only | The saved session is removed first, so it works offline. Milestone 1's Settings holds only the account and Sign out. The gear was only on Tonight until 2026-11-11, when the user looked for it on the other tabs |
| App settings | Four public values in `.env.local`, which is not in git: the Supabase URL and publishable key, and the Google web and iOS client IDs | `src/lib/env.ts` stops the app with a clear message when one is missing, wrong, or a secret key. `docs/setup.md` has every step |
| Text size | All text grows with the iOS text size setting. Titles stop at the sizes iOS itself uses | React Native grows every text by one factor, which made a 34px title three times larger. The `Title` component caps large-title at 60/34, title-1 at 58/28, and title-2 at 56/22 of the default size, from Apple's Dynamic Type table. Chosen 2026-11-11. On 2026-11-18 list section headers got `title-3`, iOS's Title 3 in the system font, which stops at 55/20 from the same table |
| Demo mode | None | If the app ever goes public, use Supabase anonymous sign-in instead of a shared demo account |
| Sample data | A "Load sample kitchen" button in a Developer part at the end of the Settings sheet, which only exists in development builds (`__DEV__`) | Built 2026-11-18 (`HW-25`). Dates are relative to today, so there is always something expiring. The sample is data in `src/features/sample/sampleKitchen.ts`: 20 foods in the fridge, freezer, and pantry, with ground pork bought twice, one food past its date, and five to use within three days, plus four staples at Have, Low, or Out. Each purchase goes in through the same rule as a food added by hand, so the sample only holds rows the app could make itself. Loading it again replaces the purchases of the sample's foods instead of doubling them, and leaves every other food alone. A line under the button counts what the Kitchen list holds now. In Settings rather than on the Kitchen tab, because Settings opens from every tab and the Kitchen screen is still to be built (`HW-11`). Uses the hosted Supabase project, so no Docker is needed |
| Offline | TanStack Query v5 keeps a copy of the kitchen and shopping lists on the phone, and edits wait in a queue until the phone is online | Chosen 2026-11-12. It is free, needs no account, and the data stays in Supabase. Passed over: PowerSync (a separate service, $49 a month beyond its free plan, and the access rules must be written a second time there), Legend-State v3 (still a beta), TanStack DB (1.0 is a release candidate), and a hand-written SQLite copy (a small sync engine to maintain). It is a cache and a queue, not sync between devices: with family sharing, two phones changing the same row means the last one wins, so look again then. How it works: The Offline Copy and the Queue, under Data Model (`HW-53`) |
| Saving changes | Every action is one call to the database function `apply_changes`: the rows to save and the ids to remove, in one transaction | Checking off a shopping item saves a purchase and removes the item, and both happen or neither does. Sending a call twice ends in the same state, so a queued edit can be sent again safely. Undo sends the reverse changes. Chosen 2026-11-12. An action made of several rules, such as loading the sample kitchen, applies them one after another to a copy and sends the difference (`changesBetween`), so it is still one call with each row in it once (2026-11-18) |
| Row ids | Made on the phone with `expo-crypto` | A food added offline can be edited before it has reached the database. Ids made by the database would need temporary ids that are swapped later |
| Households | A database trigger on `auth.users` gives each new account a household, a membership, and ten starter staples | The app never sees someone who is signed in but has no household. One household per person for now: `household_members.user_id` is the primary key. The staples are salt, sugar, cooking oil, soy sauce, rice, cornstarch, sesame oil, rice vinegar, white pepper, and oyster sauce |
| Row-level security | Every table compares `household_id` with the signed-in person's household. A request that is not signed in has no privileges at all | Such a request gets an error and never an empty list, which could otherwise replace the copy on the phone with an empty kitchen. `supabase/tests/two_accounts.sql` proves it with two throwaway accounts and leaves nothing behind |
| Migrations | SQL files in `supabase/migrations/`, applied to the hosted project through the Supabase connector after the user has read them | No Supabase CLI, no local database in Docker, and no database password in a chat. Chosen 2026-11-12. An applied file is never edited: a change is a new file with a later name. The connector records a migration under the time it ran, so the first file, `20261112000000_kitchen_and_shopping.sql`, is version `20261118015757` in the database (applied 2026-11-17, `HW-24`), and `20261118000000_known_units_and_unique_names.sql` is version `20261118233705` (applied 2026-11-18, `HW-60`). File names only set the order. If the Supabase CLI is ever used, repair its history first (`supabase migration repair`) |
| Outside data | Checked with `zod` before use: rows from Supabase, and the copy saved on the phone with its waiting changes | A row in an unexpected shape is a clear failure and never a wrong amount. A test keeps the checks equal to the columns in the migration, and the app reads exactly the columns its checks know |
| Date picker | `@react-native-community/datetimepicker`, the native iOS calendar | Expo's `@expo/ui` has a compatible component, so changing later is one import |
| Code hosting | A private GitHub repo. Since 2026-11-16 each piece of work is a branch and a pull request: Claude commits, pushes, and opens it with the GitHub CLI (`gh`), signed in as the user. The user reads the diff on GitHub, tries the branch on the Simulator when it changes the app, and merges | Chosen 2026-11-11, replacing local git only. The merge is the user's approval: Claude never merges, never pushes to `main`, and never force-pushes. No AI co-author line, so Claude does not show up as a contributor: GitHub counts commit authors and co-author lines, not who pushes. Until 2026-11-16 Claude used no GitHub tools: on 2026-11-09 there was no repo yet, and on 2026-11-11 the Mac had no `gh`. A signed-in `gh` reaches every one of the user's repos, so Claude only touches this one. Limits: GitHub does not let an author approve their own pull request, so the merge itself is the approval, and GitHub Free cannot require pull requests on a private repo (GitHub Pro can), so the rule is ours to keep |
| CI | GitHub Actions runs `npm run check` on every pull request and every merge into `main` (`.github/workflows/check.yml`), and the AI server's tests once it exists | In place since 2026-11-16 (`HW-21`). CI (continuous integration) means a clean machine checks every push: the pass comes from GitHub on the exact pushed commit, and a file left out of a commit fails there. Not on a push to just any branch: a push to a pull request's branch would then run twice, once for the push and once for the pull request, and every branch here gets a pull request. The machine matches the Mac where it matters: Node 24, and the Mac's time zone, because the date tests about clock changes only test something in a zone that has them. `npm run typecheck` generates the route types itself, because a clean machine has none, and without them a wrong route name passed the type check. Expo's usage data is turned off, and a stuck run stops after 10 minutes. Free for this repo: GitHub Free includes $12 of runner time a month for private repos, about 2,000 minutes on Linux, and one run takes a minute or two. The checks reach no outside service, so CI needs no secrets. GitHub Free cannot require a green check before a merge on a private repo (GitHub Pro can), so the user looks for it on the pull request before merging. Claude reads the result with `gh pr checks` and fixes a failure before asking for a review. From the deploy step on, the same pipeline also deploys the AI server (CD, continuous delivery) |
| Design | Design system first, built on Apple's iOS defaults (Human Interface Guidelines) plus the Homewok personality | Direction A, Persimmon kitchen (chosen 2026-11-09). Linen background (#F4EDE3), serif titles (`ui-serif`) with system body text, warm charcoal dark mode. Components: capsule buttons, inset grouped lists, use-soon pills, the native iOS tab bar, and SF Symbols. Published as the Homewok design system: https://claude.ai/artifact/WCfXhKPjTHYSUJrDqFKe7k |
| Google button | Follows Google's branding guidelines | Full-color G logo, white fill with a #747775 outline in light mode, Google's dark style in dark mode. The one control that does not use Homewok tokens |
| Login screen | Shelf layout with one doodle: the wok stands on a short drawn shelf line, then the name and the tagline "All wok, no work.", all centered a little above the middle, with a 32px page margin | Shelf layout chosen 2026-11-10. Changed from four doodles to the wok alone on 2026-11-11: four in a row were crowded at phone width, and the page looked empty yet tight at the sides. On 2026-11-12 the user kept the steaming wok as it is, over the same wok with the app icon's roof and over the icon itself |
| Tabs | Tonight, Kitchen, Shopping, Recipes | Recipes has its own tab from the start so the layout never changes. Chosen 2026-11-10 |
| Design files | `design/` in the project is the source; the artifact is the viewer | Edit `design/`, then republish the artifact |
| Illustrations | Ink doodles of food, in Homewok's own style. Every empty screen has one of its own | Loose hand-drawn lines. Only on login, empty screens, setup, and badges, never on lists. Not copied from any brand. The four tabs show eggs, scallions, a grocery bag, and a rice bowl. The grocery bag was drawn on 2026-11-12, after the user saw that Shopping was the one tab without a doodle: a set of screens either all have one or none do, and `EmptyState` now requires one |
| App icon | A roof over a wok on a linen tile: the name, drawn. The roof is ink and the wok is persimmon. Kept as an Icon Composer file, `design/icon/AppIcon.icon`, that `app.config.ts` points at | Chosen 2026-11-11 over a steaming wok and a wok whose lid is the roof part of the Chinese character for home. Among 69 food apps on the App Store the usual icon was a white bowl on an orange-red tile, none had a roof, and a linen tile stood out. Persimmon is on the wok, not the roof, so the icon is not taken for Apple's Home app. The colors are the `canvas`, `ink`, and `accent` tokens with their dark values, and a test keeps them equal. The layers are flat, with no glass. The file sets each layer's color for every mode, because iOS left to itself kept the ink color on the dark tile, where it disappears. The icon does not appear inside the app (2026-11-12): Apple's guidelines advise against repeating a logo on working screens and against a logo on the launch screen, so the launch screen is a plain canvas color and the login page keeps its steaming wok. The system already shows the icon on the Home Screen, in notifications, in search, and in the app switcher |
| AI | Gemini API, called through one small `ai` module in the AI server | Kept on 2026-11-16. No self-hosted model. The model name is a setting, so trying another one is a one-line change. The user does not mind Google using what is sent on the free tier, receipts and kitchen photos included (2026-11-16). Still, the plan is the paid tier from milestone 3, because the free tier's daily limits (20 requests a day for `gemini-2.5-flash-lite` on 2026-11-04) and frequent 503 errors would stall development and testing. It runs on Prepay, so spending stops at the balance. The limits are under Still Discussing |
| Photos | A receipt, or the groceries laid out on a table: the phone shrinks the photo, and the AI server sends it to the vision model and asks for structured JSON | Milestone 6. Table photos were added on 2026-11-16 and share the receipt's upload and review screen. Adds `expo-image-picker` and `expo-image-manipulator`, Expo's own free libraries with native code, so the development build is rebuilt. The model can also say where each item is in the photo, for numbered marks drawn with `react-native-svg`. Compare Flash-Lite models on 10 real receipts and 10 real table photos before settling on one |
| Push | Expo push service over APNs | Needs the paid Apple Developer Program |
| Units | Store grams and ml, display lb, oz, and fl oz | Adding metric later only changes the display |

## iOS Cost Path

- **$0:** iOS Simulator on the Mac mini, and installing on your own iPhone through Xcode with a free Apple ID (the app stops working after 7 days and must be reinstalled).
- **$99 a year (Apple Developer Program):** required for TestFlight, remote push notifications, and Sign in with Apple. Pay when the daily notification step needs it.

## Data Model (Draft)

- `ingredients`: one per household. Name, aliases, category, tracking type (`weight`, `volume`, `count`, or `level`), and status (`have`, `low`, `out`) for `level` items. Created automatically the first time a food is added.
- `batches`: one purchase. Remaining amount, optional display label ("block", "stalk"), storage, optional spot ("Drawer 2"), date, date source (sell-by, use-by, best-by, estimated), and whether the amount is an estimate.
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
- **A purchase can note its spot** (2026-11-17): `batches.spot`, and `ingredients.usual_spot` for the food's last one. They went into the migration file itself, since it had not been applied yet. It was applied on 2026-11-17 (`HW-24`). See Storage and Spots.
- **The database knows the units, and each name once** (2026-11-18, `HW-60`, in the second migration). `batches.unit`, `ingredients.usual_unit`, and `shopping_items.unit` only take `lb`, `oz`, `fl oz`, `cup`, `gal`, or `count`, like storage and status already did. Before, any unit of 1 to 12 characters got in, and a wrong one such as `lbs` was only caught when the app read the household, so the whole Kitchen failed to load. Now the write is refused, the queue undoes it on screen with its alert, and everything else keeps working. And a unique index on `ingredients (household_id, lower(name))` stops one household from having "Ground pork" and "ground pork". The app already looks for the food before adding one, but two phones offline or a server that writes foods could get past that and split the purchases between two foods. Two households can still each have a food of the same name. The index only matches the app's rule because every path that saves a name saves it cleaned (`cleanName` in `src/features/kitchen/stock.ts`). Merging two foods that slipped past it belongs with family sharing.
- **The cost: a new unit needs a small migration.** It is still one line in `src/data/units.ts`, plus a migration that drops the three unit checks and adds them again with the longer list. New units are rare, and `src/data/units.test.ts` fails until the newest unit checks in `supabase/migrations/` equal `UNITS`.

### The Offline Copy and the Queue

Built on 2026-11-17 (`HW-53`). Every screen from `HW-11` on reads and saves through it.

- **Two hooks.** `useHousehold` in `src/data/household.ts` gives a screen the household's rows, and `useSaveChanges` saves one action's Changes. Underneath, the rows are one TanStack Query query, and each saved action is one call of `apply_changes`.
- **An edit shows at once.** Until the database confirms a change, screens show the copy with the waiting changes applied on top. The copy itself only takes a change once it is confirmed, so a refused change simply stops being applied: it is undone on screen without any rollback code, and an alert says so.
- **One at a time, in order.** Changes go out one after another, in the order they were made. A temporary problem is tried again for as long as it takes, at most 30 seconds apart: no answer at all, a sign-in that is being renewed (401), a request to come back later (408 and 429), or trouble on the server's side (500 and up). Any other answer refuses the change, and the queue goes on with the next one. Sending a change twice is safe, because `apply_changes` then ends in the same state.
- **The copy on the phone** (`src/data/savedCopy.ts`) holds the rows and every change the database has not confirmed, also one that was on its way when the app closed. It is written at most once a second into the app's own SQLite store and never expires, so a change made offline waits as long as it takes. When the app reads it back, the rows and the changes are checked with `zod`, and a copy that fails is thrown away whole.
- **One account at a time.** The copy is marked with its account. Signing out leaves it on the phone, so the same account signing in again gets its waiting changes back, and another account's sign-in throws it away. A change is only sent while the account that made it is the one signed in.
- **Offline** comes from `expo-network`, and whether the app is on screen from React Native's `AppState`. Without a connection nothing is sent and nothing is read. Both start again once the phone is back online or the app is back on screen.

### Amounts

- Code only knows three amount kinds: weight, volume, and count. A label such as "stalk" is display text, and no logic depends on it.
- **Using food by hand (2026-11-21, `HW-15`):** nothing asks how much was used. A Kitchen row offers Used up and Used some. Used up removes the purchases in that row's storage and asks whether to add the food to the shopping list, with the last amount bought. Used some takes half of what is left and marks it as a guess, with "~". Counting each cup of milk is more effort than opening the fridge, so exact amounts come off only with Cooked it, from the recipe.
- Deduction rule, used by Cooked it (milestone 4): same kind and same label means subtract. Anything else means ask None, Some, or All. "Some" takes half of what is left and marks the amount as an estimate.
- A deduction takes from the purchase with the soonest date first. Amounts that cannot be added, such as 1 bunch and 3 stalks, are shown side by side and halved separately by "Some" (2026-11-12).
- Each unit is one line of data in `src/data/units.ts`: its size in the base unit, its word, its stepper step, and its one-tap amounts. A total across purchases uses the largest of their units. Since `HW-60` the database also checks the unit, so a new one needs a small migration too (see What milestone 2 built).
- Using a food up keeps the food, with its usual purchase, and asks whether to add it to the shopping list. Removing a food's last purchase removes the food too, so a food added by mistake leaves nothing behind (2026-11-12).

## Where Logic Lives

| In code (pure functions with tests) | In the LLM (output validated by code) |
| ----------------------------------- | ------------------------------------- |
| Which foods are use-soon, soonest-date-first deduction | Writing recipes in a chosen cuisine |
| Allergen filter and checks on generated recipes | Reading receipts and pages into structured data |
| Safe-date rules, including caps for raw meat, poultry, and seafood | Expanding "ORG BNLS CHKN" to chicken breast |
| Notification timing and back-off, rate limits | Parsing "half a cabbage" into an amount |
| Unit display, cuisine rotation | First guess at a new food's category and shelf life |

The code is in two languages, and each rule lives in only one of them (2026-11-16). Kitchen rules, such as use-soon, deduction, dates, and units, are TypeScript in the app. Checks on what the AI sends back, such as the allergen filter, which foods a recipe may use, and the rate limits, are Python in the AI server. The app sends the server what it has already worked out, such as the use-soon list, so no rule is written twice.

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
- Cooking without a recipe uses Used some or Used up on the ingredient. Staples are not deducted.
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

- Receipt photo, a photo of the groceries on a table, online order screenshot, and text or voice with several items at once. Package label photo and barcode come later.
- Receipts always get a review screen, and only flagged lines need fixing. Fixing a line saves it as an alias for next time.
- A photo of a table of groceries (2026-11-16) uses the same review screen. The model names and counts what it can see and reads printed labels, such as the weight on a meat package. It cannot weigh food, so other amounts are the last amount bought or the typical pack size, shown with "~", and dates are estimates. It misses food that is hidden, stacked, or in a closed bag, and it confuses look-alikes such as Shanghai bok choy and baby bok choy.
- Manual entry: one quick-add line takes several foods at once ("ground pork 1 lb, 10 eggs"), and each becomes a row with the category and date filled in. A "Recent" row adds a past purchase again with one tap.
- Tapping a row opens the edit sheet for its purchase. A food with several purchases first lists them, and the person picks the one to edit (2026-11-21, `HW-13`). A Delete button at the bottom of the sheet, with a confirmation, removes that purchase (`HW-16`). The sheet has: amount stepper, unit toggle (lb, oz, count), quick amount chips, storage (Fridge, Freezer, Pantry), an optional spot, and an estimated date that can be changed. The same sheet is the manual form when AI is unavailable.
- **The add button (2026-11-18):** a + in the title row, just left of the Settings gear, on the tabs that add things: the Kitchen now, Shopping later. It opens the edit sheet empty, and the empty kitchen's `EmptyState` has an Add food button that does the same. iOS apps with a tab bar put a screen's add button at the top right, as Clock, Calendar, and Contacts do, and the gear stays at the far right of every tab. Passed over: a round floating + above the tab bar, which comes from Android's Material Design, would cover the amounts at the right of the rows, and would crowd the end of the tab bar, where iOS 26 puts a search tab; and Expo Router's bar above the tab bar (`NativeTabs.BottomAccessory`), which every tab shares. The cost is reach: the top right is far for one thumb on a big phone, which the empty state's button and milestone 3's quick add make up for.
- **Adding by hand (2026-11-19, `HW-12`):** the edit sheet opens as a native form sheet with a name field, the amount (stepper, unit control, and one-tap amounts), storage, and the estimated date, then Save. What it shows is worked out in `src/features/kitchen/sheetDraft.ts`. A name the household already knows fills in that food's usual purchase as it is typed: eggs show a count with no unit control, and tofu shows "2 blocks". A food bought for the first time offers lb, oz, and count (`NEW_FOOD_UNITS` in `src/data/units.ts`) and starts at 1 lb in the fridge. A liquid gets fl oz, cup, and gal once the household knows it, from the sample kitchen for now or later from quick add, and a new counted food has no word of its own yet (`HW-64`). Changing the unit keeps the number. Typing a staple's name adds a purchase, which turns the staple into a food with an amount (`addPurchase`, since 2026-11-12). The date line uses the Kitchen list's words, "Use by about Nov 26", instead of the design preview's weekday plus "estimated", because a guessed date names no weekday.
- The quick-add line is read only after the user taps the arrow, never while typing, and takes about 1 to 3 seconds. The same box can add more rows before confirming.
- The edit sheet runs entirely on the phone with no AI call, so it opens and saves instantly. The screen updates first and the save happens in the background, and a failed save reverts and says so.
- Dates: estimated by default, typed in the sentence ("chicken thighs expire Friday"), or set in the edit sheet with chips (Tomorrow, In 3 days, In a week) or a calendar. Package label scanning comes later.
- Until milestone 3 guesses a shelf life for each food, the estimate depends only on the storage place: 7 days in the fridge, 90 in the freezer, and 180 in the pantry, kept as data in `src/data/storages.ts`. Moving a purchase to another place estimates the date again (2026-11-12).
- Voice (proposed): record with `expo-audio` and send the audio to Gemini with the item schema in one call. Gemini counts 32 tokens per second of audio, so a 10-second list costs a small fraction of a cent. No on-device Whisper: splitting speech into foods needs the LLM, which is online anyway. A free on-device option is Apple's SpeechAnalyzer (iOS 26) through a community module, if testing shows it is good enough.
- Amounts are never required. A food added without one takes the last amount bought, or the typical pack size the AI guessed in the same call, shown with "~". Receipts and shopping list items carry their own amounts.
- The edit sheet shows only the units for the food's kind, from one constant list in code: weight shows lb and oz, volume shows fl oz, cup, and gal, counted foods show their own label with no unit control, and staples show Have, Low, and Out.
- Offline: the kitchen and shopping lists stay readable without a connection, and check-offs and edits wait in a queue until the phone is online. Typed or spoken lists are kept and read once online. The approach was chosen on 2026-11-12: see Offline and Saving changes under Technical.

### Storage and Spots

- **Storage** is one of Fridge, Freezer, and Pantry. It groups the Kitchen list, sets the estimated date, and is remembered per food as `usual_storage`, so it stays a fixed list of three.
- **Spot** (2026-11-16) is an optional label for where in that storage a purchase sits, such as "Drawer 2" or "Garage freezer". It is display text, like the labels "block" and "stalk", and no logic depends on it. A food remembers its last spot as `usual_spot`, and the edit sheet offers the spots already used in that storage as chips, so the spelling stays the same. A spot holds 1 to 30 characters (2026-11-17), enough for "Basement chest freezer", and a spot left empty is saved as none.
- Passed over: tags, because a purchase is in one place at a time, and a hierarchy of shelves and drawers, which needs its own setup screen, adds taps to every entry, and goes stale when food is moved. If the garage freezer should one day be its own group in the Kitchen, the next step is named storage places, each one a kind of fridge, freezer, or pantry, still one level deep.

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
- **Gemini spending limit** (proposed 2026-11-16, to confirm before milestone 3). Prepay $5 with auto-reload off, so the balance is the hard limit: at $0, every key on that billing account stops with an error instead of charging more. A Google Cloud project only for Homewok, with a monthly spend cap of $3, so other projects such as pantry-ai do not share its quota and a runaway loop stops early (the cap can overshoot by about 10 minutes of use). In the AI server: a daily cap of 200 AI calls and an output token cap on every call. For Claude's testing: up to 50 calls a day without asking, reported with the count; larger runs, such as the model comparison in milestone 6, only after the user's go-ahead with the count and a cost estimate. At 2026 Flash-Lite prices, a quick add costs under a tenth of a cent, and a photo or a recipe under a cent. Prepaid credits expire after 12 months.
- The Google button's font: Google's guidelines name Google Sans Medium at 14/20. The app uses the iOS system font at that size and weight, so no font file is bundled. Decide before any App Review.
- Standing out: the linen, serif, and persimmon palette is common in AI-generated designs. Identity has to come from Homewok's own doodles, the drawn shelf line, the copy (for example the tagline "All wok, no work."), and one food-specific detail to pick later. The app icon's roof over a wok is the first mark of its own (2026-11-11). Avoid copy that frames dinner as homework or a task.

## Dropped

- **Daily draw (2026-11-09):** a game that reveals tonight's pick. Too complex and not rewarding enough. The reward lives in memories and badges instead.
- **Kubernetes, Kafka, and Triton (2026-11-13):** from a list of AI engineering tools the user was given before Homewok. One small server for one household needs none of them. From the same list, FastAPI, Docker, AWS, and CI/CD are in the plan. RAG, agents, LoRA, vLLM, and Redis come in only when a feature needs them or as a one-off experiment, and MLflow is considered when the AI's output is evaluated, such as the model comparison in milestone 6.

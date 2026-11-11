# Dev Log

## 2026-11-11

- **Milestone 1 (login) works on the iOS Simulator.** The user signed in with Google on iPhone 18 Pro. The app stayed signed in after it was quit and reopened three times, the four tabs and the Settings sheet open, and Sign out returns to the login page and stays signed out after a restart. Not tried: signing in a second time after signing out, which needs the user's Google account.
- Fixed what the Simulator showed on the signed-in screens. At the largest text size a screen title broke in the middle of a word and the empty state ran over it. Titles now go through a `Title` component that stops growing at the sizes iOS itself uses, tab screens scroll and end above the tab bar, the gear lines up with the screen's gutter, the Settings sheet no longer adds the bottom inset twice, and a long email keeps to two lines.
- Reworked the login page after the user found it empty yet tight at the sides, with a crowded shelf. It now shows one doodle, the wok, on a short drawn shelf at 1.25 times its drawn size, with the name and the tagline centered under it, a 32px page margin, and the group a little above the middle. The user still has to choose between this and a three-doodle shelf. `design/README.md` and the design system artifact wait for that choice.
- Checked on iPhone 17e, 18 Pro, and 18 Pro Max, in light and dark mode, at the default and the largest text size: the login page, the Tonight tab, and the Settings sheet. Only the 18 Pro had a session, so on the other two the sign-in check was switched off in code for the screenshots, with a 60-character test email, and switched back on. Kitchen, Shopping, and Recipes were looked at on the 18 Pro before the `Screen` change; they share that component.
- Known and left alone: signing out while the sheet is open logs a router warning in development (the screen still ends on the login page), and at the largest text size the Google button's label takes three lines. `npm run check` passes with 26 tests.
- **First commit.** `git init` ran on 2026-11-10, but nothing had been committed, so there was no point to go back to. The first commit holds everything up to here: milestone 1, `design/`, and the docs. Its author is the user, and it has no AI co-author line. The user publishes it to a private GitHub repo from VS Code, and from now on every verified task ends with a suggested commit (rule 5 in `CLAUDE.md`).

## 2026-11-10

- Chose all recommended components and published the Homewok design system as a claude.ai artifact: tokens for light and warm charcoal themes, serif titles, nine components with previews, and four ink doodles.
- Documented the one-tap shopping list, optional amounts, the units shown per kind, the offline approach, and the Google button rule. Decided against on-device Whisper.
- Wrote the first draft of `docs/spec.md`: v1 scope, screens, six milestones with what "done" means, and open questions. The build order in `docs/decisions.md` now points to it.
- Chose the Shelf login layout and the tagline "Tonight's homewok is ready.". Settled on three tabs with Recipes opened from Tonight, and changed v1's finish line to the six milestones. Copied the design system sources into `design/`. The name is under review.
- Gave Recipes its own tab from the start (four tabs), so the layout never changes later.
- Kept the name Homewok and chose the tagline "All wok, no work." to take the pressure out of the homework sound. Planning is finished; building starts with milestone 1 in a new session.
- **Milestone 1 (login) started.** The user approved the spec and the dependency list. Created the Expo SDK 58 app from the blank TypeScript template plus Expo Router, ran `git init`, and installed CocoaPods. `react-dom` is in `package.json` only so npm stops pulling a newer copy that conflicts with Expo's React.
- Built the login page (four doodles on a drawn shelf, the name, the tagline, and Google's button), Google sign-in through Supabase `signInWithIdToken`, a session that is kept across restarts, the four native tabs with placeholder empty states, and a Settings sheet with Sign out.
- Added `src/theme/theme.ts`, mirrored from `design/tokens.json`. Tests fail when the theme or the doodles drift from `design/`. 26 tests in all, also covering the `.env.local` checks and every sign-in and sign-out outcome. `npm run check` passes and is now in `CLAUDE.md`.
- Wrote `docs/setup.md` and recorded the new decisions: bundle ID, the sign-in library, Skip nonce checks, session storage, sign-out, and where the app settings live.
- Known limit, to fix with the offline work in milestone 2: opening the app offline more than an hour after the last use waits about 30 seconds on the launch screen and then shows the login page. The saved session is kept, and the app recovers once online.
- Checked on the iOS Simulator (Xcode 27.2, iOS 27.2): the development build compiles with the real settings, and the login page looks right on the smallest and largest iPhones (17e and 18 Pro Max), in light and dark mode. At the largest accessibility text size it scrolls and nothing is cut off, though the serif title grows about three times, more than iOS's own titles do. Not checked yet: Google sign-in, staying signed in after a restart, the tabs, and Sign out.

## 2026-11-09

- Planning only, no app code. Confirmed Google-only login for now and no demo mode.
- Drafted designs for planned dinners, leftovers, notification content order, and memories and rewards. Listed a daily draw and a design-first workflow as proposals still under discussion.
- Later the same day: dropped the daily draw, gave badges bronze, silver, and gold tiers, and replaced "money saved" with food value that can actually be measured. Added "Skip tonight" and "Leave out" for foods the user does not want today, and takeout leftovers.
- Decided on a development-only sample data button, no GitHub connector, and a design system built on iOS defaults. Started the design system by showing three visual directions.
- Design system step 2 chosen: Linen background, serif titles, warm charcoal dark mode, and ink doodles. Documented the quick-add flow, date setting, the proposed voice approach, and price sources for a rough cost per serving.
- Chose direction A, Persimmon kitchen, with hand-drawn food doodles as the illustration style. Documented manual entry, data in any language, and a proposed cost-per-serving stat. Checked that no leftover instruction files from other AI tools affect Claude in this project.

## 2026-11-06

- Recorded the login page as the first thing to build. The full scope is intentionally not written yet.
- Narrowed the plan to iOS only and English only, and removed all Chinese from the project.
- Chose the Gemini API over a self-hosted model.
- Simplified the draft data model: no food catalog, no units table, and no separate condiments table. Foods and units are data, not code.

## 2026-11-05

- Created the project folder after the planning discussion moved here from `pantry-ai`. Chose the name Homewok.
- Wrote `CLAUDE.md` and `docs/decisions.md`. There is no app code or git repository yet. Git starts when the Expo project is created.

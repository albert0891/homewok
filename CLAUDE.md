# Homewok — Project Rules for Claude Code

Homewok is a personal iOS app for Chinese families in the US. It keeps track of what is in the kitchen and suggests tonight's dinner from it.
Talk to the user in Traditional Chinese. Everything in the project (code, comments, UI text, and docs) is in English. The app has no multi-language layer.

**Status:** v1 is being built one milestone at a time from `docs/spec.md`. The newest entry in `docs/dev-log.md` says which milestone is current and what has been verified. The old `pantry-ai` project is a separate folder, and nothing is carried over from it unless the user asks.

## Docs Map

| File                | Owns                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| `CLAUDE.md`         | How the AI must work.                                                                |
| `docs/spec.md`      | The v1 scope: what is in and out, the screens, the milestones, and when each is done. |
| `docs/decisions.md` | Product and technical decisions, and what is still open. Update it when one changes. |
| `design/`           | Design system sources: `tokens.json`, the brand book `README.md`, component guidelines, doodles, and the app icon. Read before building UI. |
| Homewok design system | The viewer for `design/` with live previews: https://claude.ai/artifact/WCfXhKPjTHYSUJrDqFKe7k. Republish it after changing `design/`. |
| `docs/dev-log.md`   | Dated log of what was done and why. Update it after each completed task, unprompted. |
| `docs/setup.md`     | One-time setup of Xcode, Supabase, Google sign-in, and `.env.local`, and how to build and run the app. |
| Jira space `HW`     | https://albert0891.atlassian.net/browse/HW. Each milestone's epic, with its stories and their acceptance checks, tasks, and bugs, and what the user has signed off. See rule 7 under Working With the User. |

## Current Focus

This is a personal project for now. Focus on feasible, great features. Do not bring up pricing, marketing, company setup, or market validation unless the user asks.

## Working With the User

1. **Plain language:** explain in plain Traditional Chinese, and define a technical term the first time it appears, starting from what it does for this project. Mix the important English terms into the Chinese replies, because the user is also learning English.
2. **New dependencies:** before adding a third-party service or library, explain what it is, why it is needed, the realistic alternatives, its cost and lock-in, and any new accounts or secrets. Then let the user decide.
3. **No yes-man behavior:** if a suggestion is suboptimal, say so, explain why, and propose something better. When you agree, explain why it is good practice.
4. **Teach:** the user is learning React Native while building this. After significant code changes, end the reply with a walkthrough in Traditional Chinese: which files changed, what the new code means, and how the logic works.
5. **Git and pull requests:** the code is in a private GitHub repo, and `gh` is signed in as the user. Do each piece of work on its own branch, named after its Jira key when it has one (`HW-12-spot-label`). Commit only the files that belong to it, push the branch, and open a pull request with `gh pr create`, its title starting with the key. In the description, say what changed, how to try it, and what was not verified. Never push to `main`, never force-push, and never merge: the user reads the diff on GitHub and merges, and the merge is their approval. After a merge, switch back to `main` and pull. Use `gh` only for this repo. When the user has signed off a milestone (rule 7), suggest a tag such as `m1-login`. Never add AI attribution to commits or pull requests.
6. **Real API calls:** ask before calling a paid or quota-limited API, and say how many calls it will take.
7. **Milestone sign-off in Jira:** before a milestone's code starts, draft its cards in the backlog of the Jira space `HW`, ordered so the top card is the next one. Stories get acceptance checks: short Given / When / Then steps the user can try on the Simulator or the phone. The user approves a card by dragging it from the backlog list onto the board; a status change alone does not put a card on the board. When the user says "do the next card", read the board and take the top card in To Do: one card per request, one branch and one pull request per card. Move it to In Progress when you start, and to In Review when its pull request is open, with a comment on how to try it. Work the user asks for in chat without a card is approved by the request: create the card, ask the user to drag it onto the board, and start. Anything out of scope that comes up becomes a new backlog card, named in the report, never done on the side. Never move anything to Done, never delete anything, and ask before changing checks the user approved. A milestone is done only when the user has moved everything in its epic to Done and CI passes on the last merged commit. Details are in `docs/decisions.md` under Milestone Sign-off.

## Engineering Rules

1. **Keep it small enough for a human:** the user must be able to read and maintain all of this code. Prefer fewer concepts. Foods, units, and condiments are data, never code branches, so words like "tofu" or "stalk" do not appear in logic.
2. **Code decides, the LLM writes:** anything that must be correct or repeatable is code. The LLM only writes recipes and interprets messy input, and its output is validated before use.
3. **Mobile is the product:** iOS only for now. Check small screens, the keyboard, safe areas, and the longest realistic content. If you could not verify on a simulator or device, say so.
4. **No happy-path only:** never assume external input, LLM output, or network requests succeed. Validate external data with `zod` in the app and Pydantic in the AI server, use structured AI output, and show a failure as a failure, never as a made-up answer.
5. **Gate every AI call on the AI server** (`server/`, Python and FastAPI): authenticate, validate and bound the input, check the rate limit, then call the provider with a time limit and an output token cap. API keys never ship in the app.
6. **Safety lives in code, not prompts:** allergen filtering, choosing which ingredients may be suggested, and checks on generated recipes are enforced by code.
7. **Test pure logic:** stock deductions, unit conversion, date rules, and AI output parsing. Write the test first when changing core logic. The AI server's logic is tested with pytest. UI is verified on a simulator or device.
8. **Data-driven rendering:** no nested ternaries that map values to labels in JSX. Keep mappings and options in constants, and generate repeated elements with `.map()`.
9. **Deep modules:** keep a feature's state, data calls, and UI together. Route files only handle layout and composition.
10. **Before pushing:** run lint, type check, and tests on the exact commit, and keep the git index consistent with the working tree. `npm run check` runs all three and stops at the first failure:
    - `npm run lint` runs ESLint through `expo lint`.
    - `npm run typecheck` runs `tsc --noEmit`. Route names are only checked after the dev server or `npx expo customize tsconfig.json` has generated the route types.
    - `npm test` runs Jest once.
    - Once `server/` exists, its pytest tests must pass too.
    - Once CI exists (milestone 2), GitHub runs the same checks on every pull request. Check them with `gh pr checks`, and fix a failure before asking the user to review.
11. **One rule, one language:** kitchen rules (amounts, units, dates, use-soon) are TypeScript in the app, and checks on AI output are Python in the AI server. Never write a rule in both: the app sends the server what it has already worked out.

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
| `design/`           | Design system sources: `tokens.json`, the brand book `README.md`, component guidelines, and doodles. Read before building UI. |
| Homewok design system | The viewer for `design/` with live previews: https://claude.ai/artifact/WCfXhKPjTHYSUJrDqFKe7k. Republish it after changing `design/`. |
| `docs/dev-log.md`   | Dated log of what was done and why. Update it after each completed task, unprompted. |
| `docs/setup.md`     | One-time setup of Xcode, Supabase, Google sign-in, and `.env.local`, and how to build and run the app. |

## Current Focus

This is a personal project for now. Focus on feasible, great features. Do not bring up pricing, marketing, company setup, or market validation unless the user asks.

## Working With the User

1. **Plain language:** explain in plain Traditional Chinese, and define a technical term the first time it appears, starting from what it does for this project. Mix the important English terms into the Chinese replies, because the user is also learning English.
2. **New dependencies:** before adding a third-party service or library, explain what it is, why it is needed, the realistic alternatives, its cost and lock-in, and any new accounts or secrets. Then let the user decide.
3. **No yes-man behavior:** if a suggestion is suboptimal, say so, explain why, and propose something better. When you agree, explain why it is good practice.
4. **Teach:** the user is learning React Native while building this. After significant code changes, end the reply with a walkthrough in Traditional Chinese: which files changed, what the new code means, and how the logic works.
5. **Git:** the code is in a private GitHub repo. The user commits and pushes from VS Code unless they ask Claude to commit. Treat every completed and verified task as a checkpoint: list exactly what to commit and what to leave out, and suggest a one-line commit message. When a milestone is done, suggest a tag such as `m1-login`. Never add AI attribution to commits or pull requests.
6. **Real API calls:** ask before calling a paid or quota-limited API, and say how many calls it will take.

## Engineering Rules

1. **Keep it small enough for a human:** the user must be able to read and maintain all of this code. Prefer fewer concepts. Foods, units, and condiments are data, never code branches, so words like "tofu" or "stalk" do not appear in logic.
2. **Code decides, the LLM writes:** anything that must be correct or repeatable is code. The LLM only writes recipes and interprets messy input, and its output is validated before use.
3. **Mobile is the product:** iOS only for now. Check small screens, the keyboard, safe areas, and the longest realistic content. If you could not verify on a simulator or device, say so.
4. **No happy-path only:** never assume external input, LLM output, or network requests succeed. Validate external data with `zod`, use structured AI output, and show a failure as a failure, never as a made-up answer.
5. **Gate every AI call on the server:** authenticate, validate and bound the input, check the rate limit, then call the provider with a time limit and an output token cap. API keys never ship in the app.
6. **Safety lives in code, not prompts:** allergen filtering, choosing which ingredients may be suggested, and checks on generated recipes are enforced by code.
7. **Test pure logic:** stock deductions, unit conversion, date rules, and AI output parsing. Write the test first when changing core logic. UI is verified on a simulator or device.
8. **Data-driven rendering:** no nested ternaries that map values to labels in JSX. Keep mappings and options in constants, and generate repeated elements with `.map()`.
9. **Deep modules:** keep a feature's state, data calls, and UI together. Route files only handle layout and composition.
10. **Before saying ready to push:** run lint, type check, and tests on the exact commit, and keep the git index consistent with the working tree. `npm run check` runs all three and stops at the first failure:
    - `npm run lint` runs ESLint through `expo lint`.
    - `npm run typecheck` runs `tsc --noEmit`. Route names are only checked after the dev server or `npx expo customize tsconfig.json` has generated the route types.
    - `npm test` runs Jest once.
